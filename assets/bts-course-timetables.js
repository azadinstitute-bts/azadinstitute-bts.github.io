(()=>{
  'use strict';
  const root=document.getElementById('bts-timetable');
  const view=root.dataset.timetableView;
  if(view==='home')return;
  const get=id=>root.querySelector('#bts-'+id);
  const data=JSON.parse(get('data').textContent);
  const byId=new Map(data.courses.map(c=>[c.id,c]));
  const asDate=d=>new Date(d+'T12:00:00+05:30');
  const format=(d,opts)=>new Intl.DateTimeFormat('hi-IN',{timeZone:'Asia/Kolkata',...opts}).format(asDate(d));
  const dateLabel=d=>format(d,{day:'numeric',month:'long',year:'numeric'});
  const shortDate=d=>format(d,{day:'numeric',month:'long'});
  const range=(a,b)=>shortDate(a)+' – '+dateLabel(b);
  function make(tag,cls,text){const e=document.createElement(tag);if(cls)e.className=cls;if(text!==undefined)e.textContent=text;return e;}
  function options(select,items,value){select.replaceChildren();items.forEach(x=>{const o=make('option','',x.title);o.value=x.id;select.append(o);});select.value=items.some(x=>x.id===value)?value:(items[0]?.id||'');}
  function selectedHash(){try{return decodeURIComponent(location.hash.slice(1));}catch(_error){return '';}}
  if(view==='mega'){
    const exam=get('mega-exam'),course=get('mega-course'),date=get('mega-date');
    function render(){
      const c=byId.get(course.value);
      const shown=c.tests.filter(t=>date.value==='all'||t.date===date.value);
      get('course-title').textContent=c.title;
      get('course-range').textContent=c.tests.length+' मेगा टेस्ट · अभ्यास अवधि: '+range(c.tests[0].date,c.tests.at(-1).date);
      get('course-note').textContent=c.mode==='mega15'?'इस 15-मेगा-टेस्ट पैक में एडमिशन के बाद सभी 15 टेस्ट अनलॉक होते हैं। तारीखें आपके अभ्यास का क्रम बताती हैं।':'हर मेगा टेस्ट संबंधित व्याख्याता विषय की परीक्षा के पूरे पाठ्यक्रम पर आधारित है। अपने विषय के टेस्ट ऐप या वेबसाइट में देखें।';
      get('mega-summary').textContent='अभी दिख रहे हैं: '+shown.length+' टेस्ट · '+shown.reduce((n,t)=>n+t.questions,0)+' प्रश्न';
      get('mega-empty').hidden=shown.length>0;
      get('print').disabled=shown.length===0;
      get('tests').replaceChildren();
      shown.forEach(t=>{
        const article=make('article','bts-test');article.dataset.date=t.date;
        const time=make('time','bts-datecol');time.dateTime=t.date;
        time.append(make('span','',format(t.date,{weekday:'long'})),make('strong','',String(Number(t.date.slice(-2)))),make('span','',format(t.date,{month:'long'})));
        const body=make('div','bts-testbody'),top=make('div','bts-testtop'),heading=make('div');
        heading.append(make('span','bts-kind','पूरे पाठ्यक्रम का टेस्ट'),make('h3','',t.title));
        top.append(heading,make('span','bts-questions',t.questions+' प्रश्न'));
        body.append(top,make('p','',c.title+' · पूरे पाठ्यक्रम का अभ्यास।'));
        article.append(time,body);get('tests').append(article);
      });
    }
    function changeCourse(){
      const c=byId.get(course.value);
      options(date,[{id:'all',title:'सभी मेगा टेस्ट'},...c.tests.map(t=>({id:t.date,title:shortDate(t.date)+' · '+format(t.date,{weekday:'long'})}))],'all');
      render();
    }
    function changeExam(preferred){
      options(course,data.courses.filter(c=>c.category===exam.value).map(c=>({id:c.id,title:c.title})),preferred);changeCourse();
    }
    exam.addEventListener('change',()=>changeExam());
    course.addEventListener('change',changeCourse);date.addEventListener('change',render);
    get('print').addEventListener('click',()=>window.print());
    const preferred=byId.get(selectedHash());
    options(exam,data.categories,preferred?.category||'varg1');changeExam(preferred?.id);
    return;
  }
  const DAY=86400000;
  async function trustedNow(){
    const controller=new AbortController();
    const timeout=setTimeout(()=>controller.abort(),2500);
    try{
      const response=await fetch(location.pathname+'?release_check='+Date.now(),{method:'HEAD',cache:'no-store',credentials:'same-origin',signal:controller.signal});
      const serverDate=response.headers.get('date');
      const parsed=serverDate?Date.parse(serverDate):NaN;
      if(Number.isFinite(parsed))return parsed;
    }catch(_error){}
    finally{clearTimeout(timeout);}
    return Date.now();
  }
  const exam=get('full-exam'),course=get('full-course'),week=get('full-week');
  let now=Date.now();
  const startDate=w=>(data.weeks.find(x=>x.number===w.week)||w).start;
  const releaseAt=w=>Date.parse(startDate(w)+'T00:00:00+05:30')-DAY;
  const visibleRows=()=>data.full[course.value].filter(w=>w.week===0||now>=releaseAt(w));
  function render(){
    const c=byId.get(course.value),rows=visibleRows();
    const shown=rows.filter(w=>week.value==='all'||String(w.week)===week.value);
    get('full-title').textContent=c.title;
    get('full-range').textContent=c.mode==='si'?'28 टॉपिक टेस्ट + 18 मेगा टेस्ट · संबंधित पेपरों का अभ्यास':'टॉपिक टेस्ट, साप्ताहिक अभ्यास और कोर्स में शामिल मेगा टेस्ट।';
    get('full-summary').textContent=c.mode==='si'?'पूरी समय-सारणी · 46 टेस्ट':shown.length+' सप्ताह की समय-सारणी';
    get('full-empty').hidden=shown.length>0;
    get('weeks').replaceChildren();
    shown.forEach(w=>{
      const article=make('article','bts-week');article.dataset.week=String(w.week);
      const wmeta=data.weeks.find(x=>x.number===w.week)||w;
      article.append(make('h3','',w.week===0?'SI मुख्य परीक्षा · पूरा क्रम':'सप्ताह '+w.week),make('p','',range(wmeta.start,wmeta.end)),make('p','',w.count+' टेस्ट · '+c.title));
      const link=make('a','bts-action secondary','समय-सारणी खोलें →');link.href=w.href;article.append(link);get('weeks').append(article);
    });
  }
  function changeCourse(retainWeek){
    const rows=visibleRows();
    options(week,[{id:'all',title:'सभी उपलब्ध सप्ताह'},...rows.map(w=>({id:String(w.week),title:w.week===0?'पूरा SI timetable':'सप्ताह '+w.week+' · '+shortDate(startDate(w))}))],retainWeek);
    week.disabled=rows.length<2;render();
  }
  function changeExam(preferred){
    options(course,data.courses.filter(c=>c.category===exam.value).map(c=>({id:c.id,title:c.title})),preferred);changeCourse();
  }
  exam.disabled=course.disabled=week.disabled=true;
  exam.addEventListener('change',()=>changeExam());course.addEventListener('change',()=>changeCourse());week.addEventListener('change',render);
  async function refreshSchedule(){
    now=await trustedNow();
    if(!course.value){const preferred=byId.get(selectedHash());options(exam,data.categories,preferred?.category||'varg2');changeExam(preferred?.id);}
    else changeCourse(week.value);
    exam.disabled=course.disabled=false;
    const next=data.courses.flatMap(c=>data.full[c.id]).filter(w=>w.week>0&&releaseAt(w)>now).reduce((n,w)=>Math.min(n,releaseAt(w)),Infinity);
    if(Number.isFinite(next))setTimeout(refreshSchedule,Math.min(Math.max(1000,next-now+1000),2147483647));
  }
  refreshSchedule();
})();
