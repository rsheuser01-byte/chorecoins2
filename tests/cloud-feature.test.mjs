import test from 'node:test';
import assert from 'node:assert/strict';
import { isCloudSyncEnabled } from '../src/lib/cloudFeature.ts';
test('production source release lock prevents activation even with explicit public opt-in',()=>{
 for(const value of [undefined,null,'','false','TRUE',true,'1',' true ','true']) assert.equal(isCloudSyncEnabled(value),false);
});
