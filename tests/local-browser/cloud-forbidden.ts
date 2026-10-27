export let cloudCalls = 0;
export function createAccountProgressApi() {
  cloudCalls++;
  throw new Error('Cloud client must not be constructed when cloud sync is disabled');
}
