const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const { webcrypto } = require('node:crypto');
const code = fs.readFileSync(path.join(__dirname, '../assets/bts-pamphlet.js'), 'utf8');
const results = [];
const tagged = 'https://bilaspurtestseries.com/?utm_source=pamphlet&utm_medium=qr&utm_campaign=pamphlet_2026_10&utm_content=library';
function boot(href, options = {}) {
  const rows = [], handlers = {}, data = options.data || new Map();
  const url = new URL(href);
  const window = {
    location: { href, pathname: url.pathname }, crypto: webcrypto,
    localStorage: {
      getItem(k) { if(options.storageFails) throw Error('storage blocked'); return data.get(k) || null; },
      setItem(k,v) { if(options.storageFails) throw Error('storage blocked'); data.set(k,v); },
      removeItem(k) { if(options.storageFails) throw Error('storage blocked'); data.delete(k); }
    },
    fetch(url, init) { rows.push({url,init,row:JSON.parse(init.body)}); return options.networkFails ? Promise.reject(Error('offline')) : Promise.resolve({status:201}); }
  };
  const document = { addEventListener(name, fn) { handlers[name] = fn; } };
  vm.runInNewContext(code, { window, document, URL, URLSearchParams, Uint8Array, Date, Number, Array, String, Boolean, JSON });
  function click(href, props={}) {
    const attrs = {href};
    const anchor = { getAttribute(k) { return attrs[k] || null; }, setAttribute(k,v) { attrs[k]=v; }, hasAttribute(k) { return Boolean(props[k]); } };
    const event={target:{closest(){return anchor;}},defaultPrevented:Boolean(props.defaultPrevented)};
    if(handlers.click) handlers.click(event);
    return attrs.href;
  }
  return {window,rows,data,click};
}
function test(name, fn) { fn(); results.push({name,status:'PASS'}); }
test('Untagged visitors have no telemetry, storage identifier or link changes',()=>{
  const x=boot('https://bilaspurtestseries.com/'); assert.equal(x.rows.length,0); assert.equal(x.window.BTSPamphlet,undefined); assert.equal(x.click('teacher.html#varg1'),'teacher.html#varg1'); assert.equal(x.data.size,0);
});
test('Campaign landing records only allowed fields without query or personal details',()=>{
  const x=boot(tagged+'&email=private@example.com&access_token=PRIVATE');
  assert.equal(x.rows.length,1); assert.equal(x.rows[0].row.page_path,'/');
  assert.equal(x.rows[0].row.placement,'library');
  assert(!JSON.stringify(x.rows).includes('private@example')); assert(!JSON.stringify(x.rows).includes('PRIVATE'));
  assert.equal(x.rows[0].init.referrerPolicy,'no-referrer'); assert.equal(x.rows[0].init.credentials,'omit');
});
test('Course navigation retains fragment and campaign; dynamic admission link retains plan',()=>{
  const x=boot(tagged); const course=new URL(x.click('teacher.html#varg1'));
  assert.equal(course.hash,'#varg1'); assert.equal(course.searchParams.get('utm_content'),'library');
  const admission=new URL(x.click('https://admission.bilaspurtestseries.com/?post=varg1&subject=varg1_english&plan=full'));
  assert.equal(admission.searchParams.get('plan'),'full');
  assert.equal(admission.searchParams.get('bts_visit'),x.rows[0].row.visit_id);
  const y=boot(admission.href); assert.equal(y.rows[0].row.visit_id,x.rows[0].row.visit_id);
});
test('Demo link and destination are separately counted; login hash retained',()=>{
  const x=boot(tagged); const href=x.click('https://bilaspurtestseries.com/bts-daily-tests/?mode=demo&subject=varg1_english#/login');
  assert.equal(new URL(href).hash,'#/login'); assert.equal(new URL(href).searchParams.get('subject'),'varg1_english');
  assert(x.rows.some(x=>x.row.event_name==='demo_click'));
  const y=boot(href); assert(y.rows.some(x=>x.row.event_name==='demo_open'));
});
test('Play click carries campaign referrer without visit identifier and is not an install',()=>{
  const x=boot(tagged); const url=new URL(x.click('https://play.google.com/store/apps/details?id=in.azadinstitute.btsstudent'));
  const ref=new URLSearchParams(url.searchParams.get('referrer'));
  assert.equal(ref.get('utm_source'),'pamphlet'); assert.equal(ref.get('utm_content'),'library'); assert.equal(ref.has('bts_visit'),false);
  assert(x.rows.some(x=>x.row.event_name==='app_click')); assert(!x.rows.some(x=>x.row.event_name.includes('install')));
});
test('Admission association validates identifier and sends no payment or contact data',()=>{
  const x=boot(tagged); x.window.BTSPamphlet.trackAdmission('invalid'); assert.equal(x.rows.length,1);
  const id='ADM_'+'a'.repeat(48); x.window.BTSPamphlet.trackAdmission(id);
  assert.equal(x.rows[1].row.admission_id,id); assert.equal(x.rows[1].row.event_name,'admission_created');
  assert.equal(x.rows[1].row.page_path,'/');
});
test('Storage and network failures do not block navigation or admission callback',()=>{
  const x=boot(tagged,{storageFails:true,networkFails:true});
  assert.equal(new URL(x.click('teacher.html#varg1')).hash,'#varg1');
  assert.doesNotThrow(()=>x.window.BTSPamphlet.trackAdmission('ADM_'+'b'.repeat(48)));
});
test('Other tagged campaigns clear attribution; expired and invalid contexts ignored',()=>{
  const x=boot(tagged); const y=boot('https://bilaspurtestseries.com/?utm_source=facebook',{data:x.data}); assert.equal(y.rows.length,0); assert.equal(y.data.size,0);
  const z=boot(tagged.replace('pamphlet_2026_10','unapproved')); assert.equal(z.rows.length,0);
  const t=boot(tagged); const stored=JSON.parse(t.data.get('bts_pamphlet_v1')); stored.expires_at=Date.now()-1;t.data.set('bts_pamphlet_v1',JSON.stringify(stored)); assert.equal(boot('https://bilaspurtestseries.com/',{data:t.data}).rows.length,0);
});
test('No campaign leaks to WhatsApp, payment, unrelated sites, anchors or prevented clicks',()=>{
  const x=boot(tagged); for(const href of ['https://wa.me/919669946966','https://rzp.io/example','https://example.org/','#exams','tel:+919669946966']) assert.equal(x.click(href),href);
  assert.equal(x.click('teacher.html',{defaultPrevented:true}),'teacher.html');
});
test('QA events remain explicitly marked across subdomains',()=>{
  const x=boot(tagged+'&bts_test=1');assert(x.rows.every(x=>x.row.is_test));
  const y=boot(x.click('https://admission.bilaspurtestseries.com/?plan=full'));assert(y.rows.every(x=>x.row.is_test));
});
console.log(JSON.stringify({status:'PASS',scope:'Offline isolated DOM/storage/network mocks; no production requests',count:results.length,results},null,2));
