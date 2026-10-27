/** Release lock: change only in a separately reviewed activation release after
 * approved live migration, health and backup/restore verification. Environment
 * variables alone cannot activate cloud progress in this application release.
 */
const CLOUD_RELEASE_APPROVED = false;
export function isCloudSyncEnabled(value: unknown): boolean {
  return CLOUD_RELEASE_APPROVED && value === 'true';
}
