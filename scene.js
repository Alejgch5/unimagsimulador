import * as THREE from './vendor/three.module.js';
import { OrbitControls } from './vendor/OrbitControls.js';

const INFO = {
  bladder: { title: 'Vejiga', description: 'Representación esquemática del reservorio urinario. La posición y el retorno de orina se valoran antes de inflar el balón; el tamaño mostrado no permite estimar volumen ni presión.' },
  urethra: { title: 'Uretra', description: 'Recorrido anatómico simplificado, sin escala clínica. No representa una profundidad de inserción recomendada. Ante resistencia, dolor intenso o sangrado: detener la maniobra y solicitar valoración.' },
  prostate: { title: 'Región prostática', description: 'Relación esquemática de la próstata con la uretra masculina. Una resistencia no autoriza a ejercer fuerza ni a repetir intentos traumáticos.' },
  pelvis: { title: 'Pelvis ósea', description: 'Referencias óseas simplificadas para orientación espacial. Una sospecha de lesión uretral tras trauma requiere valoración especializada antes de instrumentar.' },
  catheter: { title: 'Sonda y balón', description: 'La sonda sigue un trayecto ilustrativo. El balón se muestra donde se ha inflado: que aparezca en pantalla no confirma una posición segura. Nunca debe inflarse para comprobar la posición.' },
  bag: { title: 'Sistema colector', description: 'Sistema cerrado, sin tracción y con drenaje sin obstrucción. El colector debe permanecer por debajo de la vejiga y separado del suelo.' },
  uterus: { title: 'Relaciones pélvicas', description: 'Útero y vagina representados de forma esquemática detrás de la vejiga. Una sonda contaminada o introducida por error en la vagina no se reutiliza para la uretra.' }
};

function material(color, options = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness: .44, metalness: .02, ...options });
}
function tube(points, radius, mat, segments = 64) {
  const curve = points instanceof THREE.Curve ? points : new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p)));
  return new THREE.Mesh(new THREE.TubeGeometry(curve, segments, radius, 12, false), mat);
}
function ellipsoid(x,y,z, sx,sy,sz, mat) {
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(1, 40, 28), mat);
  mesh.position.set(x,y,z); mesh.scale.set(sx,sy,sz); return mesh;
}
function add(parent, object) { parent.add(object); return object; }

/** Procedural teaching illustration. Geometry is not a validated anatomical model. */
export class AnatomyScene {
  constructor(container, {onSelect = () => {}} = {}) {
    this.container=container; this.onSelect=onSelect; this.layer='anatomy'; this.sex='male';
    this.data={sex:'male',insertion:0,balloon:false,drainage:0,injury:false,stage:0,placement:'urethral'};
    this.disposed=false;this._needsRender=true;
    this._motionQuery=window.matchMedia?.('(prefers-reduced-motion: reduce)');this.reduced=Boolean(this._motionQuery?.matches);
    this.selectables=[]; this.labels=[]; this.insertion=-1; this.pointerDown=null;
    this._installStyle();
    this.root=document.createElement('div'); this.root.className='anatomy-viewport'; container.append(this.root);
    try {
      this.renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:'high-performance'});
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1,1.6));
      this.renderer.setClearColor(0x061424,0);
      this.renderer.shadowMap.enabled=true; this.renderer.shadowMap.type=THREE.PCFSoftShadowMap;
      this.renderer.shadowMap.autoUpdate=false;this.renderer.shadowMap.needsUpdate=true;
      this.renderer.outputColorSpace=THREE.SRGBColorSpace;
      this.renderer.toneMapping=THREE.ACESFilmicToneMapping; this.renderer.toneMappingExposure=1.25;
      this.renderer.domElement.setAttribute('aria-label','Modelo 3D esquemático de pelvis y sistema urinario. Usa las etiquetas para identificar estructuras.');
      this.renderer.domElement.setAttribute('role','img'); this.root.append(this.renderer.domElement);
    } catch(error) {
      this.root.innerHTML='<div class="anatomy-unavailable"><span>VISOR 3D NO DISPONIBLE</span><p>Este navegador no pudo iniciar WebGL. Puedes realizar las decisiones del caso y consultar sus explicaciones en el panel clínico.</p></div>';
      this.available=false; return;
    }
    this.available=true;
    this.scene=new THREE.Scene();
    this.camera=new THREE.PerspectiveCamera(36,1,.05,60);
    this.camera.position.set(3.1,1.6,8.4);
    this.controls=new OrbitControls(this.camera,this.renderer.domElement);
    this.controls.target.set(.15,0,0); this.controls.enableDamping=!this.reduced; this.controls.dampingFactor=.08;
    this.controls.minDistance=3.2; this.controls.maxDistance=13;
    this.controls.minPolarAngle=.32; this.controls.maxPolarAngle=Math.PI*.8;
    this.controls.enablePan=true;
    this._onControlsChange=()=>{this._needsRender=true;};
    this.controls.addEventListener('change',this._onControlsChange);
    this._onMotionChange=event=>{this.reduced=event.matches;this.controls.enableDamping=!this.reduced;this._needsRender=true;};
    this._motionQuery?.addEventListener?.('change',this._onMotionChange);
    this.scene.add(new THREE.HemisphereLight(0xc8e9ff,0x162a37,2.1));
    const key=new THREE.DirectionalLight(0xfff0df,3.2); key.position.set(-3,5,5); key.castShadow=true;
    key.shadow.mapSize.set(1024,1024); key.shadow.camera.left=-4; key.shadow.camera.right=4;
    key.shadow.camera.top=4;key.shadow.camera.bottom=-4; key.shadow.bias=-.0008;this.scene.add(key);
    const rim=new THREE.DirectionalLight(0x55cbff,2.8);rim.position.set(3,1,-4);this.scene.add(rim);
    const fill=new THREE.DirectionalLight(0xffb48b,.75);fill.position.set(-4,-1,2);this.scene.add(fill);
    this.anatomy=new THREE.Group();this.scene.add(this.anatomy);
    this._buildEnvironment(); this._buildModel();
    this.hint=document.createElement('div');this.hint.className='anatomy-hint';this.hint.textContent='Arrastra para girar · Pellizca o desplaza para acercar';this.root.append(this.hint);
    this.badge=document.createElement('div');this.badge.className='anatomy-model-note';this.badge.textContent='ANATOMÍA ESQUEMÁTICA · SIN ESCALA';this.root.append(this.badge);
    this.placementNote=document.createElement('div');this.placementNote.className='anatomy-placement-note';this.placementNote.hidden=true;this.placementNote.textContent='COLOCACIÓN VAGINAL · SIN RETORNO';this.root.append(this.placementNote);
    this.raycaster=new THREE.Raycaster();this.pointer=new THREE.Vector2();
    this._pointerStart=e=>{this.pointerDown={x:e.clientX,y:e.clientY};};
    this._pointerEnd=e=>{
      if(!this.pointerDown || Math.hypot(e.clientX-this.pointerDown.x,e.clientY-this.pointerDown.y)>6)return;
      const rect=this.renderer.domElement.getBoundingClientRect();
      this.pointer.set((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1);
      this.raycaster.setFromCamera(this.pointer,this.camera);
      const hits=this.raycaster.intersectObjects(this.selectables,false);
      if(hits.length)this._select(hits[0].object.userData.structure);
    };
    this.renderer.domElement.addEventListener('pointerdown',this._pointerStart);
    this.renderer.domElement.addEventListener('pointerup',this._pointerEnd);
    this.resizeObserver=new ResizeObserver(()=>this._resize());this.resizeObserver.observe(container);this._resize();
    this.isVisible=true;this.intersectionObserver=new IntersectionObserver(entries=>{
      const visible=entries.some(entry=>entry.isIntersecting);if(visible&&!this.isVisible)this._needsRender=true;this.isVisible=visible;
    });this.intersectionObserver.observe(this.root);
    this._frame=(time)=>{
      if(this.disposed)return;
      this.animationId=requestAnimationFrame(this._frame);
      if(document.hidden || !this.isVisible)return;
      // Controls update is cheap and emits change while pointer inertia is settling.
      // A static scene submits no WebGL work, including in software-rendered browsers.
      const controlDelta=this._lastControlsTime?Math.min(.25,(time-this._lastControlsTime)/1000):1/60;
      this._lastControlsTime=time;
      if(this.controls.enableDamping)this.controls.dampingFactor=1-Math.pow(.92,controlDelta*60);
      this.controls.update();
      const animateInjury=Boolean(this.data.injury&&!this.reduced&&!this.data.paused);
      if(!this._needsRender&&(!animateInjury||time-(this.lastRender||0)<1000/15))return;
      if(this.lastRender&&time-this.lastRender<1000/30)return;
      this._needsRender=false;this.lastRender=time;
      if(this.injuryMarker){const pulse=animateInjury?1+Math.sin(time*.006)*.09:1;this.injuryMarker.scale.set(.13*pulse,.18*pulse,.13*pulse);}
      this._updateLabels();this.renderer.render(this.scene,this.camera);
    };
    this.animationId=requestAnimationFrame(this._frame);
  }
  _installStyle(){
    if(document.getElementById('anatomy-scene-style'))return;
    const style=document.createElement('style');style.id='anatomy-scene-style';
    style.textContent=`.anatomy-viewport{position:relative;width:100%;height:100%;min-height:380px;overflow:hidden;background:radial-gradient(ellipse at 45% 38%,#173b50 0,#0a2132 44%,#071722 78%);isolation:isolate}.anatomy-viewport canvas{display:block;width:100%;height:100%;touch-action:none;outline:none}.anatomy-viewport:after{content:'';position:absolute;inset:0;pointer-events:none;box-shadow:inset 0 0 90px #020e1744}.anatomy-label{position:absolute;z-index:2;border:1px solid #9ccdd148;background:#0a2237e8;border-radius:6px;padding:5px 9px;color:#dff4f4;font:500 11px/1.3 system-ui,sans-serif;box-shadow:0 3px 12px #0003;cursor:pointer;white-space:nowrap;transform:translate(-50%,-50%);backdrop-filter:blur(5px)}.anatomy-label:before{content:'';display:inline-block;width:5px;height:5px;background:#5de4d0;border-radius:50%;margin-right:6px;box-shadow:0 0 6px #4af4ce88}.anatomy-label:hover,.anatomy-label[aria-pressed=true]{border-color:#6bf0d0;background:#16423e}.anatomy-label:focus-visible{outline:2px solid #fff;outline-offset:3px}.anatomy-hint{position:absolute;bottom:14px;left:16px;color:#9cb9c9;font:10px/1.4 system-ui,sans-serif;pointer-events:none;z-index:2}.anatomy-model-note{position:absolute;top:15px;left:16px;color:#9cb9c9;font:9px/1.4 system-ui,sans-serif;letter-spacing:1.4px;pointer-events:none;z-index:2}.anatomy-placement-note{position:absolute;bottom:38px;left:16px;border:1px solid #d8aa6b77;background:#382c21dc;border-radius:6px;padding:6px 9px;color:#ffd69d;font:600 10px/1.4 system-ui,sans-serif;letter-spacing:.5px;z-index:2}.anatomy-unavailable{min-height:420px;display:flex;align-items:center;justify-content:center;flex-direction:column;padding:36px;text-align:center;color:#d6e9f1;font:14px/1.6 system-ui,sans-serif}.anatomy-unavailable span{font-size:11px;letter-spacing:2px;color:#83e7d3}.anatomy-unavailable p{max-width:330px}@media(max-width:600px){.anatomy-viewport{min-height:340px}.anatomy-label{font-size:10px;padding:4px 6px}.anatomy-hint{font-size:9px;bottom:10px}.anatomy-model-note{font-size:8px;top:10px}}`;
    document.head.append(style);
  }
  _buildEnvironment(){
    const platform=new THREE.Mesh(new THREE.CylinderGeometry(2.3,2.36,.11,80),material(0x102e40,{roughness:.8,metalness:.15}));
    platform.position.set(0,-2.4,-.05);platform.receiveShadow=true;this.scene.add(platform);
    const ring=new THREE.Mesh(new THREE.TorusGeometry(2.15,.012,8,100),material(0x459baf,{emissive:0x164857,emissiveIntensity:.7}));
    ring.rotation.x=-Math.PI/2;ring.position.y=-2.334;this.scene.add(ring);
    const grid=new THREE.GridHelper(4.25,16,0x255367,0x183b4b);grid.position.y=-2.339;grid.material.transparent=true;grid.material.opacity=.45;this.scene.add(grid);
  }
  _mark(mesh,id){mesh.userData.structure=id;mesh.castShadow=true;this.selectables.push(mesh);return mesh;}
  _label(id,text,point){
    const el=document.createElement('button');el.className='anatomy-label';el.type='button';el.textContent=text;
    el.setAttribute('aria-label','Explorar: '+text);el.setAttribute('aria-pressed','false');
    el.addEventListener('click',()=>this._select(id));this.root.append(el);
    this.labels.push({id,el,point:new THREE.Vector3(...point)});
  }
  _select(id){
    if(!INFO[id])return;
    for(const label of this.labels)label.el.setAttribute('aria-pressed',String(label.id===id));
    this.onSelect({id,...INFO[id]});
  }
  _buildModel(){
    const bone=material(0xd5d4b5,{roughness:.65});
    const boneDark=material(0x8d9d91,{roughness:.7});
    const shell=material(0x8fc8d8,{transparent:true,opacity:.095,depthWrite:false,side:THREE.DoubleSide,roughness:.23});
    this.shellMaterial=shell;this.surfaceGroup=new THREE.Group();this.anatomy.add(this.surfaceGroup);
    // Smooth abdominal envelope with thigh contours; the anatomy view intentionally cuts away the surface.
    const torsoGeometry=this._torsoGeometry();
    const torso=new THREE.Mesh(torsoGeometry,shell);this.surfaceGroup.add(torso);
    const edges=new THREE.LineSegments(new THREE.EdgesGeometry(torsoGeometry,28),new THREE.LineBasicMaterial({color:0x6bacc4,transparent:true,opacity:.19}));
    this.surfaceGroup.add(edges);
    for(const sign of [-1,1]){
      add(this.surfaceGroup,ellipsoid(sign*.71,-1.3,-.04,.53,1.15,.48,shell));
      const femur=add(this.anatomy,tube([[sign*.86,-.52,-.05],[sign*.84,-.91,-.07],[sign*.68,-1.61,-.12],[sign*.62,-2.17,-.12]],.13,bone,32));
      this._mark(femur,'pelvis');
      add(this.anatomy,ellipsoid(sign*.86,-.48,-.07,.21,.22,.20,bone));
      const wing=add(this.anatomy,this._ilium(sign,bone));this._mark(wing,'pelvis');
      const brim=add(this.anatomy,tube([[sign*.1,-.55,.36],[sign*.55,-.67,.3],[sign*.93,-.35,.04],[sign*1.08,.21,-.12],[sign*.88,.83,-.18],[sign*.55,1.02,-.2],[sign*.3,.76,-.25]],.105,bone));this._mark(brim,'pelvis');
      const pubic=add(this.anatomy,tube([[sign*.04,-.7,.45],[sign*.24,-1.0,.30],[sign*.59,-1.02,.02],[sign*.79,-.64,-.08]],.087,bone));this._mark(pubic,'pelvis');
      const crest=add(this.anatomy,tube([[sign*.28,.77,-.23],[sign*.55,1.08,-.19],[sign*.99,1.02,-.14],[sign*1.18,.65,-.1]],.055,boneDark));
      crest.castShadow=true;
    }
    // Sacrum and lower lumbar vertebrae provide depth behind the urinary tract.
    for(let i=0;i<5;i++){
      add(this.anatomy,ellipsoid(0,.32-i*.15,-.39,.29-i*.027,.10,.13,bone));
      const vertebra=add(this.anatomy,ellipsoid(0,1.05+i*.19,-.4,.20,.085,.16,bone));
      add(this.anatomy,ellipsoid(0,1.05+i*.19,-.59,.08,.06,.12,boneDark));
      vertebra.castShadow=true;
    }
    this.bladderGroup=new THREE.Group();this.bladderGroup.position.set(0,.48,.10);this.anatomy.add(this.bladderGroup);
    const bladderMat=material(0xcc6b63,{roughness:.43,transparent:true,opacity:.40,depthWrite:false,side:THREE.DoubleSide});
    this.bladderMesh=add(this.bladderGroup,ellipsoid(0,0,0,.61,.64,.49,bladderMat));this._mark(this.bladderMesh,'bladder');
    const bladderInner=material(0xe8aa85,{transparent:true,opacity:.06,depthWrite:false,roughness:.4});
    add(this.bladderGroup,ellipsoid(0,-.04,0,.56,.57,.43,bladderInner));
    // Fine bladder-wall rugae, illustratively rendered as shallow curved lines.
    const foldsMat=material(0xf1b7a6,{transparent:true,opacity:.32,roughness:.6});
    for(let i=0;i<9;i++){
      const x=(i-4)*.105, pts=[];
      for(let j=0;j<=16;j++){
        const a=-1.1+j/16*2.2;
        const spread=Math.sqrt(Math.max(.1,1-x*x/.36));
        pts.push([x+Math.sin(j*.8+i)*.014,Math.sin(a)*.56*spread,.43*Math.cos(a)*spread]);
      }
      add(this.bladderGroup,tube(pts,.0055,foldsMat,24));
    }
    const ureterMat=material(0xd49d86,{roughness:.53});
    for(const sign of [-1,1]){
      const ureter=add(this.anatomy,tube([[sign*.39,.50,-.15],[sign*.55,.86,-.24],[sign*.69,1.20,-.26],[sign*.67,1.75,-.29],[sign*.73,2.03,-.29]],.042,ureterMat));ureter.castShadow=true;
      const kidney=add(this.anatomy,ellipsoid(sign*.81,1.89,-.3,.20,.32,.15,material(0x9e5b61,{transparent:true,opacity:.5})));kidney.rotation.z=sign*.25;
    }
    this.sexGroup=new THREE.Group();this.anatomy.add(this.sexGroup);
    this.uterusMat=material(0x956b9c,{roughness:.5,transparent:true,opacity:.56,depthWrite:false});
    this.vesicleMat=material(0xa6798e,{transparent:true,opacity:.46,depthWrite:false});
    this.urethraOutlineMat=new THREE.MeshBasicMaterial({color:0xf3c8b7,wireframe:true,transparent:true,opacity:.045,depthWrite:false});
    this.prostateMat=material(0xae8aab,{roughness:.55,transparent:true,opacity:.70,depthWrite:false});
    this.urethraMat=material(0xdd8b7e,{roughness:.5,transparent:true,opacity:.57,depthWrite:false,side:THREE.DoubleSide});
    this.catheterMat=material(0xffd17f,{roughness:.32,emissive:0x8a4108,emissiveIntensity:.16});
    this.balloonMat=material(0xf5dc9e,{transparent:true,opacity:.75,depthWrite:false,roughness:.18});
    this.balloonMesh=add(this.anatomy,ellipsoid(0,0,0,.18,.16,.16,this.balloonMat));this.balloonMesh.visible=false;this._mark(this.balloonMesh,'catheter');
    this.catheterTip=add(this.anatomy,ellipsoid(0,0,0,.045,.065,.045,this.catheterMat));this._mark(this.catheterTip,'catheter');
    this.injuryMarker=add(this.anatomy,ellipsoid(0,0,0,.13,.18,.13,material(0xfb615c,{transparent:true,opacity:.40,emissive:0xb92d29,emissiveIntensity:.8,depthWrite:false})));this.injuryMarker.visible=false;
    this._buildBag();this._buildSex();
    this._label('bladder','Vejiga',[.59,.76,.4]);
    this._label('urethra','Uretra',[-.45,-.41,.34]);
    this._label('catheter','Sonda',[.36,-1.35,.85]);
    this._label('bag','Colector',[1.72,-1.38,.13]);
    this._label('pelvis','Pelvis ósea',[-1.04,.74,.13]);
  }
  _torsoGeometry(){
    const rings=[[-.85,.94,.43],[-.55,1.12,.50],[-.1,1.18,.57],[.5,1.12,.58],[1.05,.99,.5],[1.6,1.02,.47],[2.16,1.12,.49]], vertices=[],indices=[],segments=64;
    for(const [y,rx,rz] of rings)for(let i=0;i<=segments;i++){const t=i/segments*Math.PI*2;vertices.push(Math.cos(t)*rx,y,Math.sin(t)*rz-.06);}
    for(let r=0;r<rings.length-1;r++)for(let i=0;i<segments;i++){const a=r*(segments+1)+i,b=a+segments+1;indices.push(a,b,a+1,a+1,b,b+1);}
    const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));geometry.setIndex(indices);geometry.computeVertexNormals();return geometry;
  }
  _ilium(sign,mat){
    const shape=new THREE.Shape();shape.moveTo(.18,.49);shape.bezierCurveTo(.28,1.08,.68,1.22,1.10,.92);shape.bezierCurveTo(1.35,.60,1.18,.13,.89,-.30);shape.bezierCurveTo(.72,-.52,.50,-.39,.55,-.17);shape.bezierCurveTo(.60,.13,.32,.19,.18,.49);
    const geometry=new THREE.ExtrudeGeometry(shape,{depth:.10,bevelEnabled:true,bevelSegments:3,steps:1,bevelSize:.035,bevelThickness:.03,curveSegments:30});
    geometry.scale(sign,1,1);geometry.translate(0,0,-.26);geometry.computeVertexNormals();
    return new THREE.Mesh(geometry,mat);
  }
  _buildSex(){
    // Dispose only sex-specific structures when changing case; the renderer and static model are retained.
    const previous=[];this.sexGroup.traverse(o=>{if(o.isMesh)previous.push(o);});
    this.selectables=this.selectables.filter(o=>!previous.includes(o));
    for(const o of previous)o.geometry.dispose();this.sexGroup.clear();
    if(this.sex==='female'){
      this.vaginalPath=new THREE.CatmullRomCurve3([[0,-.70,.17],[0,-.49,-.04],[0,-.20,-.17],[0,.18,-.25]].map(p=>new THREE.Vector3(...p)));
      this.path=new THREE.CatmullRomCurve3([[0,-.64,.53],[0,-.42,.32],[0,-.14,.15],[0,.13,.1],[0,.43,.1]].map(p=>new THREE.Vector3(...p)));
      const uterusMat=this.uterusMat;
      const uterus=add(this.sexGroup,ellipsoid(0,.52,-.26,.29,.34,.19,uterusMat));this._mark(uterus,'uterus');
      const cervix=add(this.sexGroup,tube([[0,.26,-.25],[0,-.16,-.18],[0,-.64,.13]],.105,uterusMat));this._mark(cervix,'uterus');
      for(const sign of [-1,1]){add(this.sexGroup,tube([[0,.62,-.27],[sign*.24,.80,-.25],[sign*.43,.72,-.26]],.026,uterusMat));add(this.sexGroup,ellipsoid(sign*.45,.65,-.23,.08,.11,.07,uterusMat));}
    }else{
      this.vaginalPath=null;
      this.path=new THREE.CatmullRomCurve3([[0,-1.35,.94],[0,-1.10,.58],[0,-.98,.16],[0,-.70,.02],[0,-.32,.04],[0,.08,.10],[0,.44,.10]].map(p=>new THREE.Vector3(...p)));
      const prostate=add(this.sexGroup,ellipsoid(0,-.22,.06,.27,.23,.23,this.prostateMat));this._mark(prostate,'prostate');
      for(const sign of [-1,1]){const sv=add(this.sexGroup,ellipsoid(sign*.25,.12,-.25,.11,.24,.10,this.vesicleMat));sv.rotation.z=sign*-.4;}
    }
    const urethra=add(this.sexGroup,tube(this.path,.083,this.urethraMat,90));this._mark(urethra,'urethra');
    // The outer section is a functional schematic rather than an exposed anatomical surface.
    const outline=add(this.sexGroup,tube(this.path,.089,this.urethraOutlineMat,64));
    outline.userData.structure='urethra';
    if(this.catheter){this.anatomy.remove(this.catheter);this.selectables=this.selectables.filter(o=>o!==this.catheter);this.catheter.geometry.dispose();}
    this.activePlacement='urethral';
    this.catheter=add(this.anatomy,tube(this.path,.036,this.catheterMat,160));this._mark(this.catheter,'catheter');
    this.insertion=-1;this._updateCatheter();
    const entry=(this.activePlacement==='vaginal'?this.vaginalPath:this.path).getPointAt(0);
    if(this.externalTube){this.anatomy.remove(this.externalTube);this.selectables=this.selectables.filter(o=>o!==this.externalTube);this.externalTube.geometry.dispose();}
    this.externalTube=add(this.anatomy,tube([[entry.x,entry.y,entry.z],[.40,entry.y-.25,entry.z+.06],[1.03,-1.46,.46],[1.65,-1.15,.17]],.025,this.catheterMat,54));this._mark(this.externalTube,'catheter');
  }
  _buildBag(){
    this.bagGroup=new THREE.Group();this.bagGroup.position.set(1.73,-1.66,.05);this.anatomy.add(this.bagGroup);
    const bagMat=material(0xc8e7e7,{transparent:true,opacity:.20,roughness:.27,depthWrite:false});
    const bag=new THREE.Mesh(new THREE.BoxGeometry(.58,.90,.12),bagMat);this.bagGroup.add(bag);this._mark(bag,'bag');
    const bagEdges=new THREE.LineSegments(new THREE.EdgesGeometry(bag.geometry),new THREE.LineBasicMaterial({color:0x8fc0ca,transparent:true,opacity:.7}));this.bagGroup.add(bagEdges);
    this.bagFluid=new THREE.Mesh(new THREE.BoxGeometry(.51,1,.075),material(0xe8bd55,{transparent:true,opacity:.7,roughness:.35}));this.bagGroup.add(this.bagFluid);
    const seamMat=material(0x759baa,{roughness:.6});
    add(this.bagGroup,tube([[-.15,.45,0],[-.13,.59,0],[.13,.59,0],[.15,.45,0]],.017,seamMat,24));
    for(let i=0;i<7;i++){const tick=new THREE.Mesh(new THREE.BoxGeometry(i%2?.045:.080,.009,.01),material(0xc0d9db));tick.position.set(.17,-.31+i*.1,.067);this.bagGroup.add(tick);}
    const valve=add(this.bagGroup,new THREE.Mesh(new THREE.CylinderGeometry(.035,.035,.18,12),seamMat));valve.position.y=-.52;
  }
  _updateCatheter(){
    if(!this.path)return;
    const placement=this.sex==='female'&&this.data.placement==='vaginal'?'vaginal':'urethral';
    const activePath=placement==='vaginal'?this.vaginalPath:this.path;
    if(placement!==this.activePlacement){
      this.catheter.geometry.dispose();this.catheter.geometry=new THREE.TubeGeometry(activePath,160,.036,12,false);
      this.insertion=-1;this.activePlacement=placement;
      if(this.externalTube){
        const entry=activePath.getPointAt(0);this.externalTube.geometry.dispose();
        this.externalTube.geometry=new THREE.TubeGeometry(new THREE.CatmullRomCurve3([entry,new THREE.Vector3(.40,entry.y-.25,entry.z+.06),new THREE.Vector3(1.03,-1.46,.46),new THREE.Vector3(1.65,-1.15,.17)]),54,.025,12,false);
      }
    }
    if(this.placementNote)this.placementNote.hidden=placement!=='vaginal';
    const fraction=THREE.MathUtils.clamp(Number(this.data.insertion)||0,0,100)/100;
    if(this.insertion!==fraction){
      // Retain GPU geometry: reveal only the inserted portion instead of rebuilding each frame.
      const segments=Math.floor(fraction*160);
      this.catheter.geometry.setDrawRange(0,segments*12*6);
      this.catheter.visible=segments>0;
      this.insertion=fraction;
    }
    const point=activePath.getPointAt(fraction);this.catheterTip.position.copy(point);this.catheterTip.visible=fraction>.002;
    const tangent=activePath.getTangentAt(fraction);this.catheterTip.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),tangent);
    this.balloonMesh.position.copy(activePath.getPointAt(Math.max(0,fraction-.055)));this.balloonMesh.visible=Boolean(this.data.balloon);
    this.injuryMarker.position.copy(point);this.injuryMarker.visible=Boolean(this.data.injury);
  }
  update(view={}){
    this.data={...this.data,...view};if(!this.available)return;
    const requestedSex=view.sex ?? (view.scenario ? (view.scenario==='female'?'female':'male') : this.sex);
    const sex=requestedSex==='female'?'female':'male';this.data.sex=sex;
    const visualSignature=[sex,this.data.insertion,!!this.data.balloon,Math.round(Number(this.data.drainage)||0),!!this.data.injury,this.data.stage,this.data.placement,!!this.data.paused].join('|');
    if(visualSignature===this.visualSignature)return;
    this.visualSignature=visualSignature;this._needsRender=true;
    if(sex!==this.sex){this.sex=sex;this._buildSex();}
    this._updateCatheter();
    const shadowSignature=[this.sex,this.data.insertion,!!this.data.balloon,Math.floor((Number(this.data.drainage)||0)/100)].join('-');
    if(shadowSignature!==this.shadowSignature){this.renderer.shadowMap.needsUpdate=true;this.shadowSignature=shadowSignature;}
    const amount=THREE.MathUtils.clamp(Number(this.data.drainage)||0,0,1000)/1000;
    this.bagFluid.scale.y=Math.max(.018,amount*.76);this.bagFluid.position.y=-.39+this.bagFluid.scale.y/2;
    const shrink=1-Math.min(.30,amount*.30);this.bladderGroup.scale.set(shrink,shrink,shrink);
    this.bagGroup.visible=true;
    if(this.externalTube)this.externalTube.visible=this.data.stage>=6||Number(this.data.insertion)>0;
    if(this.bladderMesh)this.bladderMesh.material.emissive.setHex(this.data.injury?0x380b08:0x000000);
  }
  setLayer(layer){
    this.layer=layer==='surface'?'surface':'anatomy';
    if(!this.available)return;
    this._needsRender=true;
    this.shellMaterial.opacity=this.layer==='surface'?.72:.095;
    this.shellMaterial.color.setHex(this.layer==='surface'?0x9fc9ce:0x8fc8d8);
    this.bladderMesh.material.opacity=this.layer==='surface'?.24:.40;
    for(const label of this.labels)label.el.style.opacity=this.layer==='surface'&&['bladder','urethra'].includes(label.id)?'.65':'1';
  }
  setView(view='oblique'){
    if(!this.available)return;
    this._needsRender=true;
    if(view==='front'){this.camera.position.set(.1,.65,9);this.controls.target.set(.15,-.05,.05);}
    else if(view==='detail'){this.camera.position.set(1.7,.45,4.5);this.controls.target.set(0,-.05,.15);}
    else{this.camera.position.set(3.1,1.6,8.4);this.controls.target.set(.15,0,0);}
    this.controls.update();
  }
  resetView(){this.setView('oblique');}
  _resize(){
    if(!this.available)return;
    this._needsRender=true;
    const width=Math.max(1,this.container.clientWidth),height=Math.max(340,this.container.clientHeight);
    this.renderer.setSize(width,height);this.camera.aspect=width/height;this.camera.updateProjectionMatrix();
  }
  _updateLabels(){
    const width=this.renderer.domElement.clientWidth,height=this.renderer.domElement.clientHeight;
    const point=new THREE.Vector3();
    for(const label of this.labels){
      point.copy(label.point).project(this.camera);
      const x=(point.x*.5+.5)*width,y=(-point.y*.5+.5)*height;
      label.el.style.left=Math.max(50,Math.min(width-50,x))+'px';label.el.style.top=Math.max(45,Math.min(height-40,y))+'px';
      label.el.hidden=point.z>1;
    }
  }
  dispose(){
    this.disposed=true;cancelAnimationFrame(this.animationId);this.resizeObserver?.disconnect();this.intersectionObserver?.disconnect();
    this._motionQuery?.removeEventListener?.('change',this._onMotionChange);
    this.controls?.removeEventListener('change',this._onControlsChange);this.controls?.dispose();
    this.renderer?.domElement.removeEventListener('pointerdown',this._pointerStart);
    this.renderer?.domElement.removeEventListener('pointerup',this._pointerEnd);
    this.scene?.traverse(object=>{object.geometry?.dispose();if(object.material){const materials=Array.isArray(object.material)?object.material:[object.material];for(const m of materials)m.dispose();}});
    this.renderer?.dispose();this.root.remove();
  }
}
