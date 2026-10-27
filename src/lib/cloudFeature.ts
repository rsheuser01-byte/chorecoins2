/** Deployment-time opt-in only. Runtime service failures must never change modes. */
export function isCloudSyncEnabled(value: unknown): boolean { return value === 'true'; }
