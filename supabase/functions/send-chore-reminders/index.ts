// Background reminders are retired in favor of optional app-open reminders.
// Fail closed before reading secrets, constructing clients, querying or sending.
// This source change does not itself deactivate/deploy any existing scheduler.
Deno.serve(() => new Response(JSON.stringify({
  enabled: false,
  message: 'Background reminders are paused. Reminders appear only while the app is open.',
}), {
  status: 410,
  headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
}));
