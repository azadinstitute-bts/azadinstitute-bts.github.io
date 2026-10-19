(()=>{
 'use strict';
 const data=window.BTSCatalog, exam=document.getElementById('exam'), subject=document.getElementById('subject'), result=document.getElementById('course-result');
 const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const portal='https://bilaspurtestseries.com/bts-daily-tests/';
 function validity(p){
  if(p.post_id==='ctet')return 'भुगतान की पुष्टि से 60 दिन';
  if(p.post_id==='cg_si')return 'भुगतान की पुष्टि से 105 दिन';
  const until=p.valid_until;
  return until?new Date(until).toLocaleDateString('hi-IN',{timeZone:'Asia/Kolkata',day:'numeric',month:'long',year:'numeric'})+' · रात 11:59:59 IST तक':'अंतिम तिथि के लिए सहायता लें';
 }
 function render(){
  const s=data.subjects.find(x=>x.id===subject.value);
  if(!s){result.innerHTML='<div class="empty"><h2>'+(exam.value?'अब अपना विषय / पेपर चुनें':'पहले अपनी परीक्षा चुनें')+'</h2><p>शुल्क, validity और plan का पूरा विवरण यहीं दिखेगा।</p></div>';return;}
  const plans=data.plans.filter(p=>p.subject_id===s.id), post=data.posts.find(p=>p.id===s.post_id);
  let note='';
  if(s.post_id==='ctet')note='<div class="notice info"><strong>आज के admission की validity: payment verification से 60 दिन।</strong> यह अवधि हर नए admission के भुगतान की पुष्टि से शुरू होगी। समय-सारणी की तारीखें अभ्यास का क्रम बताती हैं।</div>';
  if(['varg2','varg3'].includes(s.post_id))note='<div class="notice info"><strong>Full Course में अंतिम 15 Mega Tests शामिल हैं।</strong> उसी विषय का Full Course लिया है तो Mega-only pack दोबारा खरीदना जरूरी नहीं।</div>';
  result.innerHTML='<div class="course-intro"><span class="eyebrow">'+esc(post.title)+'</span><h2>'+esc(s.title)+'</h2><p>यह चुने हुए पद / पेपर के पूरे पाठ्यक्रम पर आधारित टेस्ट सीरीज़ है। मुख्य विषय के साथ परीक्षा में शामिल अन्य खंडों का भी अभ्यास मिलेगा।</p></div>'+note+'<div class="plan-grid">'+plans.sort((a,b)=>Number(a.plan_id.includes('mega'))-Number(b.plan_id.includes('mega'))).map(p=>{
   const m15=p.plan_id.includes('mega15'),m20=p.plan_id.includes('mega20'),mega=m15||m20;
   const label=m15?'केवल 15 Mega Tests':m20?'केवल 20 Mega Tests':'Full Course';
   const contents=m15?'पूरे सिलेबस के 15 टेस्ट':m20?'पूरे सिलेबस के 20 टेस्ट · इस विषय का अलग पैक':s.post_id==='cg_si'?'46 टेस्ट की योजना · 28 टॉपिक + 18 मेगा':['varg2','varg3'].includes(s.post_id)?'टॉपिक + साप्ताहिक टेस्ट + अंतिम 15 Mega Tests':'टॉपिक और साप्ताहिक अभ्यास · समय-सारणी के अनुसार टेस्ट';
   const unlock=mega?'कोर्स सक्रिय होते ही इस पैक के सभी '+(m15?15:20)+' टेस्ट एक साथ खुलेंगे। तारीख का इंतज़ार नहीं।':s.post_id==='cg_si'?'कोर्स सक्रिय होते ही सभी 46 टेस्ट एक साथ खुलेंगे। तारीख का इंतज़ार नहीं।':'टेस्ट कोर्स की समय-सारणी के अनुसार खुलते हैं';
   const b=p.breakdown;
   const breakdown='<section class="test-breakdown" aria-label="टेस्टों का विवरण"><div class="test-total"><strong>'+b.total+'</strong><span>कुल नियोजित टेस्ट</span></div><dl>'+[['topic','टॉपिक / संयुक्त अभ्यास टेस्ट'],['weekly','साप्ताहिक संयुक्त टेस्ट'],['mega','पूरे सिलेबस के मेगा टेस्ट']].filter(([key])=>b[key]>0).map(([key,label])=>'<div><dt>'+label+'</dt><dd>'+b[key]+'</dd></div>').join('')+'</dl></section>';
   const link='https://admission.bilaspurtestseries.com/?'+new URLSearchParams({post:s.post_id,subject:s.id,plan:p.plan_id});
   const timetable=(mega?'teacher-mega-timetable.html':'teacher-full-timetable.html')+'#'+s.schedule;
   return '<article class="plan-card '+(!mega?'primary':'')+'"><span class="plan-label">'+(mega?'पूरे सिलेबस का अभ्यास':'नियमित तैयारी')+'</span><h3>'+label+'</h3><div class="price">₹'+p.amount+'<small>इस चुने हुए कोर्स / plan की कुल वेबसाइट फीस</small></div>'+breakdown+'<dl class="facts"><div><dt>क्या मिलेगा?</dt><dd>'+contents+'</dd></div><div><dt>टेस्ट कब मिलेंगे?</dt><dd>'+unlock+'</dd></div><div><dt>कब तक access मिलेगा?</dt><dd>'+validity(p)+'</dd></div><div><dt>Online टेस्ट</dt><dd>मोबाइल, टैबलेट या कंप्यूटर के browser में दें। Student App में भी online टेस्ट दे सकते हैं।</dd></div><div><dt>Offline अभ्यास</dt><dd>Student App से टेस्ट की PDF डाउनलोड करें, प्रिंट निकालें और अपने स्थान पर offline टेस्ट दें।</dd></div>'+(mega?'<div><dt>Promo code</dt><dd>इस पैक पर लागू नहीं</dd></div>':'')+'</dl><div class="actions"><a class="button" href="'+link+'">'+label+' चुनें · ₹'+p.amount+'</a><a href="'+timetable+'">विषय की समय-सारणी देखें →</a></div></article>';
  }).join('')+'</div><div class="course-bottom"><a class="button secondary" href="'+portal+'?mode=demo&amp;subject='+encodeURIComponent(s.id)+'#/login">'+(s.post_id==='cg_si'?'पहले कोर्स का पूर्वावलोकन देखें':'पहले फ्री डेमो देखें')+'</a><p class="demo-note">'+(s.post_id==='cg_si'?'SI preview में Premium टेस्ट सूची दिख सकती है। जिन टेस्ट पर Free लिखा हो, केवल वे मुफ्त हैं।':'डेमो में उपलब्ध मुफ्त टेस्ट ही खुलेंगे; पूरा paid course शामिल नहीं है।')+'</p></div><p class="micro">यह breakdown पूरी समय-सारणी के अनुसार है। अभी खुले हुए टेस्ट अपने खाते में देखें। अंतिम शुल्क भुगतान स्क्रीन पर जाँचें। <a href="help.html#refund">बदलाव / refund की जानकारी</a></p>';
 }
 function chooseExam(preferred){const list=data.subjects.filter(s=>s.post_id===exam.value);subject.innerHTML='<option value="">'+(list.length?'विषय / पेपर चुनें':'पहले परीक्षा चुनें')+'</option>'+list.map(s=>'<option value="'+s.id+'">'+esc(s.title)+'</option>').join('');subject.disabled=!list.length;subject.value=list.some(s=>s.id===preferred)?preferred:list.length===1?list[0].id:'';render();}
 function fromHash(){const key=decodeURIComponent(location.hash.slice(1));const s=data.subjects.find(s=>s.id===key);const post=s?s.post_id:key.startsWith('varg1')?'varg1':key.startsWith('varg2')?'varg2':key.startsWith('varg3')?'varg3':key;exam.value=data.posts.some(p=>p.id===post)?post:'';chooseExam(s?.id);}
 exam.addEventListener('change',()=>{history.replaceState(null,'','#'+exam.value);chooseExam();});subject.addEventListener('change',()=>{history.replaceState(null,'','#'+(subject.value||exam.value));render();});window.addEventListener('hashchange',fromHash);fromHash();
})();
