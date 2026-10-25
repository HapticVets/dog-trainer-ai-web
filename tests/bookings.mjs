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
class AuthError extends Error{constructor(status){super('Unauthorized');this.status=status;}}
function route(authorized=true){let writes=0;const api=load('app/api/admin/bookings/route.ts',{'@/lib/admin':{AdminAuthorizationError:AuthError,requireAdmin:async()=>{if(!authorized)throw new AuthError(403);}},'@/lib/bookings':{bookingDb:async()=>{writes++;return[];},sendBookingMail:async()=>false,uuidPattern:/^[0-9a-f-]{36}$/}});return{...api,writes:()=>writes};}
const req=(body,origin='https://app.example')=>new Request('https://app.example/api/admin/bookings',{method:'POST',headers:{origin,'Content-Type':'application/json'},body:JSON.stringify(body)});
test('admin API rejects unauthorized reads and writes before touching bookings',async()=>{const api=route(false);assert.equal((await api.GET()).status,403);assert.equal((await api.POST(req({action:'publish',startsAt:'2026-11-02T14:00Z'}))).status,403);assert.equal(api.writes(),0);});
test('admin changes reject cross-site requests and unknown actions',async()=>{const api=route();assert.equal((await api.POST(req({action:'publish'},'https://attacker.example'))).status,403);assert.equal((await api.POST(req({action:'delete-everything',id:'10000000-0000-4000-8000-000000000001'}))).status,400);assert.equal(api.writes(),0);});
test('approval is saved even if email is pending',async()=>{const api=route();const response=await api.POST(req({action:'approved',id:'10000000-0000-4000-8000-000000000001'}));assert.equal(response.status,200);assert.equal((await response.json()).mailSent,false);assert.equal(api.writes(),1);});
