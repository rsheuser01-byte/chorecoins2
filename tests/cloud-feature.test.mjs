import test from 'node:test';
import assert from 'node:assert/strict';
import { isCloudSyncEnabled } from '../src/lib/cloudFeature.ts';
test('cloud activation requires exact explicit public deployment opt-in',()=>{
 for(const value of [undefined,null,'','false','TRUE',true,'1',' true ']) assert.equal(isCloudSyncEnabled(value),false);
 assert.equal(isCloudSyncEnabled('true'),true);
});
