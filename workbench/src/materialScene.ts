import * as THREE from 'three'
import {createNailGeometry} from './nailGeometry'
import type {MaterialSettings} from './materialLabSettings'
import {defaultMaterialSettings} from './materialLabSettings'
import type {Nail} from '../shared/design'
import {defaultSurface} from '../shared/effects'
import {paintNailColor} from './patternPaint'

export function createMaterialScene(host:HTMLElement,initial:MaterialSettings,onError:(message:string)=>void,offscreen=false){
 const renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:'low-power'})
 renderer.setPixelRatio(Math.min(window.devicePixelRatio,1.6));renderer.setClearColor(0x000000,0)
 renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05
 const canvas=renderer.domElement;canvas.tabIndex=0;canvas.setAttribute('role','img');canvas.setAttribute('aria-label','立体甲片，拖动或按方向键转动');host.appendChild(canvas)
 const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(32,1,.1,100)
 camera.position.set(0,0,7.1)
 scene.background=new THREE.Color('#f3eee6')
 const environment=new THREE.Scene()
 const roomGeometry=new THREE.SphereGeometry(30,24,16),roomMaterial=new THREE.MeshBasicMaterial({color:'#80796f',side:THREE.BackSide})
 environment.add(new THREE.Mesh(roomGeometry,roomMaterial))
 const panels:THREE.Mesh[]=[]
 function panel(w:number,h:number,x:number,y:number,z:number,power:number){
  const mesh=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({color:new THREE.Color(power,power*.97,power*.93),side:THREE.DoubleSide}))
  mesh.position.set(x,y,z);mesh.lookAt(0,0,0);environment.add(mesh);panels.push(mesh)
 }
 panel(.75,3.5,-3.5,2.5,4,3.2);panel(.45,2.5,4,0,3,1.2);panel(4,2,0,6,2,1.5)
 const pmrem=new THREE.PMREMGenerator(renderer),environmentTarget=pmrem.fromScene(environment,.012)
 scene.environment=environmentTarget.texture
 roomGeometry.dispose();roomMaterial.dispose();panels.forEach(p=>{p.geometry.dispose();(p.material as THREE.Material).dispose()});pmrem.dispose()
 scene.add(new THREE.HemisphereLight('#fff5e8','#a49997',2))
 const key=new THREE.DirectionalLight('#fff4ea',2.5);key.position.set(-3,4,6);scene.add(key)
 const uniforms={catStyle:{value:0},catOffset:{value:0},lightTravel:{value:0},glitterPower:{value:0},catEnabled:{value:1},catAngle:{value:0},catWidth:{value:.15},catStrength:{value:.8},catTint:{value:new THREE.Color()},catTangent:{value:new THREE.Vector3(1,0,0)}}
 const material=new THREE.MeshPhysicalMaterial({color:initial.color,roughness:.21,metalness:.15,clearcoat:1,clearcoatRoughness:.035,envMapIntensity:1.1,ior:1.48})
 material.onBeforeCompile=shader=>{
  Object.assign(shader.uniforms,uniforms)
  shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 nailPosition;\nvarying vec3 nailTangent;\nuniform vec3 catTangent;')
   .replace('#include <begin_vertex>','#include <begin_vertex>\nnailPosition = position;\nnailTangent = normalize(mat3(modelViewMatrix) * catTangent);')
  shader.fragmentShader=shader.fragmentShader.replace('#include <common>',`#include <common>
   varying vec3 nailPosition; varying vec3 nailTangent;
   uniform float catStyle; uniform float catOffset; uniform float lightTravel; uniform float glitterPower; uniform float catEnabled; uniform float catAngle; uniform float catWidth; uniform float catStrength; uniform vec3 catTint;
   float nailNoise(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
  `).replace('#include <emissivemap_fragment>',`#include <emissivemap_fragment>
   vec3 nailView=normalize(vViewPosition);
   vec3 nailHalf=normalize(nailView+normalize(vec3(-0.5,0.7,1.4)));
   vec2 axis=vec2(cos(catAngle),sin(catAngle));
   float across=dot(nailPosition.xy,axis);
   float travel=dot(nailView,normalize(nailTangent))+lightTravel;
   float field=across+travel*1.65+0.08*sin(nailPosition.y*1.7)-catOffset;
   if(catStyle>0.5&&catStyle<1.5)field=length(nailPosition.xy-vec2(travel*1.15,catOffset*1.4))-0.55;
   float width=max(catWidth*0.52,0.035);
   if(catStyle>1.5&&catStyle<2.5){field=across+travel*1.8-catOffset;width=0.30+catWidth*0.35;}
   if(catStyle>2.5&&catStyle<3.5){field=nailPosition.y-(0.93-0.65*(nailPosition.x/0.8)*(nailPosition.x/0.8))+travel*0.7-catOffset*0.6;}
   if(catStyle>3.5&&catStyle<4.5){float second=dot(nailPosition.xy,vec2(-axis.y,axis.x))+travel*1.2-catOffset;field=min(abs(field),abs(second));}
   if(catStyle>4.5){field=length(nailPosition.xy-vec2(travel*1.15,catOffset*1.4));width=max(catWidth*1.25,0.12);}
   // Stable, irregular flakes with individual orientation. Their response changes
   // with the viewing light; the pattern itself does not slide over the nail.
   vec2 cells=nailPosition.xy*145.0;
   vec2 cell=floor(cells);
   float seed=nailNoise(cell);
   float orientation=nailNoise(cell+vec2(43.7,19.2));
   vec2 center=vec2(0.2+seed*0.6,0.2+orientation*0.6);
   vec2 local=(fract(cells)-center)*vec2(1.0,1.35);
   float flake=1.0-smoothstep(0.12,0.52,length(local));
   float microField=(field+(orientation-0.5)*width*2.2)/width;
   float aligned=exp(-microField*microField*2.8);
   float bodyField=field/(width*1.65);
   float body=exp(-bodyField*bodyField);
   float fine=nailNoise(floor(nailPosition.xy*370.0));
   float twinkle=pow(max(0.0,cos(orientation*22.0+travel*15.0)),14.0);
   float facing=pow(max(dot(normal,nailHalf),0.0),2.0);
   float powder=aligned*(0.10+flake*(0.35+seed*1.5))+body*fine*0.09;
   float pin=aligned*flake*twinkle*step(0.7,seed);
   // Pick up the color at this exact point of the finished design. Using one
   // global tint here erased French tips and recolored multicolor gradients.
   vec3 pigment=clamp(diffuseColor.rgb,0.0,1.0);
   vec3 flakeTint=mix(pigment,sqrt(pigment),0.45);
   vec3 silver=mix(flakeTint,vec3(0.92,0.95,1.0),0.08);
   totalEmissiveRadiance+=catEnabled*catStrength*(flakeTint*powder*1.3+silver*pin*2.4)*(0.4+facing*0.6);
   float glitterFacing=pow(max(dot(normal,nailHalf),0.0),6.0);
   totalEmissiveRadiance+=glitterPower*mix(catTint,vec3(1.0,0.94,0.84),0.35)*flake*pow(seed,5.0)*(0.12+twinkle*1.8)*glitterFacing;

  `)
 }
 let geometry=createNailGeometry()
 const group=new THREE.Group(),mesh=new THREE.Mesh(geometry,material)
 group.add(mesh);scene.add(group)
 let frame=0,disposed=false,playing=false,lastTime=0,lastDraw=0,phase=0,angleX=-.08,angleY=-.12,count=1,lost=false
 function render(time:number){
  frame=0;if(disposed||lost||document.hidden)return
  if(playing&&time-lastDraw<1000/30){frame=requestAnimationFrame(render);return}lastDraw=time
  if(playing){if(lastTime)phase+=Math.min((time-lastTime)/1000,.06);lastTime=time;group.rotation.set(Math.sin(phase*.75)*.18,Math.sin(phase)*.43,0)}
  else{lastTime=0;group.rotation.set(angleX,angleY,0)}
  renderer.render(scene,camera)
  if(playing)frame=requestAnimationFrame(render)
 }
 function invalidate(){if(!offscreen&&!frame&&!disposed&&!lost&&!document.hidden)frame=requestAnimationFrame(render)}
 function resize(){const {width,height}=host.getBoundingClientRect();if(!width||!height)return;renderer.setSize(width,height);camera.aspect=width/height;camera.position.z=count===1?Math.max(6.8,3.5/camera.aspect):Math.max(9.3,9.0/camera.aspect);camera.updateProjectionMatrix();invalidate()}
 const observer=new ResizeObserver(resize);if(!offscreen)observer.observe(host)
 function update(settings:MaterialSettings){
  const cat=settings.finish==='cat',jelly=settings.finish==='jelly'
  material.color.set(settings.color)
  if(jelly)material.color.lerp(new THREE.Color('#ffffff'),.50-settings.density/220)
  material.roughness=jelly?.10:cat?.19:.19;material.metalness=cat?.32:0
  const wasTransmissive=material.transmission>0
  material.transmission=jelly?.96-settings.density/350:0;material.thickness=jelly?.18:0
  material.attenuationColor.set(settings.color);material.attenuationDistance=1.7
  material.clearcoatRoughness=jelly?.025:.035
  const hsl={h:0,s:0,l:0};new THREE.Color(settings.color).getHSL(hsl)
  uniforms.catTint.value.setHSL(hsl.h,Math.min(hsl.s,.78),.36)
  uniforms.catEnabled.value=cat?1:0;uniforms.catAngle.value=settings.angle*Math.PI/180
  uniforms.catTangent.value.set(Math.cos(uniforms.catAngle.value),Math.sin(uniforms.catAngle.value),0)
  uniforms.catWidth.value=settings.width/110;uniforms.catStrength.value=settings.strength/55
  renderer.toneMappingExposure=settings.light/90;if(wasTransmissive!==jelly)material.needsUpdate=true;invalidate()
 }
 let pointer:{id:number;x:number;y:number;ax:number;ay:number}|undefined
 function stop(){if(playing){angleX=group.rotation.x;angleY=group.rotation.y}playing=false;lastTime=0}
 function down(e:PointerEvent){if(e.button!==0)return;stop();pointer={id:e.pointerId,x:e.clientX,y:e.clientY,ax:angleX,ay:angleY};canvas.setPointerCapture(e.pointerId);canvas.focus();invalidate()}
 function move(e:PointerEvent){if(pointer?.id!==e.pointerId)return;angleX=THREE.MathUtils.clamp(pointer.ax+(e.clientY-pointer.y)*.006,-.65,.65);angleY=THREE.MathUtils.clamp(pointer.ay+(e.clientX-pointer.x)*.008,-.95,.95);invalidate()}
 function up(){pointer=undefined}
 function keydown(e:KeyboardEvent){if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home'].includes(e.key))return;e.preventDefault();stop();if(e.key==='Home'){angleX=0;angleY=0}else if(e.key==='ArrowLeft'||e.key==='ArrowRight')angleY=THREE.MathUtils.clamp(angleY+(e.key==='ArrowLeft'?-.1:.1),-.95,.95);else angleX=THREE.MathUtils.clamp(angleX+(e.key==='ArrowUp'?-.1:.1),-.65,.65);invalidate()}
 function visibility(){if(document.hidden){cancelAnimationFrame(frame);frame=0;lastTime=0}else invalidate()}
 function contextLost(e:Event){e.preventDefault();lost=true;cancelAnimationFrame(frame);frame=0;onError('立体预览暂时中断，请关闭后重新打开。原来的作品不受影响。')}
 canvas.addEventListener('pointerdown',down);canvas.addEventListener('pointermove',move);canvas.addEventListener('pointerup',up);canvas.addEventListener('pointercancel',up);canvas.addEventListener('keydown',keydown);canvas.addEventListener('webglcontextlost',contextLost);document.addEventListener('visibilitychange',visibility)
 update(initial);if(!offscreen)resize()
 let shapeKey='oval:classic',texture:THREE.CanvasTexture|undefined,paintKey=''
 return {
  update,
  paintPoint(n:Nail,x:number,y:number){
   const nextShape=n.shape+':'+n.variant
   if(nextShape!==shapeKey){geometry.dispose();geometry=createNailGeometry(n.shape,n.variant);mesh.geometry=geometry;shapeKey=nextShape}
   camera.aspect=400/640;camera.position.z=5.9;camera.updateProjectionMatrix();camera.updateMatrixWorld();group.rotation.set(0,0,0);group.updateMatrixWorld(true)
   const ray=new THREE.Raycaster();ray.setFromCamera(new THREE.Vector2(x*2-1,1-y*2),camera)
   const hit=ray.intersectObject(mesh,false)[0]
   return hit?.uv?{x:Math.round(hit.uv.x*10000)/100,y:Math.round((1-hit.uv.y)*16000)/100}:null
  },
  snapshot(n:Nail,light=0){
   if(lost)throw new Error('立体材质暂时中断，请刷新工作台')
   const surface={...defaultSurface(),...n.surface},nextShape=n.shape+':'+n.variant
   if(nextShape!==shapeKey){geometry.dispose();geometry=createNailGeometry(n.shape,n.variant);mesh.geometry=geometry;shapeKey=nextShape}
   const nextPaint=JSON.stringify([n.color,n.accent,n.opacity,n.pattern,n.patternSize,n.patternSettings,n.patternLayers,n.finish==='jelly'])
   if(paintKey!==nextPaint){texture?.dispose();texture=new THREE.CanvasTexture(paintNailColor(n));texture.colorSpace=THREE.SRGBColorSpace;material.map=texture;material.needsUpdate=true;paintKey=nextPaint}
   update({...defaultMaterialSettings,color:n.color,finish:n.finish==='cat'?'cat':n.finish==='jelly'?'jelly':'gloss',angle:n.catAngle,width:surface.catWidth,strength:surface.catStrength,density:n.opacity*80,light:90})
   material.color.set('#ffffff')
   material.roughness=n.finish==='matte'?.55+surface.shine/225:n.finish==='chrome'?.1:.06+(100-surface.shine)/250
   material.clearcoat=n.finish==='matte'?.02:1
   material.clearcoatRoughness=n.finish==='matte'?.9:.02+(100-surface.shine)/550
   material.metalness=n.finish==='chrome'?1:n.finish==='cat'?.12:n.finish==='glitter'?.3:0
   uniforms.catStyle.value=({ribbon:0,straight:0,diagonal:0,halo:1,velvet:2,french:3,cross:4,spot:5}[surface.catStyle])
   uniforms.catOffset.value=surface.catPosition/70;uniforms.lightTravel.value=light/70
   uniforms.glitterPower.value=n.finish==='glitter'?surface.sparkle/65:0
   scene.environmentRotation.y=light/40;key.position.x=-3+light/8
   scene.background=null;renderer.setPixelRatio(1);renderer.setSize(400,640,false)
   camera.aspect=400/640;camera.position.z=5.9;camera.updateProjectionMatrix();group.rotation.set(0,0,0)
   renderer.render(scene,camera)
   const output=document.createElement('canvas');output.width=400;output.height=640;output.getContext('2d')!.drawImage(canvas,0,0)
   return output
  },
  play(value:boolean){if(!value)stop();else playing=true;lastTime=0;invalidate()},
  orient(x:number,y:number){playing=false;angleX=x;angleY=y;invalidate()},
  count(value:number){count=value;group.clear();if(value===1){mesh.position.set(0,0,0);mesh.scale.setScalar(1);group.add(mesh)}else for(let i=0;i<10;i++){const nail=new THREE.Mesh(geometry,material);nail.scale.setScalar([.67,.62,.65,.61,.53][i%5]);nail.position.set(((i%5)-2)*1.24,(i<5?1.22:-1.22),0);group.add(nail)}resize()},
  async download(){renderer.render(scene,camera);const blob=await new Promise<Blob|null>(resolve=>canvas.toBlob(resolve,'image/png'));if(!blob)throw new Error('导出未完成，请重试');const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='甲间-立体试色.png';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)},
  dispose(){disposed=true;cancelAnimationFrame(frame);observer.disconnect();document.removeEventListener('visibilitychange',visibility);canvas.removeEventListener('pointerdown',down);canvas.removeEventListener('pointermove',move);canvas.removeEventListener('pointerup',up);canvas.removeEventListener('pointercancel',up);canvas.removeEventListener('keydown',keydown);canvas.removeEventListener('webglcontextlost',contextLost);geometry.dispose();texture?.dispose();material.dispose();environmentTarget.dispose();renderer.dispose();renderer.forceContextLoss();canvas.remove()},
 }
}
