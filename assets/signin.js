/* HERTS sign-in — client-side validation + prototype navigation (frontend only).
   There is NO authentication: any well-formed email and any password are accepted,
   nothing is stored and nobody is really "logged in".
   If the form has data-success-url, the browser goes to that page after validation passes.
   TODO (backend integration): send the credentials to the auth endpoint first and only
   redirect when the server confirms the sign-in. */
(function(){
  var form=document.querySelector('form[data-signin]');
  if(!form) return;
  var email=form.querySelector('#email'), pass=form.querySelector('#password'), status=form.querySelector('.status');
  var emailRe=/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  function setErr(input,msg){
    var box=document.getElementById(input.id+'-err');
    box.textContent=msg||'';
    if(msg){input.setAttribute('aria-invalid','true')}else{input.removeAttribute('aria-invalid')}
  }
  function checkEmail(){
    var v=email.value.trim();
    if(!v){setErr(email,'Please enter your email address.');return false}
    if(!emailRe.test(v)){setErr(email,'Please enter a valid email address, e.g. you@example.com.');return false}
    setErr(email,'');return true;
  }
  function checkPass(){
    if(!pass.value){setErr(pass,'Please enter your password.');return false}
    setErr(pass,'');return true;
  }
  email.addEventListener('blur',function(){if(email.value)checkEmail()});
  email.addEventListener('input',function(){if(email.hasAttribute('aria-invalid'))checkEmail()});
  pass.addEventListener('input',function(){if(pass.hasAttribute('aria-invalid'))checkPass()});
  form.addEventListener('submit',function(e){
    e.preventDefault();
    status.hidden=true;
    var a=checkEmail(), b=checkPass();
    if(!a){email.focus();return}
    if(!b){pass.focus();return}
    var next=form.getAttribute('data-success-url');
    if(next){window.location.href=next;return}
    status.textContent='Prototype only: sign-in is not connected to a backend yet, so no account was signed in.';
    status.hidden=false;
  });
})();
