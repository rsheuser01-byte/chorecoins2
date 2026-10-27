// Test-only Vite alias: exercises retained cloud implementation without changing
// the production release lock. This file is not imported by application source.
export function isCloudSyncEnabled(value: unknown): boolean { return value === 'true'; }
