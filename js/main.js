(()=>{
const C=window.CONFIG,$=i=>document.getElementById(i),isM=Math.min(innerWidth,innerHeight)<600;
const R=new THREE.WebGLRenderer({canvas:$('c'),antialias:true});
R.setPixelRatio(Math.min(devicePixelRatio,2));
// Tono más oscuro general para reducir el brillo base
R.toneMapping=THREE.ACESFilmicToneMapping;
R.toneMappingExposure=0.65;
const S=new THREE.Scene(),cam=new THREE.PerspectiveCamera(70,1,.1,2000),G=new THREE.Group();
S.add(G,cam);
const mk=(w,h,f)=>{const c=document.createElement('canvas');c.width=w;c.height=h;f(c.getContext('2d'),w,h);const tx=new THREE.CanvasTexture(c);tx.generateMipmaps=false;tx.minFilter=THREE.LinearFilter;tx.magFilter=THREE.LinearFilter;return tx};
const add=(o)=>({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,...o});

/* ---------- brillo (bloom) MUY REDUCIDO ---------- */
let comp=null;
if(C.bloom&&THREE.EffectComposer&&THREE.UnrealBloomPass){
  comp=new THREE.EffectComposer(R);comp.addPass(new THREE.RenderPass(S,cam));
  // Antes: strength 0.85, radius 0.55, threshold 0.3
  // Ahora: strength 0.35, radius 0.3, threshold 0.6 → mucho menos resplandor
  comp.addPass(new THREE.UnrealBloomPass(new THREE.Vector2(innerWidth,innerHeight),isM?.25:.35,.3,.6));
}

/* ---------- galaxia (colores más suaves) ---------- */
const dot=mk(64,64,x=>{const g=x.createRadialGradient(32,32,0,32,32,32);g.addColorStop(0,'rgba(255,255,255,.85)');g.addColorStop(.3,'rgba(255,255,255,.35)');g.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=g;x.fillRect(0,0,64,64)});
function pts(n,pos,hue){const p=new Float32Array(n*3),c=new Float32Array(n*3),k=new THREE.Color();
  for(let i=0;i<n;i++){pos(p,i*3);k.setHSL(hue(),.65,.4+Math.random()*.25);c.set([k.r,k.g,k.b],i*3)}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(p,3));g.setAttribute('color',new THREE.BufferAttribute(c,3));return g}
const arm=(p,j)=>{const r=26+Math.pow(Math.random(),1.5)*125,a=r*.035+(j/3%3)*2.094+(Math.random()-.5)*(.25+r/300);p[j]=Math.cos(a)*r;p[j+1]=(Math.random()-.5)*40*(1-r/175);p[j+2]=Math.sin(a)*r};
// Partículas más pequeñas
const core=new THREE.Points(pts(isM?16000:32000,arm,()=>.5+Math.random()*.2),new THREE.PointsMaterial(add({size:1.2,map:dot,vertexColors:true})));
const dust=new THREE.Points(pts(isM?600:1400,arm,()=>.9+Math.random()*.08),new THREE.PointsMaterial(add({size:2.5,map:dot,vertexColors:true,opacity:.4})));
G.add(core,dust);
const bg=new THREE.Points(pts(5000,(p,j)=>{const a=Math.random()*6.283,b=Math.acos(2*Math.random()-1),r=600+Math.random()*300;p[j]=r*Math.sin(b)*Math.cos(a);p[j+1]=r*Math.cos(b);p[j+2]=r*Math.sin(b)*Math.sin(a)},()=>.5+Math.random()*.25),new THREE.PointsMaterial(add({size:2.2,map:dot,vertexColors:true})));
S.add(bg);
// Nebulosas más tenues
[[0x2b6cff,-60,10,-40,280],[0xb03cff,70,-5,50,250],[0xff3c9a,10,20,-95,220]].forEach(([c,x,y,z,s])=>{
  const n=new THREE.Sprite(new THREE.SpriteMaterial(add({map:dot,color:c,opacity:.08})));n.position.set(x,y,z);n.scale.set(s,s,1);G.add(n)});
// Agujero negro y resplandor reducido
S.add(new THREE.Mesh(new THREE.SphereGeometry(16,48,48),new THREE.MeshBasicMaterial({color:0})));
const glow=new THREE.Sprite(new THREE.SpriteMaterial(add({map:dot,color:0x3366ff,opacity:.35})));glow.scale.set(100,100,1);S.add(glow);
const ring=new THREE.Mesh(new THREE.CircleGeometry(42,96),new THREE.MeshBasicMaterial(add({side:THREE.DoubleSide,map:mk(512,512,x=>{
  const g=x.createRadialGradient(256,256,0,256,256,256);g.addColorStop(.5,'rgba(0,255,255,0)');g.addColorStop(.56,'rgba(0,255,255,.7)');g.addColorStop(.76,'rgba(0,153,255,.5)');g.addColorStop(.94,'rgba(120,40,255,.2)');g.addColorStop(1,'rgba(120,40,255,0)');x.fillStyle=g;x.fillRect(0,0,512,512)})})));
ring.rotation.x=Math.PI/2;S.add(ring);

/* ---------- corazones que caen ---------- */
const heartT=mk(64,64,x=>{x.font='54px serif';x.textAlign='center';x.fillStyle='#fff';x.fillText('♥',32,50)});
const hearts=[];
function drop(s,init){const a=Math.random()*6.283,r=40+Math.random()*190;s.position.set(Math.cos(a)*r,init?Math.random()*200-60:140,Math.sin(a)*r);s.userData.v=.1+Math.random()*.2;s.userData.p=Math.random()*6}
for(let i=0;i<(isM?25:50);i++){const s=new THREE.Sprite(new THREE.SpriteMaterial(add({map:heartT,opacity:.6,color:new THREE.Color().setHSL(.9+Math.random()*.08,.9,.55)})));s.scale.set(4,4,1);drop(s,true);S.add(s);hearts.push(s)}

/* ---------- estrellas fugaces (pegadas a la cámara) ---------- */
const sh=[];
for(let i=0;i<3;i++){const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(new Float32Array([0,0,0,-26,-10,0]),3));g.setAttribute('color',new THREE.BufferAttribute(new Float32Array([1,1,1,0,0,0]),3));
  const l=new THREE.Line(g,new THREE.LineBasicMaterial(add({vertexColors:true})));l.visible=false;l.userData.next=2+i*2.5;cam.add(l);sh.push(l)}

/* ---------- TEXTOS FLOTANTES CON FONDO LEGIBLE ---------- */
let items=[],bid=0;const used=[],cache=new Map();
function place(o){let x,y,z,t=0;do{const r=58+Math.random()*92,a=Math.random()*6.283;x=Math.cos(a)*r;z=Math.sin(a)*r;y=(Math.random()-.5)*24;t++}while(t<60&&used.some(u=>(u[0]-x)**2+(u[1]-y)**2+(u[2]-z)**2<520));used.push([x,y,z]);o.position.set(x,y,z);o.userData.y=y;o.userData.f=Math.random()*6.28;G.add(o);items.push(o)}

// Texto con fondo oscuro semitransparente y borde para máxima legibilidad
function txt(s,col){
  const W=640,H=180;
  const t=mk(W,H,x=>{
    // Fondo oscuro con bordes redondeados
    const pad=16,rr=28;
    x.beginPath();
    x.roundRect?x.roundRect(pad,pad,W-pad*2,H-pad*2,rr):x.rect(pad,pad,W-pad*2,H-pad*2);
    x.fillStyle='rgba(3,4,12,.72)';
    x.fill();
    x.strokeStyle='rgba(0,212,255,.25)';
    x.lineWidth=2;
    x.stroke();

    // Texto con sombra fuerte
    x.font='600 78px Caveat,cursive';
    x.textAlign='center';
    x.textBaseline='middle';
    // Sombra negra para contraste
    x.shadowColor='rgba(0,0,0,.95)';
    x.shadowBlur=12;
    x.shadowOffsetY=2;
    x.fillStyle=col;
    x.fillText(s,W/2,H/2,W-60);
    // Segunda capa sin sombra para nitidez
    x.shadowBlur=0;x.shadowOffsetY=0;
    x.fillText(s,W/2,H/2,W-60);
  });
  const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:t,transparent:true,depthWrite:false}));
  sp.scale.set(40,40*(H/W),1);
  return sp;
}

function frame(im){
  const asp=im?Math.min(1.8,Math.max(.6,im.width/im.height)):1.2,W=640,H=Math.round(W/asp);
  const t=mk(W,H,x=>{
    x.beginPath();
    x.roundRect?x.roundRect(0,0,W,H,40):x.rect(0,0,W,H);
    x.clip();
    if(im){
      x.drawImage(im,0,0,W,H);
      x.strokeStyle='rgba(0,212,255,.75)';
      x.lineWidth=10;
      x.stroke();
    }else{
      const g=x.createLinearGradient(0,0,W,H);
      g.addColorStop(0,'#1b2a5e');g.addColorStop(1,'#7b2ff7');
      x.fillStyle=g;x.fillRect(0,0,W,H);
      x.fillStyle='#fff';x.textAlign='center';x.font='150px serif';
      x.fillText('♥',W/2,H/2+40);
      x.font='46px Caveat,cursive';x.fillText('Tu foto aquí',W/2,H-36);
      x.strokeStyle='rgba(120,220,255,.6)';x.lineWidth=8;x.stroke();
    }
  });
  return {t,asp,ph:!im};
}

function resolvePhotoUrl(src){
  if(!src)return '';
  const fname=src.split(/[/\\]/).pop();
  if(window.PHOTOS_DATA&&(window.PHOTOS_DATA[fname]||window.PHOTOS_DATA[src])){
    return window.PHOTOS_DATA[fname]||window.PHOTOS_DATA[src];
  }
  return encodeURI(src);
}

function loadTex(src){
  if(!cache.has(src))cache.set(src,new Promise(res=>{
    if(!src)return res(frame(null));
    const finalUrl=resolvePhotoUrl(src);
    const im=new Image();
    im.onload=()=>{
      try{
        res(frame(im));
      }catch(e){
        const asp=Math.min(1.8,Math.max(.6,im.width/im.height));
        const tex=new THREE.Texture(im);
        tex.generateMipmaps=false;
        tex.minFilter=THREE.LinearFilter;
        tex.magFilter=THREE.LinearFilter;
        tex.needsUpdate=true;
        res({t:tex,asp,ph:false});
      }
    };
    im.onerror=()=>{
      console.warn('No se pudo cargar la imagen:',src);
      res(frame(null));
    };
    im.src=finalUrl;
  }));
  return cache.get(src);
}

function build(){
  const id=++bid,cols=['#00d4ff','#b07bff','#ff6bb5','#6ec6ff','#ffd6e8'];
  const rawPhotos=C.photos&&C.photos.length?C.photos:[];
  // Si hay fotos y son pocas (< 10), duplicar exactamente una sola vez (7 fotos -> 14 fotos)
  const ph=(rawPhotos.length>0&&rawPhotos.length<10)?[...rawPhotos,...rawPhotos]:(rawPhotos.length?rawPhotos:[{},{},{},{}]);

  for(let i=0;i<(isM?24:34);i++)place(txt(C.phrases[i%C.phrases.length],cols[i%cols.length]));
  for(let i=0;i<ph.length;i++){
    const p=ph[i];
    const filePath=p.file?'images/'+p.file:'';
    loadTex(filePath).then(({t,asp,ph:isPh})=>{
      if(id!==bid)return;
      const s=new THREE.Sprite(new THREE.SpriteMaterial({map:t,transparent:true}));
      const h=isM?15:18;
      s.scale.set(h*asp,h,1);
      s.userData={src:filePath,msg:p.msg||'',photo:1,ok:!isPh};
      place(s);
    });
  }
}

/* ---------- cámara y controles ---------- */
let th=.6,ph=.35,dist=470,tgt=470,intro=0,started=0,moved=0,pinch=0;const P=new Map(),cv=$('c'),clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
cv.addEventListener('pointerdown',e=>{cv.setPointerCapture(e.pointerId);P.set(e.pointerId,[e.clientX,e.clientY]);moved=0});
cv.addEventListener('pointermove',e=>{const o=P.get(e.pointerId);if(!o)return;const dx=e.clientX-o[0],dy=e.clientY-o[1];P.set(e.pointerId,[e.clientX,e.clientY]);
  if(P.size===1){th-=dx*.005;ph=clamp(ph-dy*.005,.25,2.9);moved+=Math.abs(dx)+Math.abs(dy);intro=0}
  else if(P.size===2){const[a,b]=[...P.values()],d=Math.hypot(a[0]-b[0],a[1]-b[1]);if(pinch)tgt=clamp(tgt*pinch/d,50,420);pinch=d;moved=99}});
const up=e=>{const was=P.has(e.pointerId);P.delete(e.pointerId);pinch=0;if(was&&moved<8&&!P.size&&e.type==='pointerup')pick(e)};
cv.addEventListener('pointerup',up);cv.addEventListener('pointercancel',up);
cv.addEventListener('wheel',e=>{tgt=clamp(tgt+e.deltaY*.2,50,420)},{passive:true});
const rc=new THREE.Raycaster(),mv=new THREE.Vector2();
function pick(e){
  mv.set(e.clientX/innerWidth*2-1,-(e.clientY/innerHeight)*2+1);rc.setFromCamera(mv,cam);
  const h=rc.intersectObjects(items.filter(o=>o.userData.photo))[0];if(!h||!h.object.userData.ok)return;
  $('mi').src=resolvePhotoUrl(h.object.userData.src);$('mm').textContent=h.object.userData.msg;$('modal').classList.add('on');
}
const closeM=()=>$('modal').classList.remove('on');
$('mx').onclick=closeM;$('modal').onclick=e=>{if(e.target===$('modal'))closeM()};addEventListener('keydown',e=>{if(e.key==='Escape')closeM()});

/* ---------- loop ---------- */
function size(){R.setSize(innerWidth,innerHeight);comp&&comp.setSize(innerWidth,innerHeight);cam.aspect=innerWidth/innerHeight;cam.updateProjectionMatrix()}
addEventListener('resize',size);size();
let last=0;
function loop(ms){const t=ms/1000,dt=Math.min(.05,t-last);last=t;
  if(!P.size)th+=.0016;if(intro)ph+=(1.2-ph)*.025;dist+=(tgt-dist)*.04;
  cam.position.set(dist*Math.sin(ph)*Math.sin(th),dist*Math.cos(ph),dist*Math.sin(ph)*Math.cos(th));cam.lookAt(0,0,0);
  G.rotation.y=t*.05;bg.rotation.y=t*.01;ring.rotation.z=t*.4;glow.material.opacity=.3+Math.sin(t*1.4)*.08;
  items.forEach(o=>{o.position.y=o.userData.y+Math.sin(t*.7+o.userData.f)*.8});
  hearts.forEach(s=>{s.position.y-=s.userData.v;s.position.x+=Math.sin(t+s.userData.p)*.05;if(s.position.y<-70)drop(s)});
  sh.forEach(l=>{if(!l.visible){if(t>l.userData.next){l.visible=true;l.position.set(Math.random()*80-20,35+Math.random()*30,-130-Math.random()*60);l.userData.life=0}}
    else{l.userData.life+=dt;l.position.x-=dt*110;l.position.y-=dt*42;l.material.opacity=1-l.userData.life/1.1;if(l.userData.life>1.1){l.visible=false;l.userData.next=t+3+Math.random()*5}}});
  comp?comp.render():R.render(S,cam);requestAnimationFrame(loop)}

/* ---------- textos, música, inicio ---------- */
document.title=C.title;$('t1').textContent=$('ttl').textContent=C.title;$('t2').textContent=C.subtitle;
if(C.startDate){const d=Math.floor((Date.now()-new Date(C.startDate+'T00:00:00'))/864e5);if(d>=0)$('days').textContent='Llevamos '+d.toLocaleString('es')+' días juntos 💙'}
if(location.protocol==='file:'&&C.photos.length&&!window.PHOTOS_DATA)$('warn').hidden=false;
const au=new Audio();au.loop=true;
if(C.music){au.src=C.music;$('mute').hidden=false;au.onerror=()=>$('mute').hidden=true}
$('go').onclick=()=>{started=1;tgt=isM?240:170;intro=1;setTimeout(()=>intro=0,6000);$('start').style.opacity=0;setTimeout(()=>$('start').remove(),1300);
  $('ttl').classList.add('on');$('days').classList.add('on');if(C.music)au.play().catch(()=>{});setTimeout(()=>$('hint').style.opacity=0,9000)};
$('mute').onclick=()=>{if(au.paused){au.play();$('mute').textContent='🔊'}else{au.pause();$('mute').textContent='🔇'}};
if(!document.documentElement.requestFullscreen)$('fs').hidden=true;
$('fs').onclick=()=>document.fullscreenElement?document.exitFullscreen():document.documentElement.requestFullscreen();

(document.fonts&&document.fonts.load?Promise.race([document.fonts.load('600 80px Caveat'),new Promise(r=>setTimeout(r,1500))]):Promise.resolve()).then(build);
requestAnimationFrame(loop);
})();
