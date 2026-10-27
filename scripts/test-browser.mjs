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
  server = await createServer({ root, configFile: path.join(root, 'tests/browser/vite.config.ts'), mode: 'test', logLevel: 'error' });
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
  await command('Page.navigate', { url: 'http://127.0.0.1:4179/tests/browser/index.html' });
  const deadline = Date.now() + 60000;
  let outcome;
  while (!outcome?.done) {
    const evaluation = await command('Runtime.evaluate', { expression: 'window.__browserTests || null', returnByValue: true });
    outcome = evaluation.result?.value;
    if (errors.length) throw new Error(`Browser runtime failure: ${errors.join('; ')}`);
    if (Date.now() > deadline) throw new Error('Browser integration suite timed out before completion');
    if (!outcome?.done) await pause(100);
  }
  for (const name of outcome.passed) console.log(`PASS ${name}`);
  if (outcome.error) throw new Error(outcome.error);
  if (outcome.passed.length !== 7) throw new Error(`Expected 7 integration tests; got ${outcome.passed.length}`);
  console.log(`Browser integration: ${outcome.passed.length} passed (mock auth; no live service requests).`);
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
