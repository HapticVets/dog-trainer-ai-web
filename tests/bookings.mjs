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
test('client activity counts only the linked owner and sessions in the last 30 days',async()=>{
  const stamp=days=>new Date(Date.now()-days*86400000).toISOString();
  const link={admin_dog_id:'admin-dog',customer_clerk_user_id:'client',customer_dog_profile_id:'dog'};
  const sessions=[2,10,45].map(days=>({dog_profile_id:'dog',clerk_user_id:'client',created_at:stamp(days),session_date:stamp(days),focus:'Assigned homework',wins:'Reported progress',issues:null}));
  sessions.push({...sessions[0],clerk_user_id:'different-owner'});
  const rows={admin_client_dog_links:[link],session_logs:sessions,dog_chats:[],dog_outputs:[],client_homework_context:[]};
  const supabaseAdmin={from(table){const query={};for(const method of ['select','in','eq','order','limit'])query[method]=()=>query;query.then=resolve=>Promise.resolve({data:rows[table],error:null}).then(resolve);return query;}};
  const api=load('lib/adminClientActivity.ts',{'@/lib/supabase-admin':{supabaseAdmin}});
  const summary=(await api.getAdminClientActivitySummaries(['admin-dog'])).get('admin-dog');
  assert.equal(summary.sessionsLast7Days,1);
  assert.equal(summary.sessionsLast30Days,2);
});
