import * as THREE from 'three'
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js'
import {mergeVertices} from 'three/addons/utils/BufferGeometryUtils.js'

export type HandSide='left'|'right'
export type NailSeat={root:THREE.Vector3;forward:THREE.Vector3;normal:THREE.Vector3;right:THREE.Vector3;width:number;bed:number;heights:number[][]}
export type HandForm={geometry:THREE.BufferGeometry;seats:NailSeat[];orientation:THREE.Matrix4}
const fingerNames=['thumb','index-finger','middle-finger','ring-finger','pinky-finger']
const forms=new Map<HandSide,Promise<HandForm>>()

// One Loop subdivision pass smooths the lightweight source without replacing
// its connected palm, finger webs and knuckles with separate primitive shapes.
function smoothHand(source:THREE.BufferGeometry){
 const clean=source.clone()
 for(const name of Object.keys(clean.attributes))if(name!=='position')clean.deleteAttribute(name)
 const merged=mergeVertices(clean,1e-6);clean.dispose()
 const p=merged.getAttribute('position'),index=merged.getIndex()!
 const vertices=Array.from({length:p.count},(_,i)=>new THREE.Vector3().fromBufferAttribute(p,i))
 const neighbors=vertices.map(()=>new Set<number>())
 const edges=new Map<string,{a:number;b:number;opposite:number[];index:number}>()
 const key=(a:number,b:number)=>a<b?`${a}:${b}`:`${b}:${a}`
 for(let i=0;i<index.count;i+=3){
  const face=[index.getX(i),index.getX(i+1),index.getX(i+2)]
  for(let j=0;j<3;j++){
   const a=face[j],b=face[(j+1)%3],other=face[(j+2)%3],id=key(a,b)
   neighbors[a].add(b);neighbors[b].add(a)
   const edge=edges.get(id)
   if(edge)edge.opposite.push(other);else edges.set(id,{a,b,opposite:[other],index:0})
  }
 }
 const boundary=vertices.map(()=>[] as number[])
 for(const edge of edges.values())if(edge.opposite.length===1){boundary[edge.a].push(edge.b);boundary[edge.b].push(edge.a)}
 const positions:number[]=[]
 vertices.forEach((v,i)=>{
  const next=v.clone(),rim=boundary[i]
  if(rim.length===2)next.multiplyScalar(.75).addScaledVector(vertices[rim[0]],.125).addScaledVector(vertices[rim[1]],.125)
  else if(neighbors[i].size){const count=neighbors[i].size,beta=count===3?3/16:3/(8*count);next.multiplyScalar(1-count*beta);neighbors[i].forEach(n=>next.addScaledVector(vertices[n],beta))}
  positions.push(next.x,next.y,next.z)
 })
 for(const edge of edges.values()){
  const v=vertices[edge.a].clone().add(vertices[edge.b])
  if(edge.opposite.length===2)v.multiplyScalar(3/8).addScaledVector(vertices[edge.opposite[0]],1/8).addScaledVector(vertices[edge.opposite[1]],1/8)
  else v.multiplyScalar(.5)
  edge.index=positions.length/3;positions.push(v.x,v.y,v.z)
 }
 const triangles:number[]=[]
 for(let i=0;i<index.count;i+=3){
  const a=index.getX(i),b=index.getX(i+1),c=index.getX(i+2)
  const ab=edges.get(key(a,b))!.index,bc=edges.get(key(b,c))!.index,ca=edges.get(key(c,a))!.index
  triangles.push(a,ab,ca,b,bc,ab,c,ca,bc,ab,bc,ca)
 }
 merged.dispose()
 const result=new THREE.BufferGeometry()
 result.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));result.setIndex(triangles);result.computeVertexNormals()
 return result
}

async function prepareHand(side:HandSide):Promise<HandForm>{
 const gltf=await new GLTFLoader().loadAsync(`/assets/hand-model/${side}.glb`)
 const model=gltf.scene
 const mesh=model.getObjectByProperty('type','SkinnedMesh') as THREE.SkinnedMesh|undefined
 if(!mesh)throw new Error('手部模型暂时不可用')
 const joint=(name:string)=>{const bone=model.getObjectByName(name);if(!bone)throw new Error('手部模型内容不完整');return bone}
 const wrist=joint('wrist')
 const dorsal=new THREE.Vector3(0,1,0).applyQuaternion(wrist.quaternion).normalize()
 // These assets store joints as siblings. Move every downstream joint explicitly.
 for(let finger=0;finger<5;finger++){
  const name=fingerNames[finger]
  const chain=(finger===0?['metacarpal','phalanx-proximal','phalanx-distal','tip']:['metacarpal','phalanx-proximal','phalanx-intermediate','phalanx-distal','tip']).map(suffix=>joint(`${name}-${suffix}`))
  function turn(from:number,rotation:THREE.Quaternion){
   const pivot=chain[from].position.clone()
   for(let i=from;i<chain.length;i++){chain[i].position.sub(pivot).applyQuaternion(rotation).add(pivot);chain[i].quaternion.premultiply(rotation)}
  }
  if(finger===0){
   const bone=chain[1],axis=new THREE.Vector3(0,0,-1).applyQuaternion(bone.quaternion)
   const current=new THREE.Vector3(0,1,0).applyQuaternion(bone.quaternion)
   const desired=dorsal.clone().addScaledVector(axis,-dorsal.dot(axis)).normalize()
   const angle=Math.atan2(axis.dot(current.clone().cross(desired)),current.dot(desired))
   turn(1,new THREE.Quaternion().setFromAxisAngle(axis,angle*.7))
  }else{
   const bends=[0,-.06-finger*.022,-.07-finger*.022,-.035]
   for(let i=1;i<4;i++)turn(i,new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1,0,0).applyQuaternion(chain[i].quaternion),bends[i]))
  }
 }
 model.updateMatrixWorld(true);mesh.skeleton.update()
 const original=mesh.geometry.getAttribute('position')
 const geometry=mesh.geometry.clone(),positions=new Float32Array(original.count*3),point=new THREE.Vector3()
 for(let i=0;i<original.count;i++){mesh.getVertexPosition(i,point).applyMatrix4(mesh.matrixWorld);positions.set(point.toArray(),i*3)}
 geometry.setAttribute('position',new THREE.BufferAttribute(positions,3))
 const smooth=smoothHand(geometry);geometry.dispose()
 const shell=new THREE.Mesh(smooth,new THREE.MeshBasicMaterial({side:THREE.DoubleSide}));shell.updateMatrixWorld()
 const ray=new THREE.Raycaster()
 function skin(point:THREE.Vector3,normal:THREE.Vector3){
  ray.set(point.clone().addScaledVector(normal,.03),normal.clone().negate())
  return ray.intersectObject(shell,false)[0]?.point
 }
 const seats=fingerNames.map((name,i)=>{
  const distal=joint(`${name}-phalanx-distal`),tip=joint(`${name}-tip`)
  const start=distal.getWorldPosition(new THREE.Vector3()),end=tip.getWorldPosition(new THREE.Vector3())
  const forward=end.clone().sub(start).normalize()
  const normal=new THREE.Vector3(0,1,0).applyQuaternion(distal.getWorldQuaternion(new THREE.Quaternion())).normalize()
  const right=forward.clone().cross(normal).normalize();normal.copy(right.clone().cross(forward).normalize())
  const width=[.014,.0108,.0115,.0106,.0084][i],bed=start.distanceTo(end)*1.04
  const center=start.clone().lerp(end,.12)
  const root=skin(center,normal)
  if(!root)throw new Error('甲片与手指暂时没有贴合，请重新载入')
  // Sample the actual surface across the nail bed. The free edge continues from
  // the front of this fitted shell; it never moves the cuticle backward.
  const heights=Array.from({length:7},(_,row)=>Array.from({length:9},(_,col)=>{
   const x=(col/8-.5)*width,y=row/6*bed*.88
   const sample=skin(root.clone().addScaledVector(right,x).addScaledVector(forward,y),normal)
   return sample?sample.clone().sub(root).dot(normal):-.0025*(x/(width*.5))**2
  }))
  return {root,forward,normal,right,width,bed,heights}
 })
 ;(shell.material as THREE.Material).dispose()
 model.traverse(object=>{if(object instanceof THREE.Mesh){object.geometry.dispose();(Array.isArray(object.material)?object.material:[object.material]).forEach(material=>material.dispose())}})
 const up=joint('middle-finger-phalanx-proximal').position.clone().sub(wrist.position).normalize()
 const across=up.clone().cross(dorsal).normalize(),front=across.clone().cross(up).normalize()
 const orientation=new THREE.Matrix4().makeBasis(across,up,front).invert()
 return {geometry:smooth,seats,orientation}
}

export function loadHandForm(side:HandSide){
 let pending=forms.get(side)
 if(!pending){pending=prepareHand(side);forms.set(side,pending);pending.catch(()=>forms.delete(side))}
 return pending
}

export function seatHeight(seat:NailSeat,x:number,y:number){
 const across=THREE.MathUtils.clamp(x/seat.width+.5,0,1)*8
 const along=THREE.MathUtils.clamp(y/(seat.bed*.88),0,1)*6
 const x0=Math.min(7,Math.floor(across)),y0=Math.min(5,Math.floor(along))
 const a=THREE.MathUtils.lerp(seat.heights[y0][x0],seat.heights[y0][x0+1],across-x0)
 const b=THREE.MathUtils.lerp(seat.heights[y0+1][x0],seat.heights[y0+1][x0+1],across-x0)
 return THREE.MathUtils.lerp(a,b,along-y0)
}
