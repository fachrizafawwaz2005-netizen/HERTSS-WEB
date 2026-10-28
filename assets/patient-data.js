/* HERTS Patient Portal Supabase integration.
   Reads only the patient linked to the authenticated user. It does not create tables or fabricate measurements. */
(function(){
 'use strict';
 const client=window.HERTS_SUPABASE;
 const $=id=>document.getElementById(id);
 const months=['January','February','March','April','May','June','July','August','September','October','November','December'];
 const esc=v=>String(v==null?'':v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const dateFmt=v=>{if(!v)return '—';const d=new Date(v.length===10?v+'T00:00:00':v);return Number.isNaN(d.getTime())?String(v):d.getDate()+' '+months[d.getMonth()]+' '+d.getFullYear()};
 const timeFmt=v=>{if(!v)return '—';const d=new Date(v);return Number.isNaN(d.getTime())?String(v):d.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit',hour12:true})};
 const duration=s=>{if(Number.isFinite(Number(s.duration_minutes))&&s.duration_minutes!==null)return Number(s.duration_minutes)+' min';if(s.started_at&&s.ended_at){return Math.max(0,Math.round((new Date(s.ended_at)-new Date(s.started_at))/60000))+' min'}return '—'};
 function statusLabel(s){const x=String(s.status||'').toLowerCase();return x==='in_progress'||x==='active'?'In progress':x==='completed'?'Completed':x==='stopped'?'Stopped':'Recorded';}
 function showPageMessage(text){let box=$('patient-data-message');if(!box){box=document.createElement('div');box.id='patient-data-message';box.setAttribute('role','status');box.style.cssText='margin:16px auto;padding:12px 16px;max-width:1100px;border-radius:8px;background:#fff4e5;color:#663c00';document.querySelector('main')?.prepend(box);}box.textContent=text;}
 function setText(el,text){if(el)el.textContent=text==null?'—':String(text)}
 async function getPatient(){
   if(!client)throw new Error('Supabase client tidak tersedia. Pastikan assets/supabase-config.js dan assets/supabase-client.js dimuat.');
   const {data:{user},error:authError}=await client.auth.getUser();
   if(authError)throw authError;
   if(!user){location.replace('patient-signin.html');return null;}
   const {data:patient,error}=await client.from('patients').select('id,patient_code,full_name,date_of_birth,sex,auth_user_id').eq('auth_user_id',user.id).maybeSingle();
   if(error)throw error;
   if(!patient){await client.auth.signOut();throw new Error('Akun ini belum ditautkan ke baris pasien. Isi patients.auth_user_id dengan User ID dari Supabase Auth.');}
   return {user,patient};
 }
 async function getSessions(patientId){const {data,error}=await client.from('sessions').select('id,session_code,patient_id,started_at,duration_minutes,status,recording_available,created_at').eq('patient_id',patientId).order('started_at',{ascending:false});if(error)throw error;return data||[];}
 function updateHeader(patient,user){document.querySelectorAll('.site-header .user span').forEach(e=>setText(e,patient.full_name||user.email||'Patient'));document.querySelectorAll('.site-header .user .ini').forEach(e=>setText(e,(patient.full_name||'P').split(/\s+/).slice(0,2).map(x=>x[0]).join('').toUpperCase()));}
 function patientIdLabel(p){return p.patient_code||p.id||'—';}
 function renderHistory(sessions){
   const total=$('total'),list=$('list');if(!list)return;
   setText(total,sessions.length);
   let shown=4;const page=4;
   function render(){const q=($('f-search')?.value||'').trim().toLowerCase(),d=$('f-date')?.value||'',dir=$('f-sort')?.value==='old'?1:-1;
    const rows=sessions.filter(s=>(!q||String(s.session_code||s.id).toLowerCase().includes(q))&&(!d||String(s.started_at||'').slice(0,10)===d)).sort((a,b)=>dir*(String(a.started_at||'').localeCompare(String(b.started_at||''))));
    list.innerHTML='';rows.slice(0,shown).forEach(s=>{const li=document.createElement('li');li.className='scard';const available=!!s.recording_available;const code=s.session_code||s.id;li.innerHTML='<div class="sh"><img src="assets/icon-calendar-clock.png" alt="" width="21" height="20"><time datetime="'+esc(s.started_at||'')+'">'+esc(dateFmt(s.started_at))+'<br>'+esc(timeFmt(s.started_at))+'</time><span class="status '+(available?'ok':'na')+'">'+(available?'Recording available':'Recording status unknown/unavailable')+'</span></div><dl><div><dt>Session ID</dt><dd>'+esc(code)+'</dd></div><div><dt>Duration</dt><dd>'+esc(duration(s))+'</dd></div><div><dt>Status</dt><dd>'+esc(statusLabel(s))+'</dd></div></dl><div class="act"><a class="view" href="patient-session-detail.html?session='+encodeURIComponent(s.id)+'">View Session Detail<img src="assets/arrow.png" alt="" width="49" height="41"></a></div>';list.appendChild(li);});
    const empty=$('empty');if(empty){empty.hidden=rows.length>0;setText($('empty-t'),sessions.length?'No sessions found':'No monitoring sessions yet');setText($('empty-p'),sessions.length?'Try a different session ID or date, or clear the filters.':'Your monitoring sessions will appear here when sessions are saved for your patient account.');}
    setText($('count'),rows.length?'Showing '+Math.min(shown,rows.length)+' of '+rows.length+' sessions':'');const more=$('more');if(more)more.hidden=rows.length<=shown;
   }
   ['f-date','f-search','f-sort'].forEach(id=>$(id)?.addEventListener('input',()=>{shown=page;render()}));$('more')?.addEventListener('click',()=>{shown+=page;render()});render();
 }
 async function loadProfile(ctx){const p=ctx.patient,u=ctx.user;const vals=document.querySelectorAll('.pf-id h2');vals.forEach(e=>setText(e,p.full_name||u.email));document.querySelectorAll('.pf-id p').forEach(e=>setText(e,'Patient ID: '+patientIdLabel(p)));document.querySelectorAll('.pf-id .avatar').forEach(e=>setText(e,(p.full_name||'P').split(/\s+/).slice(0,2).map(x=>x[0]).join('').toUpperCase()));
  const info=document.querySelectorAll('.pf .fields dd');if(info.length>=4){setText(info[0],p.full_name||'—');setText(info[1],patientIdLabel(p));setText(info[2],u.email||'—');setText(info[3],dateFmt(p.date_of_birth));}
  const account=document.querySelectorAll('.pf .rows dd');if(account.length>=1)setText(account[0],u.email||'—');
  document.querySelectorAll('.pf .head .tag').forEach(e=>{if(e.textContent.trim()==='Prototype Data')e.textContent='Supabase Data'});
  const logout=document.querySelector('.pf a[href="login.html"]');if(logout){logout.href='#';logout.addEventListener('click',async e=>{e.preventDefault();await client.auth.signOut();location.href='patient-signin.html';});}
  const edit=$('edit');if(edit)edit.addEventListener('click',()=>{const n=$('edit-note');if(n){n.hidden=false;n.textContent='Profile editing is not connected yet. Contact the administrator to update registered details.';}});
 }
 async function loadMonitoring(ctx,sessions){const p=ctx.patient;updateHeader(p,ctx.user);const latest=sessions[0];
  document.querySelectorAll('.eitp .head .pill').forEach(e=>setText(e,p.full_name||'Patient'));
  const note=document.querySelector('.eitp-note');if(note)note.textContent='The EIT visualization and ECG waveform on this page are illustrative placeholders until the reconstruction/ECG display pipeline is connected to validated session measurements.';
  const meta=document.querySelectorAll('.info-col .meta dd');if(meta.length>=3){setText(meta[0],patientIdLabel(p));setText(meta[1],latest?(latest.session_code||latest.id):'No session');setText(meta[2],latest?timeFmt(latest.started_at):'—');}
  const active=document.querySelector('.box.session .pills');if(active)active.innerHTML='<span class="pill">'+esc(latest?statusLabel(latest):'No session')+'</span><span class="pill">'+esc(latest?duration(latest):'No monitoring session')+'</span>';
  const stat=document.querySelector('.empties .stat .big');if(stat)setText(stat,'—');const sig=document.querySelector('.empties .stat .val');if(sig)setText(sig,'No validated ECG value');
  const intro=document.querySelector('main .intro');if(intro&&latest){const ps=intro.querySelectorAll('p');if(ps[1])setText(ps[1],statusLabel(latest)+' session');}
  if(!latest)showPageMessage('No monitoring sessions are linked to this patient account yet.');
 }
 async function loadSessionDetail(ctx,sessions){const params=new URLSearchParams(location.search),requested=params.get('session');if(!requested){showPageMessage('Session ID tidak ditemukan di URL. Kembali ke History dan pilih sesi.');return;}
  const s=sessions.find(x=>x.id===requested||x.session_code===requested);if(!s){const msg=$('msg');if(msg){msg.hidden=false;setText($('msg-t'),'Session not found');setText($('msg-p'),'This session is not available in the signed-in patient account.');}$('records')&&($('records').hidden=true);return;}
  const code=s.session_code||s.id;setText($('sid'),code);setText($('i-date'),dateFmt(s.started_at));setText($('i-time'),timeFmt(s.started_at));setText($('i-dur'),duration(s));setText($('i-rec'),s.recording_available?'Available':'Not marked available');setText($('s-id'),code);setText($('s-start'),timeFmt(s.started_at));setText($('s-dur'),'Duration: '+duration(s));document.title='Session '+code+' — HERTS';
  document.querySelectorAll('.sd-title + .done, #state').forEach(e=>setText(e,statusLabel(s)));document.querySelectorAll('.sd-cards .eitp .head .pill').forEach(e=>setText(e,ctx.patient.full_name||'Patient'));
  const note=document.querySelector('.eitp-note');if(note)note.textContent='The EIT visualization and ECG waveform are illustrative placeholders. Raw ADC measurements are not yet converted into a validated ECG waveform or EIT reconstruction on this page.';
  const ph=document.querySelectorAll('.eitp-chart .ph');ph.forEach(e=>setText(e,'Placeholder — not reconstructed data'));
  const {count,error}=await client.from('measurements').select('id',{count:'exact',head:true}).eq('session_id',s.id);if(error){showPageMessage('Session details loaded, but measurement count could not be read: '+error.message);}else{const about=document.querySelector('.about p');if(about)about.textContent='This session contains '+count+' stored measurement rows. The page does not yet reconstruct EIT images or calculate validated ECG heart rate from those rows; the displayed visual assets remain illustrative.';}
  setText($('hr'),'—');
 }
 async function main(){if(!client){showPageMessage('Supabase client belum tersedia.');return;}try{const ctx=await getPatient();if(!ctx)return;updateHeader(ctx.patient,ctx.user);const page=location.pathname.split('/').pop();if(page==='patient-profile.html')await loadProfile(ctx);else{const sessions=await getSessions(ctx.patient.id);if(page==='patient-history.html')renderHistory(sessions);else if(page==='patient-monitoring.html')await loadMonitoring(ctx,sessions);else if(page==='patient-session-detail.html')await loadSessionDetail(ctx,sessions);}}catch(e){console.error('HERTS Patient Portal:',e);showPageMessage('Tidak dapat memuat data pasien dari Supabase: '+(e.message||'Unknown error')+'. Periksa login, relasi data, dan kebijakan RLS.');}}
 document.addEventListener('DOMContentLoaded',main);
})();
