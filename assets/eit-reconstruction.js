/* Static, clearly labelled EIT reconstruction-style preview. Replace field data with actual JAC output when integration is ready. */
(function(){
  'use strict';
  function draw(canvas){
    if(!canvas || canvas.dataset.jacDrawn==='1') return;
    canvas.dataset.jacDrawn='1';
    var ctx=canvas.getContext('2d'), W=900,H=700; canvas.width=W; canvas.height=H;
    var cx=450,cy=350,rx=310,ry=245;
    ctx.clearRect(0,0,W,H);
    // White background and softly blended fixed field based on the supplied JAC screenshot.
    ctx.fillStyle='#fff';ctx.fillRect(0,0,W,H);
    var img=ctx.createImageData(W,H), d=img.data;
    var stops=[[0,[0,35,190]],[.22,[0,190,235]],[.42,[30,220,150]],[.58,[255,235,0]],[.76,[255,110,0]],[1,[185,0,0]]];
    function cmap(v){v=Math.max(0,Math.min(1,v));for(var i=1;i<stops.length;i++){if(v<=stops[i][0]){var a=stops[i-1],b=stops[i],t=(v-a[0])/(b[0]-a[0]);return [0,1,2].map(function(k){return Math.round(a[1][k]+(b[1][k]-a[1][k])*t)})}}return stops[stops.length-1][1]}
    function gauss(x,y,mx,my,sx,sy){return Math.exp(-(((x-mx)*(x-mx))/(2*sx*sx)+((y-my)*(y-my))/(2*sy*sy)))}
    for(var y=0;y<H;y++)for(var x=0;x<W;x++){
      var u=(x-cx)/rx,v=(y-cy)/ry, q=(y*W+x)*4;
      if(u*u+v*v>1){d[q+3]=0;continue}
      // Stable, asymmetric high/low conductivity regions echo the reference reconstruction.
      var val=.44 + .82*gauss(u,v,.43,.02,.22,.42)+.75*gauss(u,v,-.20,.13,.25,.42)
        - .92*gauss(u,v,.02,-.40,.34,.22)-.58*gauss(u,v,-.78,.15,.13,.23)
        -.72*gauss(u,v,.78,.55,.16,.20)-.36*gauss(u,v,-.55,.65,.20,.17);
      var c=cmap((val+.42)/1.85);d[q]=c[0];d[q+1]=c[1];d[q+2]=c[2];d[q+3]=255;
    }
    ctx.putImageData(img,0,0);
    // Triangular mesh effect, clipped to the thorax boundary.
    ctx.save();ctx.beginPath();ctx.ellipse(cx,cy,rx,ry,0,0,Math.PI*2);ctx.clip();
    ctx.strokeStyle='rgba(255,255,255,.28)';ctx.lineWidth=1;
    var step=17;
    for(var yy=cy-ry;yy<=cy+ry;yy+=step){ctx.beginPath();for(var xx=cx-rx;xx<=cx+rx;xx+=step){if(xx===cx-rx)ctx.moveTo(xx,yy);else ctx.lineTo(xx,yy)}ctx.stroke()}
    for(var xx=cx-rx;xx<=cx+rx;xx+=step){ctx.beginPath();for(var yy=cy-ry;yy<=cy+ry;yy+=step){if(yy===cy-ry)ctx.moveTo(xx,yy);else ctx.lineTo(xx,yy)}ctx.stroke()}
    for(var yy=cy-ry;yy<cy+ry;yy+=step*2){for(var xx=cx-rx;xx<cx+rx;xx+=step*2){ctx.beginPath();ctx.moveTo(xx,yy);ctx.lineTo(xx+step*2,yy+step*2);ctx.moveTo(xx+step*2,yy);ctx.lineTo(xx,yy+step*2);ctx.stroke()}}
    ctx.restore();
    ctx.strokeStyle='#17212f';ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(cx,cy,rx,ry,0,0,Math.PI*2);ctx.stroke();
    // Electrodes around the boundary, labelled in the same order as the acquisition UI.
    ctx.font='600 25px IBM Plex Sans,Arial,sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';
    for(var k=0;k<8;k++){
      var a=-Math.PI/2+k*Math.PI/4, ex=cx+rx*Math.cos(a),ey=cy+ry*Math.sin(a);
      ctx.fillStyle='#f00000';ctx.strokeStyle='#fff';ctx.lineWidth=4;ctx.beginPath();ctx.arc(ex,ey,12,0,Math.PI*2);ctx.fill();ctx.stroke();
      ctx.fillStyle='#24384b';ctx.fillText('E'+(k+1),cx+(rx+37)*Math.cos(a),cy+(ry+37)*Math.sin(a));
    }
    // Static-preview label is intentional until real JAC values are connected.
    ctx.fillStyle='rgba(255,255,255,.92)';ctx.fillRect(18,16,230,34);ctx.fillStyle='#526579';ctx.font='600 16px IBM Plex Sans,Arial,sans-serif';ctx.textAlign='left';ctx.fillText('STATIC JAC-STYLE PREVIEW',28,33);
  }
  window.drawHertzJacPreview=draw;
  function init(){document.querySelectorAll('canvas[data-jac-preview], #eit').forEach(draw)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
