/* HERTS Doctor Portal data helpers. Requires Supabase JS/client. */
window.HERTSDoctorData = (function () {
  "use strict";
  function esc(v) { return String(v == null ? "" : v).replace(/[&<>"']/g, function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c];}); }
  function date(v) { if (!v) return "—"; var d=new Date(v); return isNaN(d)?"—":d.toLocaleString("en-GB",{day:"2-digit",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit"}); }
  function duration(s) { if (!s.started_at) return "—"; var a=new Date(s.started_at).getTime(), b=s.ended_at?new Date(s.ended_at).getTime():Date.now(); return Math.max(0,Math.floor((b-a)/60000))+" min"; }
  function badge(st) { var c=(st==="in_progress"||st==="active")?"active":st==="completed"?"completed":"dash"; return '<span class="bdg '+c+'">'+esc((st||"unknown").replace(/_/g," "))+'</span>'; }
  function param(k) { return new URLSearchParams(location.search).get(k); }
  async function doctor() {
    var client=window.HERTS_SUPABASE;
    if(!client) throw new Error("Supabase belum terinisialisasi.");
    var r=await client.auth.getSession(); if(r.error) throw r.error;
    var user=r.data.session&&r.data.session.user;
    if(!user){ location.replace("doctor-signin.html"); throw new Error("Silakan login sebagai dokter."); }
    var p=await client.from("user_profiles").select("user_id, role").eq("user_id",user.id).maybeSingle();
    if(p.error) throw p.error;
    if(!p.data || p.data.role!=="doctor"){ await client.auth.signOut(); location.replace("doctor-signin.html"); throw new Error("Akun ini tidak memiliki role doctor."); }
    document.querySelectorAll(".site-header .user span:first-child").forEach(function(el){el.textContent=user.user_metadata?.full_name||user.email||"Doctor";});
    var initials=(user.user_metadata?.full_name||user.email||"D").split(/\s+/).slice(0,2).map(function(x){return x[0]||""}).join("").toUpperCase();
    document.querySelectorAll(".site-header .ini").forEach(function(el){el.textContent=initials;});
    return {client:client,user:user};
  }
  async function patients(client,userId) {
    var r=await client.from("patients").select("id,patient_code,full_name,date_of_birth,sex,created_at,doctor_user_id").eq("doctor_user_id",userId).order("created_at",{ascending:false});
    if(r.error) throw r.error; return r.data||[];
  }
  async function sessionsFor(client, patientIds) {
    if(!patientIds.length) return [];
    var r=await client.from("sessions").select("id,session_code,patient_id,started_at,duration_minutes,status,recording_available,created_at").in("patient_id",patientIds).order("started_at",{ascending:false});
    if(r.error) throw r.error; return r.data||[];
  }
  return {esc:esc,date:date,duration:duration,badge:badge,param:param,doctor:doctor,patients:patients,sessionsFor:sessionsFor};
})();
