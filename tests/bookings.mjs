import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
function load(file,imports={},globals={}){const exports={};const code=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;vm.runInNewContext(code,{exports,require:n=>imports[n],Request,Response,URL,Date,Intl,console,...globals});return exports;}
const {easternTime}=load('lib/bookingTime.ts');
test('Ohio appointment times work across daylight saving changes and other device timezones',()=>{
  assert.equal(easternTime('2026-10-26T09:00'),'2026-10-26T13:00:00.000Z');
  assert.equal(easternTime('2026-11-02T09:00'),'2026-11-02T14:00:00.000Z');
  assert.throws(()=>easternTime('2027-03-14T02:30'),/does not exist/);
  assert.throws(()=>easternTime('2026-11-01T01:30'),/repeats/);
});
