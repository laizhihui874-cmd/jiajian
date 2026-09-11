import * as THREE from 'three'
import {createNailGeometry} from './nailGeometry'

export type CatStudyStyle = 'side' | 'wide' | 'tracking'
export type CatStudyColor = 'teal' | 'rose' | 'champagne'
export type CatStudySettings = {style:CatStudyStyle;color:CatStudyColor;brightness:number;softness:number;grain:number;coat:boolean}
export const initialCatStudy:CatStudySettings = {style:'tracking',color:'teal',brightness:65,softness:50,grain:45,coat:true}

// Each preset describes a stationary distribution of flake normals in nail space.
// The lighting equation below is identical for all presets. No animated masks,
// moving UVs, emissive bands or time-dependent noise are used.
const arrangements:Record<CatStudyStyle,{slope:[number,number,number,number];bias:[number,number];bend:[number,number]}> = {
 side:{slope:[1.18,0,0,.07],bias:[.32,.15],bend:[.22,.025]},
 wide:{slope:[-.045,0,0,-.025],bias:[-.12,.15],bend:[-.10,-.045]},
 // Counter the longitudinal camera/light slope as well as the shell's
 // transverse curvature. The former Y gradient nearly cancelled the refracted
 // half-vector gradient, leaving the whole nail length bright like a stripe.
 // Similar residual gradients per world unit produce a round reflective focus.
 tracking:{slope:[-.22,.012,.008,-.55],bias:[-.12,.15],bend:[-.07,-.06]},
}
const pigments:Record<CatStudyColor,{base:string;flake:string}> = {
 teal:{base:'#063c39',flake:'#74f5c4'},
 rose:{base:'#49102d',flake:'#f4a2be'},
 champagne:{base:'#47331c',flake:'#f6d49a'},
}

const vertexShader = /* glsl */`
 varying vec3 vNailPosition;
 varying vec3 vWorldPosition;
 varying vec3 vWorldNormal;
 void main(){
  vNailPosition=position;
  vec4 world=modelMatrix*vec4(position,1.0);
  vWorldPosition=world.xyz;
  vWorldNormal=normalize(mat3(modelMatrix)*normal);
  gl_Position=projectionMatrix*viewMatrix*world;
 }
`
const fragmentShader = /* glsl */`
 varying vec3 vNailPosition;
 varying vec3 vWorldPosition;
 varying vec3 vWorldNormal;
 uniform mat3 worldToNail;
 uniform vec4 slope;
 uniform vec2 bias;
 uniform vec2 bend;
 uniform vec3 basePigment;
 uniform vec3 flakePigment;
 uniform float flakeAmount;
 uniform float dispersion;
 uniform float grainAmount;
 uniform float coat;
 uniform vec3 lampPosition;
 uniform vec3 lampRight;
 uniform vec3 lampUp;
 uniform vec3 lampNormal;
 const float PI=3.14159265359;

 float hash21(vec2 p){
  vec3 q=fract(vec3(p.xyx)*.1031);
  q+=dot(q,q.yzx+33.33);
  return fract((q.x+q.y)*q.z);
 }
 vec2 orientationAt(vec2 p){
  // A continuous, frozen orientation field. The curvature changes how quickly
  // flakes turn across the shell: a broad aligned center and steeper shoulders.
  vec2 q=p/vec2(.77,1.48);
  return vec2(slope.x*p.x+slope.y*p.y,slope.z*p.x+slope.w*p.y)+bias+bend*q*q*q;
 }
 float flakeDistribution(vec2 halfSlope,vec2 meanSlope,vec2 spread){
  vec2 d=(halfSlope-meanSlope)/spread;
  float hCos=inversesqrt(1.0+dot(halfSlope,halfSlope));
  // GGX slope distribution retains low-intensity reflection beyond the peak.
  // It avoids the isolated, Gaussian-looking pool produced by the first study.
  float tail=1.0+dot(d,d);
  return 1.0/(PI*spread.x*spread.y*tail*tail*pow(hCos,4.0));
 }
 float smithG1(float cosine,float roughness){
  float c=clamp(cosine,.001,1.0);
  float tan2=(1.0-c*c)/(c*c);
  return 2.0/(1.0+sqrt(1.0+roughness*roughness*tan2));
 }
 vec3 flakeReflection(vec3 N,vec3 V,vec3 lamp,vec3 internalView,vec2 p,float depth){
  vec3 toLight=lamp-vWorldPosition;
  float distance2=dot(toLight,toLight);
  vec3 L=normalize(toLight);
  float nl=max(dot(N,L),0.0),nv=max(dot(N,V),.035);
  if(nl<=0.0)return vec3(0.0);
  vec3 internalLight=-refract(-L,N,1.0/1.48);
  vec3 H=normalize(internalLight+internalView);
  vec3 localHalf=worldToNail*H;
  if(localHalf.z<=0.02)return vec3(0.0);
  vec2 hs=localHalf.xy/localHalf.z;
  vec2 meanSlope=orientationAt(p);
  vec2 cells=(p+vec2(depth*3.1,depth*1.7))*mix(300.0,140.0,grainAmount);
  vec2 cell=floor(cells);
  float a=hash21(cell),b=hash21(cell+vec2(83.1,17.7));
  vec2 jitter=vec2(a-.5,b-.5)*dispersion*mix(.70,2.05,grainAmount);
  vec2 spread=vec2(dispersion,dispersion*1.05);
  float continuous=flakeDistribution(hs,meanSlope,spread*1.06);
  float individual=flakeDistribution(hs,meanSlope+jitter,spread*mix(.91,.60,grainAmount));
  // Fine flakes add a quiet satin texture around the coherent focus rather
  // than high-contrast sand. Subpixel detail converges to the same distribution;
  // its position stays fixed while reflection responds to the viewing angle.
  float footprint=max(length(dFdx(cells)),length(dFdy(cells)));
  float resolved=1.0-smoothstep(.65,1.65,footprint);
  float D=mix(continuous,individual*(1.0+(a-.5)*grainAmount*.85),resolved*grainAmount*.96);
  float masking=smithG1(nl,.24)*smithG1(nv,.24);
  vec3 F=flakePigment+(vec3(1.0)-flakePigment)*pow(1.0-max(dot(internalView,H),0.0),5.0);
  float path=(1.0/max(dot(N,internalLight),.15)+1.0/max(dot(N,internalView),.15));
  vec3 absorption=exp(-(vec3(1.0)-sqrt(flakePigment))*(.18+depth*2.0)*path);
  return F*absorption*D*masking/(4.0*nv)*.92*(55.0/distance2)*flakeAmount;
 }
 float rectangularReflection(vec3 N,vec3 V){
  vec3 ray=reflect(-V,N);
  float denom=dot(ray,lampNormal);
  if(abs(denom)<.0001)return 0.0;
  float t=dot(lampPosition-vWorldPosition,lampNormal)/denom;
  if(t<=0.0)return 0.0;
  vec3 hit=vWorldPosition+ray*t-lampPosition;
  vec2 p=abs(vec2(dot(hit,lampRight),dot(hit,lampUp)));
  vec2 edge=vec2(.21,1.25);
  vec2 aa=max(fwidth(p)*1.5,vec2(.035));
  vec2 inside=vec2(1.0)-smoothstep(edge-aa,edge+aa,p);
  float fresnel=.04+.96*pow(1.0-max(dot(N,V),0.0),5.0);
  return inside.x*inside.y*fresnel*10.0;
 }
 void main(){
  vec3 N=normalize(vWorldNormal),V=normalize(cameraPosition-vWorldPosition);
  vec3 L=normalize(lampPosition-vWorldPosition);
  float nv=max(dot(N,V),0.0);
  vec3 body=basePigment*(.26+.65*max(dot(N,L),0.0));
  // View through the curved clear gel, with two depth samples of the same
  // material. Refraction and parallax separate internal sheen from the lamp
  // reflected on the outer surface; neither sample uses a painted light mask.
  vec3 internalView=-refract(-V,N,1.0/1.48);
  vec3 localView=worldToNail*internalView;
  vec2 raySlope=localView.xy/max(localView.z,.15);
  vec2 nearPoint=vNailPosition.xy-raySlope*.025;
  vec2 farPoint=vNailPosition.xy-raySlope*.10;
  vec3 sheen=vec3(0.0);
  sheen+=flakeReflection(N,V,lampPosition+lampRight*.12+lampUp*.72,internalView,nearPoint,.025);
  sheen+=flakeReflection(N,V,lampPosition-lampRight*.12+lampUp*.24,internalView,nearPoint,.025);
  sheen+=flakeReflection(N,V,lampPosition+lampRight*.12-lampUp*.24,internalView,nearPoint,.025);
  sheen+=flakeReflection(N,V,lampPosition-lampRight*.12-lampUp*.72,internalView,nearPoint,.025);
  vec3 deep=vec3(0.0);
  deep+=flakeReflection(N,V,lampPosition+lampRight*.12+lampUp*.72,internalView,farPoint,.10);
  deep+=flakeReflection(N,V,lampPosition-lampRight*.12+lampUp*.24,internalView,farPoint,.10);
  deep+=flakeReflection(N,V,lampPosition+lampRight*.12-lampUp*.24,internalView,farPoint,.10);
  deep+=flakeReflection(N,V,lampPosition-lampRight*.12-lampUp*.72,internalView,farPoint,.10);
  sheen=(sheen*.62+deep*.38)*.25;
  // Only the front shell carries magnetic pigment. The narrow rim and reverse
  // retain the gel color instead of wrapping a second floating highlight around.
  float front=smoothstep(.02,.18,(worldToNail*N).z);
  float coating=rectangularReflection(N,V)*coat;
  vec3 color=body+sheen*front+vec3(1.0,.98,.95)*coating;
  color+=basePigment*.14*pow(1.0-nv,3.0);
  // Compress luminance without washing the colored peak into a white disk.
  // The clear coat above remains white; the internal reflection keeps its tint.
  float peak=max(max(color.r,color.g),color.b);
  color*= (1.0-exp(-peak*1.15))/max(peak,.0001);
  gl_FragColor=vec4(color,1.0);
  #include <colorspace_fragment>
 }
`

export function createCatEyeStudy(host:HTMLElement,onPause:()=>void,onError:(message:string)=>void){
 const renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:'low-power'})
 renderer.setPixelRatio(Math.min(window.devicePixelRatio,1.75))
 renderer.setClearColor(0x000000,0)
 renderer.outputColorSpace=THREE.SRGBColorSpace
 renderer.toneMapping=THREE.NoToneMapping
  const canvas=renderer.domElement
 canvas.tabIndex=0;canvas.setAttribute('role','img')
 canvas.setAttribute('aria-label','猫眼甲片，拖动或使用方向键转动，Home 键回到正面')
 host.appendChild(canvas)
 const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(32,1,.1,100)
 camera.position.set(0,0,7.6)
 const lampPosition=new THREE.Vector3(-3,4,7)
 const lampNormal=lampPosition.clone().normalize().negate()
 const lampRight=new THREE.Vector3().crossVectors(new THREE.Vector3(0,1,0),lampNormal).normalize()
 const lampUp=new THREE.Vector3().crossVectors(lampNormal,lampRight).normalize()
 const uniforms={
  worldToNail:{value:new THREE.Matrix3()},slope:{value:new THREE.Vector4()},bias:{value:new THREE.Vector2()},bend:{value:new THREE.Vector2()},
  basePigment:{value:new THREE.Color()},flakePigment:{value:new THREE.Color()},
  flakeAmount:{value:.35},dispersion:{value:.10},grainAmount:{value:.45},coat:{value:1},
  lampPosition:{value:lampPosition},lampNormal:{value:lampNormal},lampRight:{value:lampRight},lampUp:{value:lampUp},
 }
 const material=new THREE.ShaderMaterial({uniforms,vertexShader,fragmentShader})
 const geometry=createNailGeometry('oval')
 const mesh=new THREE.Mesh(geometry,material)
 scene.add(mesh)
 let disposed=false,lost=false,frame=0,playing=false,phase=0,last=0,x=0,y=0
 let drag:{id:number;x:number;y:number;rx:number;ry:number}|null=null
 function draw(time:number){
  frame=0;if(disposed||lost||document.hidden)return
  if(playing){
   if(last)phase+=Math.min((time-last)/1000,.05)
   x=Math.sin(phase*.67)*.20;y=Math.sin(phase)*.48
  }
  last=time
  mesh.rotation.set(x,y,0);mesh.updateMatrixWorld(true)
  uniforms.worldToNail.value.setFromMatrix4(mesh.matrixWorld).transpose()
  renderer.render(scene,camera)
  if(playing)frame=requestAnimationFrame(draw)
 }
 function request(){if(!disposed&&!lost&&!frame&&!document.hidden)frame=requestAnimationFrame(draw)}
 function pause(){playing=false;last=0;onPause()}
 function orient(rx:number,ry:number){pause();x=THREE.MathUtils.clamp(rx,-.6,.6);y=THREE.MathUtils.clamp(ry,-.85,.85);request()}
 function down(event:PointerEvent){
  if(drag||event.button!==0)return
  pause();canvas.focus({preventScroll:true});canvas.setPointerCapture(event.pointerId)
  drag={id:event.pointerId,x:event.clientX,y:event.clientY,rx:x,ry:y}
 }
 function move(event:PointerEvent){
  if(!drag||event.pointerId!==drag.id)return
  const scale=3/Math.max(250,Math.min(canvas.clientWidth,canvas.clientHeight))
  x=THREE.MathUtils.clamp(drag.rx+(event.clientY-drag.y)*scale,-.6,.6)
  y=THREE.MathUtils.clamp(drag.ry+(event.clientX-drag.x)*scale,-.85,.85);request()
 }
 function up(event:PointerEvent){if(drag?.id===event.pointerId)drag=null}
 function key(event:KeyboardEvent){
  const keys=['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home']
  if(!keys.includes(event.key))return
  event.preventDefault()
  if(event.key==='Home')orient(0,0)
  else orient(x+(event.key==='ArrowDown'?.08:event.key==='ArrowUp'?-.08:0),y+(event.key==='ArrowRight'?.08:event.key==='ArrowLeft'?-.08:0))
 }
 function visibility(){last=0;if(document.hidden){cancelAnimationFrame(frame);frame=0}else request()}
 function contextLost(event:Event){event.preventDefault();lost=true;cancelAnimationFrame(frame);frame=0;pause();onError('立体画面暂时中断，请重新打开猫眼体验。')}
 function resize(){
  const width=host.clientWidth,height=host.clientHeight
  if(!width||!height)return
  renderer.setSize(width,height);camera.aspect=width/height
  camera.position.z=Math.max(7.2,4.2/camera.aspect);camera.updateProjectionMatrix();request()
 }
 canvas.addEventListener('pointerdown',down);canvas.addEventListener('pointermove',move)
 canvas.addEventListener('pointerup',up);canvas.addEventListener('pointercancel',up);canvas.addEventListener('lostpointercapture',up)
 canvas.addEventListener('keydown',key);canvas.addEventListener('webglcontextlost',contextLost)
 document.addEventListener('visibilitychange',visibility)
 const observer=new ResizeObserver(resize);observer.observe(host)
 function update(settings:CatStudySettings){
  const field=arrangements[settings.style],pigment=pigments[settings.color]
  uniforms.slope.value.fromArray(field.slope);uniforms.bias.value.fromArray(field.bias);uniforms.bend.value.fromArray(field.bend)
  uniforms.basePigment.value.set(pigment.base);uniforms.flakePigment.value.set(pigment.flake)
  uniforms.flakeAmount.value=settings.brightness/100*.60
  uniforms.dispersion.value=.055+settings.softness/100*.10
  uniforms.grainAmount.value=settings.grain/100;
  uniforms.coat.value=settings.coat?1:0;request()
 }
 renderer.debug.onShaderError=()=>{lost=true;pause();onError('这台设备暂时无法显示新的猫眼效果，请返回工作台。')}
 update(initialCatStudy);resize()
 return {
  update,
  orient,
  play(value:boolean){playing=value;last=0;if(value){phase=Math.asin(THREE.MathUtils.clamp(y/.48,-1,1))}request()},
  dispose(){
   disposed=true;cancelAnimationFrame(frame);observer.disconnect()
   canvas.removeEventListener('pointerdown',down);canvas.removeEventListener('pointermove',move)
   canvas.removeEventListener('pointerup',up);canvas.removeEventListener('pointercancel',up);canvas.removeEventListener('lostpointercapture',up)
   canvas.removeEventListener('keydown',key);canvas.removeEventListener('webglcontextlost',contextLost)
   document.removeEventListener('visibilitychange',visibility)
   geometry.dispose();material.dispose();renderer.dispose();canvas.remove()
  },
 }
}
