/**
 * DataVault.js — Holographic DNA Vault 3D Engine (Sky Blue Edition)
 */
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const C = {
  sky:    0x87CEEB,
  ice:    0x4fc3f7,
  pale:   0xb3e5fc,
  deep:   0x0288d1,
  navy:   0x01579b,
  white:  0xffffff,
};

const lerp   = THREE.MathUtils.lerp;
const rand   = (lo,hi) => lo + Math.random()*(hi-lo);
const randEl = arr => arr[Math.floor(Math.random()*arr.length)];
const BASES  = ['A','T','G','C'];
const BASE_COL = { A:C.sky, T:C.ice, G:C.pale, C:C.deep };

// ── Shaders ──────────────────────────────────────────────────
const strandVert = `
  attribute float alpha;
  varying float vAlpha;
  varying vec3  vPos;
  void main(){
    vAlpha=alpha; vPos=position;
    gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);
  }`;

const strandFrag = `
  varying float vAlpha; varying vec3 vPos;
  uniform vec3 uColor; uniform float uTime; uniform float uPulse;
  void main(){
    float t=sin(vPos.y*4.0+uTime*2.0)*0.5+0.5;
    vec3 c=mix(uColor,vec3(1.0),t*0.3);
    float a=vAlpha*(0.6+0.4*sin(uTime*1.5+vPos.y*3.0))*uPulse;
    gl_FragColor=vec4(c,a);
  }`;

const ptVert = `
  attribute float size; attribute float alpha;
  varying float vAlpha; uniform float uTime;
  void main(){
    vAlpha=alpha;
    vec4 mv=modelViewMatrix*vec4(position,1.0);
    gl_PointSize=size*(300.0/-mv.z);
    gl_Position=projectionMatrix*mv;
  }`;

const ptFrag = `
  varying float vAlpha; uniform vec3 uColor; uniform float uTime;
  void main(){
    float d=length(gl_PointCoord-0.5)*2.0;
    if(d>1.0)discard;
    float a=(1.0-d)*vAlpha*(0.5+0.5*sin(uTime*2.0));
    gl_FragColor=vec4(uColor,a);
  }`;

export class DataVault {
  constructor(canvas){
    this.canvas=canvas; this.clock=new THREE.Clock();
    this.time=0; this.strands=[]; this.uniforms=[]; this._disposed=false;
    this._initRenderer(); this._initScene(); this._initCamera();
    this._initControls(); this._initLights(); this._build(); this._loop();
  }

  _initRenderer(){
    this.renderer=new THREE.WebGLRenderer({canvas:this.canvas,antialias:true,alpha:false});
    this.renderer.setPixelRatio(Math.min(devicePixelRatio,2));
    this.renderer.setSize(innerWidth,innerHeight);
    this.renderer.setClearColor(0x000408,1);
    this.renderer.toneMapping=THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure=1.15;
    window.addEventListener('resize',()=>this._onResize());
  }

  _initScene(){
    this.scene=new THREE.Scene();
    this.scene.fog=new THREE.FogExp2(0x000408,0.055);
  }

  _initCamera(){
    this.camera=new THREE.PerspectiveCamera(55,innerWidth/innerHeight,0.1,200);
    this.camera.position.set(0,0.5,6);
  }

  _initControls(){
    this.controls=new OrbitControls(this.camera,this.canvas);
    this.controls.enableDamping=true; this.controls.dampingFactor=0.06;
    this.controls.autoRotate=true; this.controls.autoRotateSpeed=0.4;
    this.controls.minDistance=3; this.controls.maxDistance=14;
    this.controls.maxPolarAngle=Math.PI*0.72; this.controls.minPolarAngle=Math.PI*0.18;
    this.controls.target.set(0,0.3,0); this.controls.update();
  }

  _initLights(){
    this.scene.add(new THREE.AmbientLight(0x000d1a,2));
    this.scene.add(new THREE.HemisphereLight(0x001428,0x000000,0.8));
    [[0,3.5,0,C.sky,2.0],[0,-3.5,0,C.deep,1.4],[3,0,1,C.pale,0.8],[-3,0,1,C.navy,0.7]].forEach(([x,y,z,col,i])=>{
      const l=new THREE.PointLight(col,i,12,2); l.position.set(x,y,z); this.scene.add(l);
    });
  }

  _build(){
    this._buildShell(); this._buildStrands(); this._buildColumns();
    this._buildRings(); this._buildParticles(); this._buildPlanes(); this._buildCore();
  }

  _buildShell(){
    const mkShell=(geo,col,op)=>{
      const m=new THREE.LineBasicMaterial({color:col,transparent:true,opacity:op});
      return new THREE.LineSegments(new THREE.EdgesGeometry(geo),m);
    };
    this._shell1=mkShell(new THREE.IcosahedronGeometry(3.8,1),C.sky,0.13);
    this._shell2=mkShell(new THREE.OctahedronGeometry(4.2,2),C.ice,0.07);
    this.scene.add(this._shell1,this._shell2);
  }

  _buildStrands(){
    const N=30, PTS=120, H=5.5;
    for(let s=0;s<N;s++){
      const a0=(s/N)*Math.PI*2, r=rand(1.1,3.2), ph=Math.random()*Math.PI*2;
      const col=randEl([C.sky,C.ice,C.pale,C.deep]);
      const uTime={value:0}, uPulse={value:1};
      this.uniforms.push({uTime,uPulse});

      const posA=[],posB=[],rPos=[],aA=[],aB=[],aR=[];
      for(let i=0;i<PTS;i++){
        const t=i/(PTS-1), y=lerp(-H/2,H/2,t);
        const tw=t*Math.PI*5+ph+a0;
        const ox=Math.cos(a0)*r, oz=Math.sin(a0)*r;
        const xA=Math.cos(tw)*0.22, zA=Math.sin(tw)*0.22;
        const xB=Math.cos(tw+Math.PI)*0.22, zB=Math.sin(tw+Math.PI)*0.22;
        const fa=0.5+0.5*Math.sin(t*Math.PI);
        posA.push(ox+xA,y,oz+zA); posB.push(ox+xB,y,oz+zB);
        aA.push(fa); aB.push(fa);
        if(i%4===0){ rPos.push(ox+xA,y,oz+zA,ox+xB,y,oz+zB); aR.push(0.35,0.35); }
      }

      const mkLine=(pos,alp,c)=>{
        const g=new THREE.BufferGeometry();
        g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));
        g.setAttribute('alpha',new THREE.Float32BufferAttribute(alp,1));
        const m=new THREE.ShaderMaterial({
          vertexShader:strandVert,fragmentShader:strandFrag,
          uniforms:{uColor:{value:new THREE.Color(c)},uTime,uPulse},
          transparent:true,depthWrite:false,blending:THREE.AdditiveBlending
        });
        return new THREE.Line(g,m);
      };

      const lA=mkLine(posA,aA,col), lB=mkLine(posB,aB,col);
      this.scene.add(lA,lB); this.strands.push(lA,lB);

      if(rPos.length>=6){
        const rg=new THREE.BufferGeometry();
        rg.setAttribute('position',new THREE.Float32BufferAttribute(rPos,3));
        rg.setAttribute('alpha',new THREE.Float32BufferAttribute(aR,1));
        const rm=new THREE.ShaderMaterial({
          vertexShader:strandVert,fragmentShader:strandFrag,
          uniforms:{uColor:{value:new THREE.Color(0xd0eeff)},uTime,uPulse},
          transparent:true,depthWrite:false,blending:THREE.AdditiveBlending
        });
        const rl=new THREE.LineSegments(rg,rm);
        this.scene.add(rl); this.strands.push(rl);
      }
    }
  }

  _buildColumns(){
    for(let i=0;i<8;i++){
      const a=(i/8)*Math.PI*2, r=3.4;
      const x=Math.cos(a)*r, z=Math.sin(a)*r;
      const pts=[]; for(let j=0;j<=48;j++) pts.push(new THREE.Vector3(x,lerp(-3,3,j/48),z));
      const geo=new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),48,0.012,4,false);
      const mat=new THREE.MeshBasicMaterial({color:i%2?C.sky:C.deep,transparent:true,opacity:0.5});
      this.scene.add(new THREE.Mesh(geo,mat));
    }
  }

  _buildRings(){
    this._rings=[];
    [[3.7,0,0.018,C.sky,0.55],[2.8,1.4,0.01,C.ice,0.4],[2.8,-1.4,0.01,C.pale,0.4],[4.15,0,0.008,C.deep,0.22]].forEach(([r,y,th,col,op])=>{
      const m=new THREE.Mesh(new THREE.TorusGeometry(r,th,4,96),new THREE.MeshBasicMaterial({color:col,transparent:true,opacity:op}));
      m.position.y=y; this.scene.add(m); this._rings.push(m);
    });
  }

  _buildParticles(){
    const N=3000,pos=new Float32Array(N*3),sz=new Float32Array(N),al=new Float32Array(N);
    for(let i=0;i<N;i++){
      const th=Math.random()*Math.PI*2, ph=Math.acos(2*Math.random()-1), r=rand(1.5,4.5);
      pos[i*3]=r*Math.sin(ph)*Math.cos(th); pos[i*3+1]=r*Math.sin(ph)*Math.sin(th); pos[i*3+2]=r*Math.cos(ph);
      sz[i]=rand(1.5,4.5); al[i]=rand(0.1,0.7);
    }
    const g=new THREE.BufferGeometry();
    g.setAttribute('position',new THREE.BufferAttribute(pos,3));
    g.setAttribute('size',new THREE.BufferAttribute(sz,1));
    g.setAttribute('alpha',new THREE.BufferAttribute(al,1));
    const uTime={value:0}; this.uniforms.push({uTime});
    const m=new THREE.ShaderMaterial({
      vertexShader:ptVert,fragmentShader:ptFrag,
      uniforms:{uColor:{value:new THREE.Color(C.sky)},uTime},
      transparent:true,depthWrite:false,blending:THREE.AdditiveBlending
    });
    this.scene.add(new THREE.Points(g,m));
  }

  _buildPlanes(){
    const geo=new THREE.PlaneGeometry(2.2,3.8);
    [0,Math.PI/3,-Math.PI/3].forEach((ry,i)=>{
      const m=new THREE.MeshBasicMaterial({color:[C.sky,C.deep,C.pale][i],transparent:true,opacity:0.04,side:THREE.DoubleSide,depthWrite:false});
      const mesh=new THREE.Mesh(geo,m); mesh.rotation.y=ry; this.scene.add(mesh);
    });
  }

  _buildCore(){
    this._coreOrb=new THREE.Mesh(new THREE.SphereGeometry(0.28,32,32),new THREE.MeshBasicMaterial({color:C.sky,transparent:true,opacity:0.92}));
    this.scene.add(this._coreOrb);
    const corona=new THREE.Mesh(new THREE.SphereGeometry(0.55,24,24),new THREE.MeshBasicMaterial({color:C.ice,transparent:true,opacity:0.1,side:THREE.BackSide,depthWrite:false}));
    this.scene.add(corona); this._corona=corona;
    this._coreLight=new THREE.PointLight(C.sky,2.5,5,2);
    this.scene.add(this._coreLight);
  }

  _loop(){
    const tick=()=>{
      if(this._disposed)return;
      this._animFrame=requestAnimationFrame(tick);
      this.time+=this.clock.getDelta();
      this._animate(); this.controls.update();
      this.renderer.render(this.scene,this.camera);
    }; tick();
  }

  _animate(){
    const t=this.time;
    this.uniforms.forEach(u=>{
      if(u.uTime) u.uTime.value=t;
      if(u.uPulse) u.uPulse.value=0.7+0.3*Math.sin(t*1.8);
    });
    if(this._shell1) this._shell1.rotation.y=t*0.05;
    if(this._shell2) this._shell2.rotation.y=-t*0.035;
    if(this._rings) this._rings.forEach((r,i)=>{
      r.rotation.z=t*(0.12+i*0.05)*(i%2?-1:1);
      r.rotation.x=Math.sin(t*0.4+i)*0.12;
      const s=1+0.04*Math.sin(t*1.2+i); r.scale.setScalar(s);
    });
    if(this._coreOrb){
      const s=1+0.15*Math.sin(t*2.8); this._coreOrb.scale.setScalar(s);
      this._coreLight.intensity=2.5+1.2*Math.sin(t*2.8);
    }
    if(this._corona) this._corona.scale.setScalar(1+0.2*Math.sin(t*1.5));
  }

  _onResize(){
    this.camera.aspect=innerWidth/innerHeight; this.camera.updateProjectionMatrix();
    this.renderer.setSize(innerWidth,innerHeight);
  }

  getCameraState(){
    const s=new THREE.Spherical().setFromVector3(this.camera.position);
    return{theta:s.theta,phi:s.phi,r:s.radius};
  }

  getStrandCount(){ return this.strands.length; }

  dispose(){
    this._disposed=true;
    cancelAnimationFrame(this._animFrame);
    this.renderer.dispose();
  }
}
