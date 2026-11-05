/* Patient ECG viewer — reads session ECG samples from Supabase measurements.
   The display smoothing is visual only; raw values are used for BPM estimation. */
(function(){
  "use strict";
  var timer=null, busy=false;
  function $(id){return document.getElementById(id);}
  function estimateHeartRate(samples,sampleRate){
    if(!samples||samples.length<sampleRate*2)return null;
    var values=samples.map(function(p){return Number(p.adc_value);});
    var sorted=values.slice().sort(function(a,b){return a-b;});
    var median=sorted[Math.floor(sorted.length/2)],max=sorted[sorted.length-1];
    var threshold=median+(max-median)*0.55;
    if(!isFinite(threshold)||max<=median)return null;
    var peaks=[],refractory=Math.round(sampleRate*0.30),lastPeak=-refractory;
    for(var i=2;i<values.length-2;i++){
      if(values[i]>=threshold&&values[i]>=values[i-1]&&values[i]>values[i+1]&&values[i]>=values[i-2]&&values[i]>=values[i+2]&&i-lastPeak>=refractory){peaks.push(i);lastPeak=i;}
    }
    if(peaks.length<2)return null;
    var intervals=[];
    for(var j=1;j<peaks.length;j++){var delta=peaks[j]-peaks[j-1],bpm=60*sampleRate/delta;if(bpm>=35&&bpm<=220)intervals.push(delta);}
    if(!intervals.length)return null;
    intervals.sort(function(a,b){return a-b;});
    var mid=Math.floor(intervals.length/2),medianInterval=intervals.length%2?intervals[mid]:(intervals[mid-1]+intervals[mid])/2;
    return Math.round(60*sampleRate/medianInterval);
  }
  function render(samples){
    var host=$("ecg"),status=$("ecg-status"),meta=$("ecg-meta"),bpmEl=$("ecg-bpm"),note=$("ecg-bpm-note");
    if(!host)return;
    if(!samples||!samples.length){
      host.innerHTML='<p style="padding:24px;color:var(--ink-2)">No ECG data is available for this session.</p>';
      if(status)status.textContent="No ECG data";
      if(meta)meta.textContent="No ECG recordings are available for this session.";
      if(bpmEl)bpmEl.textContent="—";
      if(note)note.textContent="Heart rate is unavailable because no ECG samples were found.";
      return;
    }
    var points=samples.slice(-500),width=1000,height=190,padX=8,padY=14;
    var raw=points.map(function(p){return Number(p.adc_value);});
    var vals=raw.map(function(_,i){var st=Math.max(0,i-4),en=Math.min(raw.length-1,i+4),sum=0,c=0;for(var j=st;j<=en;j++){sum+=raw[j];c++;}return sum/c;});
    var min=Math.min.apply(null,vals),max=Math.max.apply(null,vals),range=Math.max(1,max-min),plotW=width-padX*2,plotH=height-padY*2;
    var poly=vals.map(function(v,i){var x=padX+(vals.length<=1?plotW/2:i*plotW/(vals.length-1)),y=padY+(max-v)*plotH/range;return x.toFixed(2)+","+y.toFixed(2);}).join(" ");
    var grid="";
    for(var gx=0;gx<=10;gx++){var xg=padX+gx*plotW/10;grid+='<path d="M'+xg+' 0V'+height+'"/>';}
    for(var gy=0;gy<=5;gy++){var yg=gy*height/5;grid+='<path d="M0 '+yg+'H'+width+'"/>';}
    host.innerHTML='<svg viewBox="0 0 '+width+' '+height+'" preserveAspectRatio="none" aria-hidden="true"><g stroke="#DCE4EC" stroke-width="1" fill="none">'+grid+'</g><polyline points="'+poly+'" fill="none" stroke="#2F8FA3" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/></svg>';
    host.setAttribute("aria-label","Recorded ECG waveform with display smoothing");
    if(status)status.textContent="Live monitoring";
    var bpm=estimateHeartRate(samples,500);
    if(bpmEl)bpmEl.textContent=bpm==null?"—":String(bpm);
    if(note)note.textContent=bpm==null?"Unable to estimate heart rate reliably from this ECG window. Record a longer, clear signal and try again.":"Estimated from detected ECG peaks in the latest recording window. Compare with the MS400 setting to validate the result.";
    if(meta){var latest=samples[samples.length-1].recorded_at,updated=latest?new Date(latest).toLocaleString():"available";meta.textContent="Monitoring data updated: "+updated+". Heart rate is estimated from the recorded signal.";}
  }
  async function load(client,sessionId){
    var status=$("ecg-status"),meta=$("ecg-meta");
    if(busy)return;busy=true;
    if(!sessionId){render([]);busy=false;return;}
    try{
      var result=await client.from("measurements").select("seq, adc_value, recorded_at").eq("session_id",sessionId).eq("channel","ECG").order("recorded_at",{ascending:false}).limit(5000);
      if(result.error)throw result.error;
      var bySeq=new Map();
      (result.data||[]).forEach(function(row){if(row.seq==null||row.adc_value==null)return;var key=String(row.seq);if(!bySeq.has(key))bySeq.set(key,row);});
      var samples=Array.from(bySeq.values()).sort(function(a,b){return Number(a.seq)-Number(b.seq);});
      render(samples);
      console.log("HERTS Patient ECG samples loaded",{sessionId:sessionId,rowsFetched:(result.data||[]).length,uniqueSequenceSamples:samples.length});
    }catch(error){
      console.error("HERTS Patient ECG load failed:",error);
      if(status)status.textContent="ECG unavailable";
      if(meta)meta.textContent="ECG monitoring data could not be loaded. Please check the session connection.";
      var host=$("ecg");if(host)host.innerHTML='<p style="padding:24px;color:var(--ink-2)">ECG data could not be loaded for this session.</p>';
      if($("ecg-bpm"))$("ecg-bpm").textContent="—";
      if($("ecg-bpm-note"))$("ecg-bpm-note").textContent="Heart rate unavailable while ECG data is disconnected.";
    }finally{busy=false;}
  }
  window.HERTSPatientECG={load:load,start:function(client,sessionId){load(client,sessionId);if(timer)clearInterval(timer);timer=setInterval(function(){load(client,sessionId);},3000);}};
})();
