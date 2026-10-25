const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const code=fs.readFileSync(path.join(__dirname,'../assets/bts-pamphlet.js'),'utf8');
const key=code.match(/var apiKey = '([^']+)'/)[1];
const endpoint='https://mqorslvouzmrvciubpoq.supabase.co/rest/v1/pamphlet_events';
const headers={apikey:key,'Content-Type':'application/json',Prefer:'return=minimal'};
const cp=require('node:child_process');
// curl uses the runtime's configured transport; Node fetch does not in this environment.
async function request(url,options={}) {
  const args=['-sS','--max-time','20','-X',options.method||'GET','-w','\\n%{http_code}'];
  for(const [name,value] of Object.entries(options.headers||{})) args.push('-H',name+': '+value);
  if(options.body) args.push('--data-binary',options.body);
  args.push(url);
  const out=cp.execFileSync('curl',args,{encoding:'utf8',timeout:25000});
  const at=out.lastIndexOf('\n');
  return {status:Number(out.slice(at+1)),text:async()=>out.slice(0,at)};
}
(async()=>{
  const row={event_id:crypto.randomUUID(),visit_id:crypto.randomUUID(),campaign:'pamphlet_2026_10',placement:'general',event_name:'page_view',page_path:'/',admission_id:null,is_test:true};
  const results=[];
  const post=await request(endpoint,{method:'POST',headers,body:JSON.stringify(row)});assert.equal(post.status,201,await post.text());results.push('test-only event inserted');
  const duplicate=await request(endpoint,{method:'POST',headers,body:JSON.stringify(row)});assert.equal(duplicate.status,409);results.push('duplicate event rejected');
  const read=await request(endpoint+'?select=*&limit=1',{headers});assert([401,403].includes(read.status));results.push('public reads denied');
  const edit=await request(endpoint+'?event_id=eq.'+row.event_id,{method:'PATCH',headers,body:JSON.stringify({placement:'college'})});assert([401,403].includes(edit.status));results.push('public edits denied');
  const erase=await request(endpoint+'?event_id=eq.'+row.event_id,{method:'DELETE',headers});assert([401,403].includes(erase.status));results.push('public deletion denied');
  const invalid=await request(endpoint,{method:'POST',headers,body:JSON.stringify({...row,event_id:crypto.randomUUID(),campaign:'unapproved'})});assert([400,401,403].includes(invalid.status));results.push('unapproved campaign rejected');
  const timestamp=await request(endpoint,{method:'POST',headers,body:JSON.stringify({...row,event_id:crypto.randomUUID(),received_at:'2000-01-01'})});assert([401,403].includes(timestamp.status));results.push('client timestamp override denied');
  const admission=await request('https://mqorslvouzmrvciubpoq.supabase.co/rest/v1/admissions?select=admission_id&limit=1',{headers});assert([401,403].includes(admission.status));results.push('existing admission public-read denial preserved');
  console.log(JSON.stringify({status:'PASS',scope:'Live insert-only API; synthetic is_test=true event; no student or payment mutation',event_id:row.event_id,visit_id:row.visit_id,count:results.length,results},null,2));
})().catch(e=>{console.error(e);process.exitCode=1});
