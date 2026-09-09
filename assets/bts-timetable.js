
const data=JSON.parse(document.getElementById('schedule-data').textContent);
const byId=new Map(data.map(c=>[c.id,c]));
const course=document.getElementById('courseFilter'),date=document.getElementById('dateFilter'),type=document.getElementById('typeFilter'),search=document.getElementById('topicSearch');
const courseSections=[...document.querySelectorAll('[data-course]')];
const today=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kolkata',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
const dateLabel=value=>new Intl.DateTimeFormat('hi-IN',{timeZone:'Asia/Kolkata',day:'numeric',month:'long',weekday:'long'}).format(new Date(value+'T12:00:00+05:30'));
const keys={'varg1-maths':'varg1-mathematics','varg3-primary':'varg3','varg2-maths':'varg2-maths-physics','varg2-biology':'varg2-biology-chemistry'};
const courseKey=id=>keys[id]||id;
function courseDates(){const c=byId.get(course.value);return c?[...new Set(c.tests.map(t=>t.date))].sort():[];}
function refreshDates(){const dates=courseDates();date.replaceChildren();const all=document.createElement('option');all.value='all';all.textContent='पूरा सप्ताह';date.append(all);dates.forEach(value=>{const o=document.createElement('option');o.value=value;o.textContent=dateLabel(value);date.append(o);});date.value='all';}
function matching(test,dateValue,typeValue,term){return (dateValue==='all'||test.date===dateValue)&&(typeValue==='all'||test.type===typeValue)&&(!term||(test.topic+' '+test.subject).toLocaleLowerCase().includes(term));}
function apply(){
 const chosen=byId.get(course.value),term=search.value.trim().toLocaleLowerCase();let visible=0,questions=0,known=true;
 courseSections.forEach(section=>{section.hidden=section.dataset.course!==course.value;section.querySelectorAll('[data-entry-id]').forEach(card=>{const show=section.dataset.course===course.value&&matching({date:card.dataset.date,type:card.dataset.type,topic:card.dataset.search,subject:''},date.value,type.value,term);card.hidden=!show;if(show){visible++;if(card.dataset.questions==='')known=false;else questions+=Number(card.dataset.questions);}const isToday=card.dataset.date===today;card.classList.toggle('today',isToday);card.querySelector('.today-label').hidden=!isToday;});});
 document.getElementById('selectionPrompt').hidden=Boolean(chosen);document.getElementById('results').hidden=!chosen;document.getElementById('emptyState').hidden=!chosen||visible>0;document.getElementById('printButton').disabled=!chosen||visible===0;
 date.disabled=type.disabled=search.disabled=!chosen;document.getElementById('todayButton').hidden=!chosen||!chosen.tests.some(t=>t.date===today);
 const dates=courseDates(),position=dates.indexOf(date.value),dayMode=Boolean(chosen)&&position>=0;
 document.querySelectorAll('.day-navigation').forEach(n=>n.hidden=!dayMode);
 document.querySelectorAll('[data-day-step]').forEach(b=>b.disabled=!dayMode||(Number(b.dataset.dayStep)<0?position===0:position===dates.length-1));
 document.querySelectorAll('.day-position').forEach(n=>n.textContent=dayMode?dateLabel(date.value):'');
 if(!chosen)return;
 document.getElementById('courseTitle').textContent=chosen.title;document.getElementById('totalTests').textContent=chosen.tests.length+' टेस्ट';
 const allKnown=chosen.tests.every(t=>t.questions!==null);
 document.getElementById('totalQuestions').textContent=allKnown?chosen.tests.reduce((a,t)=>a+t.questions,0)+' प्रश्न':dates.length+' दिन';
 document.getElementById('questionCaption').textContent=allKnown?'इस सप्ताह के अभ्यास में':'इस कोर्स की समय-सारणी में';
 const typeLabels={'Regular Topic Test':'टॉपिक','Regular Combined Test':'संयुक्त','Weekly Combined Test':'साप्ताहिक','Full Syllabus Test':'पूरे सिलेबस के','Scheduled Test':'निर्धारित'};
 const counts=new Map();chosen.tests.forEach(t=>counts.set(t.type,(counts.get(t.type)||0)+1));document.getElementById('planText').textContent=[...counts].map(([t,n])=>n+' '+(typeLabels[t]||t)).join(' + ')+' टेस्ट';
 document.getElementById('visibleSummary').textContent='अभी दिख रहे हैं: '+visible+' टेस्ट'+(known&&visible?' · '+questions+' प्रश्न':'');
 document.getElementById('printFilter').textContent='चुनी तारीख: '+date.selectedOptions[0].textContent+' · '+visible+' टेस्ट'+(known&&visible?' · '+questions+' प्रश्न':'')+(type.value!=='all'?' · '+type.selectedOptions[0].textContent:'')+(search.value.trim()?' · खोज: '+search.value.trim():'');
}
function resetFilters(){date.value=type.value='all';search.value='';apply();}
course.addEventListener('change',()=>{refreshDates();resetFilters();try{localStorage.setItem('bts-timetable-course',courseKey(course.value));}catch(e){}});
[date,type].forEach(el=>el.addEventListener('change',apply));search.addEventListener('input',apply);
document.getElementById('resetButton').addEventListener('click',resetFilters);document.getElementById('emptyReset').addEventListener('click',resetFilters);
document.querySelectorAll('[data-day-step]').forEach(button=>button.addEventListener('click',()=>{const dates=courseDates(),index=dates.indexOf(date.value),target=index+Number(button.dataset.dayStep);if(index<0||target<0||target>=dates.length)return;date.value=dates[target];apply();document.getElementById('results').scrollIntoView({block:'start'});}));
document.getElementById('todayButton').addEventListener('click',()=>{type.value='all';search.value='';date.value=today;apply();});
document.getElementById('printButton').addEventListener('click',()=>window.print());
let printDetails=[];window.addEventListener('beforeprint',()=>{printDetails=[...document.querySelectorAll('.cards:not([hidden]) .test-card:not([hidden]) details')].filter(d=>!d.open);printDetails.forEach(d=>d.open=true);});window.addEventListener('afterprint',()=>{printDetails.forEach(d=>d.open=false);printDetails=[];});
let preferred='';try{preferred=localStorage.getItem('bts-timetable-course')||'';}catch(e){}
let hash='';try{hash=decodeURIComponent(location.hash.slice(1));}catch(e){}
const fromHash=data.find(c=>courseKey(c.id)===courseKey(hash));const selected=fromHash||data.find(c=>courseKey(c.id)===courseKey(preferred));if(selected)course.value=selected.id;
refreshDates();apply();
