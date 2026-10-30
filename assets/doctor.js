/* HERTS Doctor Portal — shared data + page shell (frontend prototype).
   Fictional sample data for design demonstration only — not real patient data.
   TODO (backend): replace HD_PATIENTS / HD_SESSIONS with API calls scoped to the signed-in doctor. */

var HD_DOCTOR = {name:"Dr. Sari Wulandari", ini:"SW", email:"sari.wulandari@example.com", id:"DOC-001"};
var HD_TODAY = "2026-10-15";

var HD_PATIENTS = [
  ["P001","Budi Artanto"],["P002","Siti Rahayu"],["P003","Agus Pratama"],["P004","Dewi Lestari"],
  ["P005","Rina Mahendra"],["P006","Hadi Santoso"],["P007","Maya Kusuma"],["P008","Tono Wibowo"]
];

/* [session id, patient id, date, start, duration (min), status: active|completed|stopped] */
var HD_SESSIONS = [
  ["SES-018","P001","2026-10-15","09:30",null,"active"],
  ["SES-017","P002","2026-10-15","08:45",21,"completed"],
  ["SES-016","P003","2026-10-14","10:30",18,"completed"],
  ["SES-015","P004","2026-10-14","09:00",22,"completed"],
  ["SES-014","P005","2026-10-13","11:15",6,"stopped"],
  ["SES-013","P006","2026-10-13","10:00",18,"completed"],
  ["SES-012","P001","2026-10-10","09:30",18,"completed"],
  ["SES-011","P001","2026-10-09","10:30",18,"completed"],
  ["SES-010","P001","2026-10-08","10:30",22,"completed"],
  ["SES-009","P001","2026-10-07","10:30",18,"completed"],
  ["SES-008","P002","2026-10-12","09:00",19,"completed"],
  ["SES-007","P003","2026-10-11","10:00",20,"completed"],
  ["SES-006","P004","2026-10-10","11:00",17,"completed"],
  ["SES-005","P005","2026-10-09","11:00",21,"completed"],
  ["SES-004","P006","2026-10-08","10:00",19,"completed"]
];

var HD = (function(){
  var M=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

  var $=function(s,r){
    return (r||document).querySelector(s);
  };

  function date(d){
    var p=d.split("-");
    return p[2]+" "+M[+p[1]-1]+" "+p[0];
  }

  function time(t){
    var p=t.split(":"),h=+p[0];
    return (h%12||12).toString().padStart(2,"0")+":"+p[1]+" "+(h<12?"AM":"PM");
  }

  function dur(s,ongoing){
    return s[4]==null
      ?(ongoing?"02:14 (ongoing)":"02:14")
      :(s[4]<10?"0"+s[4]:s[4])+" Min";
  }

  function patient(id){
    return HD_PATIENTS.filter(function(p){
      return p[0]===id;
    })[0];
  }

  function sessionsOf(pid){
    return HD_SESSIONS.filter(function(s){
      return s[1]===pid;
    }).sort(function(a,b){
      return (b[2]+b[3])<(a[2]+a[3])?-1:1;
    });
  }

  function latest(pid){
    return sessionsOf(pid)[0]||null;
  }

  function session(id){
    return HD_SESSIONS.filter(function(s){
      return s[0]===id;
    })[0];
  }

  var LABEL={
    active:"Active",
    completed:"Completed",
    stopped:"Stopped Early"
  };

  function badge(st){
    return st
      ?'<span class="bdg '+st+'">'+LABEL[st]+'</span>'
      :'<span class="bdg none">No Recent Session</span>';
  }

  function when(s){
    return '<div class="when"><img src="assets/icon-calendar-clock.png" alt="" width="15" height="14"><div><b>'+
      date(s[2])+'</b><span>'+time(s[3])+'</span></div></div>';
  }

  function esc(t){
    return String(t).replace(/[&<>"]/g,function(c){
      return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c];
    });
  }

  function param(k){
    var m=location.search.match(new RegExp("[?&]"+k+"=([^&]+)"));
    return m?decodeURIComponent(m[1]).toUpperCase():null;
  }

  function shell(active){
    var nav=function(href,label,key){
      return '<a href="'+href+'"'+
        (active===key?' aria-current="page"':'')+'>'+label+'</a>';
    };

    /* Doctor Portal header */
    document.body.insertAdjacentHTML("afterbegin",
      '<header class="site-header dr"><div class="bar">'+
      '<a class="brand" href="doctor-overview.html" aria-label="HERTS Doctor Portal — Overview">'+
      '<img src="assets/herts-logo-white.png" alt="" width="132" height="78">'+
      '<span>HERTS<small>Doctor Portal</small></span></a>'+
      '<nav class="nav" aria-label="Main">'+
      nav("doctor-overview.html","Overview","overview")+
      nav("doctor-patients.html","Patients","patients")+
      '</nav>'+
      '<a class="user'+(active==="profile"?' is-active':'')+
      '" href="doctor-profile.html" aria-label="My profile">'+
      '<span>'+HD_DOCTOR.name+'</span><span class="ini">'+HD_DOCTOR.ini+'</span>'+
      '</a></div></header>'
    );

    /* Footer without Contact or Gmail */
    document.body.insertAdjacentHTML("beforeend",
      '<footer class="site-footer dr"><div class="foot">'+
      '<div>'+
      '<img class="flogo" src="assets/herts-logo.png" alt="" width="132" height="78">'+
      '<p class="t">HERTS — Cardiac Monitor</p>'+
      '<p>High-speed Electrical Reconstruction Tomography System</p>'+
      '<p>Continuous Cardiac Monitoring</p>'+
      '</div>'+
      '<nav aria-label="Footer"><h3>Navigasi</h3><ul>'+
      '<li><a href="doctor-overview.html">Overview</a></li>'+
      '<li><a href="doctor-patients.html">Patients</a></li>'+
      '</ul></nav>'+
      '</div></footer>'
    );
  }

  return {
    $:$,
    date:date,
    time:time,
    dur:dur,
    patient:patient,
    sessionsOf:sessionsOf,
    latest:latest,
    session:session,
    badge:badge,
    when:when,
    esc:esc,
    param:param,
    shell:shell
  };
})();
