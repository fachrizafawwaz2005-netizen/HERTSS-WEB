/* HERTZ EIT: use the actual JAC reconstruction screenshot as a static preview.
   This is a reference image only; it is not live or numerically connected to Supabase. */
(function(){
  'use strict';
  function draw(canvas){
    if(!canvas || canvas.dataset.jacDrawn==='1') return;
    canvas.dataset.jacDrawn='1';
    var img = new Image();
    img.onload = function(){
      var scale = Math.min(1200 / img.naturalWidth, 900 / img.naturalHeight, 2);
      canvas.width = Math.round(img.naturalWidth * scale);
      canvas.height = Math.round(img.naturalHeight * scale);
      var ctx = canvas.getContext('2d');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0,0,canvas.width,canvas.height);
      ctx.drawImage(img,0,0,canvas.width,canvas.height);
    };
    img.onerror = function(){
      var ctx=canvas.getContext('2d');
      canvas.width=700; canvas.height=260;
      ctx.fillStyle='#fff'; ctx.fillRect(0,0,700,260);
      ctx.fillStyle='#526579'; ctx.font='16px Arial';
      ctx.fillText('JAC reference image could not be loaded.',20,40);
    };
    img.src='assets/jac-reconstruction-reference.png';
  }
  window.drawHertzJacPreview=draw;
  function init(){document.querySelectorAll('canvas[data-jac-preview], #eit').forEach(draw)}
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init); else init();
})();
