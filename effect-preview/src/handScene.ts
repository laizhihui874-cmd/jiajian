import * as THREE from 'three'
import type {Nail} from '../shared/design'
import {createNailGeometry} from './nailGeometry'
import {createHandNailMaterial} from './handNailMaterial'
import {loadHandForm,seatHeight} from './handModel'
import type {HandForm,HandSide,NailSeat} from './handModel'

export type HandView='front'|'angle'
export const handSkinTones=[{name:'浅肤',color:'#e8bfa5'},{name:'自然',color:'#c99777'},{name:'深肤',color:'#80523e'}] as const

function disposeNail(group:THREE.Group){
 group.traverse(object=>{if(object instanceof THREE.Mesh){object.geometry.dispose();(Array.isArray(object.material)?object.material:[object.material]).forEach(m=>m.dispose())}})
 group.clear()
}

async function makeNail(nail:Nail,seat:NailSeat,finger:number){
 const material=await createHandNailMaterial(nail)
 const geometry=createNailGeometry(nail.shape,nail.variant)
 const position=geometry.getAttribute('position'),uv=geometry.getAttribute('uv')
 const length=seat.bed+({short:.001,medium:.006,long:.012}[nail.length])
 const width=seat.width,sx=width/1.54,sy=length/2.96
 const projection=new THREE.PerspectiveCamera(32,400/640,.1,100);projection.position.z=5.9;projection.updateMatrixWorld()
 const point=new THREE.Vector3()
 for(let i=0;i<position.count;i++){
  point.fromBufferAttribute(position,i)
  if(nail.artwork){const projected=point.clone().project(projection);uv.setXY(i,(projected.x+1)/2,(projected.y+1)/2)}
  const x=point.x*sx,y=(point.y+1.48)*sy
  const top=i<position.count/2
  position.setZ(i,(seatHeight(seat,x,y)+.00042-(top?0:.00027))/sx)
 }
 position.needsUpdate=true;uv.needsUpdate=true;geometry.computeVertexNormals();geometry.computeBoundingSphere()
 const mesh=new THREE.Mesh(geometry,material);mesh.castShadow=true;mesh.receiveShadow=true;mesh.userData.finger=finger
 const group=new THREE.Group();group.userData.finger=finger;group.add(mesh)
 group.position.copy(seat.root).addScaledVector(seat.forward,length/2)
 group.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(seat.right,seat.forward,seat.normal))
 group.scale.set(sx,sy,sx)

 // Ornaments occupy the same curved shell as the design and cast actual shadows.
 const ray=new THREE.Raycaster();mesh.updateMatrixWorld()
 const frameWidth=2*5.9*Math.tan(16*Math.PI/180)*(400/640)
 for(const decoration of nail.decorations){
  ray.setFromCamera(new THREE.Vector2(decoration.x/50-1,1-decoration.y/80),projection)
  const originalRay=ray.ray.clone()
  let hit=ray.intersectObject(mesh,false)[0]
  if(!hit)for(const fraction of [.4,.8,1]){
   for(let i=0;i<12&&!hit;i++){
    const a=i*Math.PI/6
    ray.setFromCamera(new THREE.Vector2((decoration.x+Math.cos(a)*decoration.size*fraction)/50-1,1-(decoration.y+Math.sin(a)*decoration.size*fraction)/80),projection)
    hit=ray.intersectObject(mesh,false)[0]
   }
   if(hit)break
  }
  if(!hit)continue
  const radius=decoration.size/100*frameWidth,pearl=decoration.type==='pearl'
  const ornament=new THREE.Mesh(pearl?new THREE.SphereGeometry(radius,20,14):new THREE.OctahedronGeometry(radius,0),new THREE.MeshPhysicalMaterial(pearl?{color:'#fff3df',roughness:.22,metalness:.06,clearcoat:1,iridescence:.25}:{color:'#e1efff',roughness:.075,metalness:.16,transmission:.35,thickness:.08,ior:2.1,clearcoat:1,flatShading:true}))
  const normal=hit.face?.normal.clone().normalize()||new THREE.Vector3(0,0,1)
  ornament.position.copy(originalRay.at((hit.point.z-originalRay.origin.z)/originalRay.direction.z,new THREE.Vector3())).addScaledVector(normal,radius*.34)
  ornament.quaternion.setFromUnitVectors(new THREE.Vector3(0,0,1),normal)
  ornament.scale.set(1,sx/sy,pearl?.7:.58)
  ornament.castShadow=true;ornament.receiveShadow=true;ornament.userData.finger=finger;group.add(ornament)
 }
 return group
}

export function createHandScene(host:HTMLElement,onSelect:(index:number)=>void,onStatus:(status:'loading'|'ready'|'error')=>void){
 const renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:'low-power'})
 renderer.setPixelRatio(Math.min(window.devicePixelRatio,1.6));renderer.setClearColor(0x000000,0)
 renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05
 renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap
 const canvas=renderer.domElement;host.appendChild(canvas);canvas.tabIndex=0;canvas.setAttribute('role','img');canvas.setAttribute('aria-label','三维上手预览；拖动或使用方向键转动，点击甲片选择手指，按 Home 归位')
 const scene=new THREE.Scene(),camera=new THREE.OrthographicCamera(-4,4,4,-4,.1,60)
 camera.position.set(0,0,18);camera.lookAt(0,0,0)
 const pivot=new THREE.Group(),handRoot=new THREE.Group();pivot.add(handRoot);scene.add(pivot)
 const skin=new THREE.MeshPhysicalMaterial({color:handSkinTones[1].color,roughness:.62,metalness:0,clearcoat:.04,clearcoatRoughness:.55,ior:1.4})
 skin.onBeforeCompile=shader=>{
  shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 skinPoint;').replace('#include <begin_vertex>','#include <begin_vertex>\nskinPoint=position;')
  shader.fragmentShader=shader.fragmentShader.replace('#include <common>',`#include <common>
   varying vec3 skinPoint;
   float skinNoise(vec3 p){return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453);}
  `).replace('#include <color_fragment>',`#include <color_fragment>
   float pores=skinNoise(floor(skinPoint*8500.0));
   diffuseColor.rgb*=0.988+pores*0.024;
  `)
 }
 scene.add(new THREE.HemisphereLight('#fff5e9','#b3a19a',2.1))
 const light=new THREE.DirectionalLight('#fff1df',3.2);light.position.set(-4,6,8);light.castShadow=true
 light.shadow.mapSize.set(2048,2048);light.shadow.camera.left=-5;light.shadow.camera.right=5;light.shadow.camera.top=6;light.shadow.camera.bottom=-5
 light.shadow.camera.near=.5;light.shadow.camera.far=30;light.shadow.bias=-.00015;light.shadow.normalBias=.012;light.shadow.radius=4;scene.add(light)
 const fill=new THREE.DirectionalLight('#e6edff',.75);fill.position.set(5,1,4);scene.add(fill)
 const rim=new THREE.DirectionalLight('#fff4e1',1.2);rim.position.set(2,5,-2);scene.add(rim)
 const floor=new THREE.Mesh(new THREE.PlaneGeometry(40,40),new THREE.ShadowMaterial({color:'#746054',opacity:.18}));floor.position.z=-1.7;floor.receiveShadow=true;scene.add(floor)
 const studio=new THREE.Scene(),roomGeometry=new THREE.SphereGeometry(30,24,16),roomMaterial=new THREE.MeshBasicMaterial({color:'#948b80',side:THREE.BackSide})
 studio.add(new THREE.Mesh(roomGeometry,roomMaterial))
 for(const [w,h,x,y,z,power] of [[2,5,-4,4,5,4],[1.5,4,5,1,3,1.8],[5,2,0,6,2,2]]){
  const panel=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({color:new THREE.Color(power,power*.96,power*.91),side:THREE.DoubleSide}))
  panel.position.set(x,y,z);panel.lookAt(0,0,0);studio.add(panel)
 }
 const pmrem=new THREE.PMREMGenerator(renderer),environment=pmrem.fromScene(studio,.04);scene.environment=environment.texture;pmrem.dispose()
 studio.traverse(object=>{if(object instanceof THREE.Mesh){object.geometry.dispose();(object.material as THREE.Material).dispose()}})
 let disposed=false,lost=false,frame=0,revision=0,side:HandSide='left',form:HandForm|undefined,body:THREE.Mesh|undefined
 let nails:THREE.Group[]=[],keys:string[]=[],selected=1,angleX=.07,angleY=-.12,span=7
 let pendingPointer:{id:number;x:number;y:number;ax:number;ay:number;moved:boolean}|undefined
 const ray=new THREE.Raycaster(),pointer=new THREE.Vector2()
 const marker=new THREE.Mesh(new THREE.SphereGeometry(.00115,16,12),new THREE.MeshBasicMaterial({color:'#98576d'}));marker.visible=false;handRoot.add(marker)

 function draw(){frame=0;if(disposed||lost||document.hidden)return;pivot.rotation.set(angleX,angleY,side==='left'?-.07:.07);renderer.render(scene,camera)}
 function invalidate(){if(!disposed&&!lost&&!frame&&!document.hidden)frame=requestAnimationFrame(draw)}
 function resize(){
  const {width,height}=host.getBoundingClientRect();if(!width||!height)return
  renderer.setSize(width,height,false)
  const aspect=width/height,heightSpan=Math.max(span,span*.75/aspect)
  camera.left=-heightSpan*aspect/2;camera.right=heightSpan*aspect/2;camera.top=heightSpan/2;camera.bottom=-heightSpan/2;camera.updateProjectionMatrix();invalidate()
 }
 function mark(){
  const local=selected-(side==='right'?5:0),seat=form?.seats[local]
  marker.visible=!!seat
  if(seat)marker.position.copy(seat.root).addScaledVector(seat.forward,-.004).addScaledVector(seat.normal,.001)
  invalidate()
 }
 function clearNails(){nails.forEach(n=>{handRoot.remove(n);disposeNail(n)});nails=[];keys=[]}
 function setView(view:HandView){angleX=view==='front'?0:.12;angleY=view==='front'?0:side==='left'?-.55:.55;invalidate()}
 async function update(next:Nail[],nextSide:HandSide){
  const version=++revision;onStatus('loading')
  const staged:{index:number;group:THREE.Group;key:string}[]=[]
  try{
   const loaded=await loadHandForm(nextSide)
   if(disposed||version!==revision)return
   if(!form||nextSide!==side){
    clearNails()
    if(body){handRoot.remove(body);body.geometry.dispose()}
    form=loaded;side=nextSide
    body=new THREE.Mesh(form.geometry.clone(),skin);body.castShadow=true;body.receiveShadow=true;handRoot.add(body)
    handRoot.quaternion.setFromRotationMatrix(form.orientation);handRoot.scale.setScalar(27);handRoot.position.set(0,0,0);handRoot.updateMatrix();handRoot.updateMatrixWorld(true)
    body.geometry.computeBoundingBox()
    const box=body.geometry.boundingBox!.clone().applyMatrix4(handRoot.matrix),center=box.getCenter(new THREE.Vector3()),size=box.getSize(new THREE.Vector3())
    handRoot.position.copy(center.negate());span=Math.max(6,size.y*1.23,size.x*1.38)
    angleX=.07;angleY=side==='left'?-.12:.12;resize()
   }
   for(let i=0;i<5;i++){
    const key=JSON.stringify(next[i]);if(keys[i]===key)continue
    const group=await makeNail(next[i],form.seats[i],i+(side==='right'?5:0))
    staged.push({index:i,group,key})
    if(disposed||version!==revision){staged.forEach(item=>disposeNail(item.group));return}
   }
   for(const item of staged){const old=nails[item.index];if(old){handRoot.remove(old);disposeNail(old)}nails[item.index]=item.group;keys[item.index]=item.key;handRoot.add(item.group)}
   mark();onStatus('ready');invalidate()
  }catch{
   staged.forEach(item=>disposeNail(item.group))
   if(!disposed&&version===revision)onStatus('error')
  }
 }
 function down(event:PointerEvent){if(event.button!==0||lost)return;pendingPointer={id:event.pointerId,x:event.clientX,y:event.clientY,ax:angleX,ay:angleY,moved:false};canvas.setPointerCapture(event.pointerId);canvas.focus({preventScroll:true})}
 function move(event:PointerEvent){
  const drag=pendingPointer;if(!drag||drag.id!==event.pointerId)return
  const dx=event.clientX-drag.x,dy=event.clientY-drag.y
  if(Math.hypot(dx,dy)>5)drag.moved=true
  if(drag.moved){angleX=THREE.MathUtils.clamp(drag.ax+dy*.006,-.5,.65);angleY=THREE.MathUtils.clamp(drag.ay+dx*.007,-1.05,1.05);invalidate()}
 }
 function up(event:PointerEvent){
  const drag=pendingPointer;pendingPointer=undefined
  if(!drag||drag.id!==event.pointerId)return
  if(canvas.hasPointerCapture(event.pointerId))canvas.releasePointerCapture(event.pointerId)
  if(drag.moved)return
  const bounds=canvas.getBoundingClientRect();pointer.set((event.clientX-bounds.left)/bounds.width*2-1,1-(event.clientY-bounds.top)/bounds.height*2)
  scene.updateMatrixWorld(true);camera.updateMatrixWorld();ray.setFromCamera(pointer,camera)
  const targets:THREE.Object3D[]=[...nails];if(body)targets.push(body)
  const hit=ray.intersectObjects(targets,true)[0]
  if(typeof hit?.object.userData.finger==='number')onSelect(hit.object.userData.finger)
 }
 function cancel(){pendingPointer=undefined}
 function keyboard(event:KeyboardEvent){
  if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home'].includes(event.key))return
  event.preventDefault()
  if(event.key==='Home')setView('front')
  else if(event.key==='ArrowLeft'||event.key==='ArrowRight')angleY=THREE.MathUtils.clamp(angleY+(event.key==='ArrowLeft'?-.12:.12),-1.05,1.05)
  else angleX=THREE.MathUtils.clamp(angleX+(event.key==='ArrowUp'?-.1:.1),-.5,.65)
  invalidate()
 }
 function contextLost(event:Event){event.preventDefault();lost=true;revision++;cancelAnimationFrame(frame);frame=0;onStatus('error')}
 function visibility(){if(document.hidden){cancelAnimationFrame(frame);frame=0}else invalidate()}
 canvas.addEventListener('pointerdown',down);canvas.addEventListener('pointermove',move);canvas.addEventListener('pointerup',up);canvas.addEventListener('pointercancel',cancel);canvas.addEventListener('keydown',keyboard);canvas.addEventListener('webglcontextlost',contextLost);document.addEventListener('visibilitychange',visibility)
 const observer=new ResizeObserver(resize);observer.observe(host);resize()
 return {
  update,
  select(index:number){selected=index;mark()},
  skin(color:string){skin.color.set(color);invalidate()},
  view:setView,
  dispose(){
   disposed=true;revision++;cancelAnimationFrame(frame);observer.disconnect();document.removeEventListener('visibilitychange',visibility)
   canvas.removeEventListener('pointerdown',down);canvas.removeEventListener('pointermove',move);canvas.removeEventListener('pointerup',up);canvas.removeEventListener('pointercancel',cancel);canvas.removeEventListener('keydown',keyboard);canvas.removeEventListener('webglcontextlost',contextLost)
   clearNails();body?.geometry.dispose();skin.dispose();marker.geometry.dispose();(marker.material as THREE.Material).dispose();floor.geometry.dispose();(floor.material as THREE.Material).dispose();environment.dispose();light.shadow.map?.dispose();renderer.dispose();renderer.forceContextLoss();canvas.remove()
  },
 }
}
