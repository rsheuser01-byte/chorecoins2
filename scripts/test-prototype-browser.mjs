// No test framework dependency: exercise real React DOM with Chrome over CDP.
// Requires Node >=22 (built-in WebSocket), locked npm dependencies, and Chrome.
import { createServer } from 'vite';
import { spawn, execFileSync } from 'node:child_process';
import { mkdtemp, readFile, rm, access } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
let server, browser, socket, profile;
const pending = new Map();
let sequence = 0;
const errors = [];
function command(method, params = {}) {
  const id = ++sequence;
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => { pending.delete(id); reject(new Error(`CDP timeout: ${method}`)); }, 15000);
    pending.set(id, { resolve: value => { clearTimeout(timer); resolve(value); }, reject: error => { clearTimeout(timer); reject(error); } });
    socket.send(JSON.stringify({ id, method, params }));
  });
}
async function chromePath() {
  if (process.env.CHROME_BIN) { await access(process.env.CHROME_BIN); return process.env.CHROME_BIN; }
  for (const name of ['google-chrome', 'google-chrome-stable', 'chromium', 'chromium-browser']) {
    try { return execFileSync('which', [name], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim(); } catch { /* try next installed browser */ }
  }
  throw new Error('Chrome is required, not skipped. Install Chrome or set CHROME_BIN.');
}
try {
  if (typeof WebSocket === 'undefined') throw new Error('Use Node >=22 for the built-in WebSocket client.');
  const executable = await chromePath();
  server = await createServer({ root, configFile: path.join(root, 'tests/local-browser/vite.config.ts'), mode: 'test', logLevel: 'error' });
  await server.listen();
  profile = await mkdtemp(path.join(tmpdir(), 'chorecoins-browser-test-'));
  browser = spawn(executable, [
    '--headless=new', '--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage',
    '--disable-background-networking', '--disable-default-apps', '--no-first-run',
    '--no-default-browser-check', '--remote-debugging-port=0',
    `--user-data-dir=${profile}`, 'about:blank',
  ], { stdio: ['ignore', 'ignore', 'pipe'] });
  let launchError;
  browser.on('error', error => { launchError = error; });
  // Drain browser diagnostics; never echo arbitrary page/env content.
  browser.stderr.on('data', () => {});
  let port;
  const launchDeadline = Date.now() + 15000;
  while (!port) {
    if (launchError) throw launchError;
    if (browser.exitCode !== null) throw new Error(`Chrome exited before startup (${browser.exitCode})`);
    try { port = Number((await readFile(path.join(profile, 'DevToolsActivePort'), 'utf8')).split('\n')[0]); } catch { /* startup in progress */ }
    if (Date.now() > launchDeadline) throw new Error('Chrome debugging endpoint did not start');
    if (!port) await pause(50);
  }
  const response = await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: 'PUT' });
  if (!response.ok) throw new Error(`Chrome target creation failed (${response.status})`);
  const target = await response.json();
  socket = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { socket.addEventListener('open', resolve, { once: true }); socket.addEventListener('error', reject, { once: true }); });
  socket.addEventListener('message', event => {
    const message = JSON.parse(event.data);
    if (message.id) {
      const request = pending.get(message.id); pending.delete(message.id);
      if (message.error) request?.reject(new Error(message.error.message)); else request?.resolve(message.result);
    }
    if (message.method === 'Runtime.exceptionThrown') errors.push(message.params.exceptionDetails.text);
    if (message.method === 'Fetch.requestPaused') {
      const { requestId, request } = message.params;
      const url = new URL(request.url);
      const local = url.hostname === '127.0.0.1' && url.port === '4179';
      // Never permit an accidentally unmocked auth/API request to reach a real service.
      command(local ? 'Fetch.continueRequest' : 'Fetch.failRequest', local ? { requestId } : { requestId, errorReason: 'BlockedByClient' }).catch(error => errors.push(error.message));
      if (!local) errors.push('Blocked unexpected non-local browser request');
    }
  });
  await command('Runtime.enable');
  await command('Page.enable');
  await command('Fetch.enable', { patterns: [{ urlPattern: 'http://*' }, { urlPattern: 'https://*' }] });
  await command('Page.navigate', { url: 'http://127.0.0.1:4179/?learningPrototype=on' });
  const evaluate = async expression => {
    const r = await command('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
    if (r.exceptionDetails) throw new Error(r.exceptionDetails.text + ': ' + JSON.stringify(r.exceptionDetails.exception?.description));
    return r.result?.value;
  };
  await evaluate(`new Promise(resolve => {const t=setInterval(()=>{if(document.querySelector('.quest')){clearInterval(t);resolve(true)}},50)})`);
  const source = await readFile(path.join(root, 'tests/prototype/browser.js'), 'utf8');
  await evaluate(source);
  await import('node:fs/promises').then(fs => fs.mkdir(path.join(root,'docs/redesign/screenshots'),{recursive:true}));
  for (const [name,width,height,action] of [
    ['hub-desktop',1280,1000,`window.questTest.hub()`],
    ['hub-phone',390,844,`window.questTest.hub()`],
    ['lesson-phone',390,844,`window.questTest.open('Market math')`],
    ['shop-desktop',1280,1000,`(async()=>{window.questTest.hub();await new Promise(r=>setTimeout(r,100));window.questTest.open('Build your shop')})()`],
  ]) {
    await command('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<500});
    await evaluate(action); await pause(300);
    if(await evaluate('document.documentElement.scrollWidth > innerWidth')) throw new Error('Horizontal overflow: '+name);
    const shot=await command('Page.captureScreenshot',{format:'png',captureBeyondViewport:true});
    await import('node:fs/promises').then(fs=>fs.writeFile(path.join(root,'docs/redesign/screenshots',name+'.png'),Buffer.from(shot.data,'base64')));
  }
  await evaluate(`(async()=>{const t=window.questTest;t.click('Postcard kit');await t.wait();t.click('Badge kit');await t.wait();t.click('Assemble shop');await t.wait();for(const n of [8,6,6]){await t.answer(n);t.click(document.body.textContent.includes('Finish activity')?'Finish activity':'Next step');await t.wait();}})()`);
  const completed=await command('Page.captureScreenshot',{format:'png',captureBeyondViewport:true});
  await import('node:fs/promises').then(fs=>fs.writeFile(path.join(root,'docs/redesign/screenshots/completion.png'),Buffer.from(completed.data,'base64')));
  await command('Page.reload');await pause(700);
  if(!await evaluate("document.body.textContent.includes('4/4')")) throw new Error('Reload lost builder completions');
  await command('Input.dispatchKeyEvent',{type:'keyDown',key:'Tab',code:'Tab',windowsVirtualKeyCode:9});
  await command('Input.dispatchKeyEvent',{type:'keyUp',key:'Tab',code:'Tab',windowsVirtualKeyCode:9});
  if(!await evaluate("document.activeElement.tagName === 'A'")) throw new Error('Keyboard navigation failed');
  await command('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
  if(!await evaluate("matchMedia('(prefers-reduced-motion: reduce)').matches")) throw new Error('Reduced motion unavailable');
  await command('Page.navigate',{url:'http://127.0.0.1:4179/learn'});await pause(1000);
  if(await evaluate("!!document.querySelector('.quest')")) throw new Error('Flag off still mounts prototype');
  const classic=await command('Page.captureScreenshot',{format:'png',captureBeyondViewport:true});
  await import('node:fs/promises').then(fs=>fs.writeFile(path.join(root,'docs/redesign/screenshots/classic-off.png'),Buffer.from(classic.data,'base64')));
  if(errors.length)throw new Error(errors.join('; '));
  console.log('PASS prototype rendered flows, arithmetic feedback, replay, profile isolation, corruption and quota handling; external requests intercepted; six screenshots captured.');

} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
} finally {
  for (const request of pending.values()) request.reject(new Error('Browser test runner closed'));
  pending.clear();
  socket?.close();
  if (browser && browser.exitCode === null) {
    browser.kill('SIGTERM');
    await Promise.race([new Promise(resolve => browser.once('exit', resolve)), pause(3000)]);
    if (browser.exitCode === null) browser.kill('SIGKILL');
  }
  await server?.close();
  if (profile) await rm(profile, { recursive: true, force: true, maxRetries: 3 });
}
