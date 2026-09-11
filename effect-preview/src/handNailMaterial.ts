import * as THREE from 'three'
import type {Nail} from '../shared/design'
import {defaultSurface} from '../shared/effects'
import {paintNailColor} from './patternPaint'
import {renderPhotoNail} from './nailRenderer'

// Shared finish behavior, now lit by the complete hand scene instead of a picture.
export async function createHandNailMaterial(n:Nail){
 const uniforms={catStyle:{value:0},catOffset:{value:0},lightTravel:{value:0},glitterPower:{value:0},catEnabled:{value:1},catAngle:{value:0},catWidth:{value:.15},catStrength:{value:.8},catTint:{value:new THREE.Color()},catTangent:{value:new THREE.Vector3(1,0,0)}}
 const material=new THREE.MeshPhysicalMaterial({color:n.color,roughness:.21,metalness:.15,clearcoat:1,clearcoatRoughness:.035,envMapIntensity:1.1,ior:1.48})
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
 const surface={...defaultSurface(),...n.surface}
 const artwork=!!n.artwork
 let paint:HTMLCanvasElement
 if(artwork){
  const image=await renderPhotoNail({...n,decorations:[]})
  paint=document.createElement('canvas');paint.width=400;paint.height=640
  const ctx=paint.getContext('2d')!;ctx.fillStyle=n.color;ctx.fillRect(0,0,400,640);ctx.drawImage(image,0,0)
 }else paint=paintNailColor(n)
 const texture=new THREE.CanvasTexture(paint);texture.colorSpace=THREE.SRGBColorSpace
 material.color.set('#ffffff');material.map=texture
 material.roughness=artwork?.34:n.finish==='matte'?.7:n.finish==='chrome'?.085:.09+(100-surface.shine)/330
 material.metalness=artwork?0:n.finish==='chrome'?1:n.finish==='cat'?.12:n.finish==='glitter'?.25:0
 material.clearcoat=artwork?.25:n.finish==='matte'?.02:1
 material.clearcoatRoughness=n.finish==='matte'?.8:.035+(100-surface.shine)/550
 material.transmission=!artwork&&n.finish==='jelly'?.28:0
 material.thickness=.05;material.attenuationColor.set(n.color);material.attenuationDistance=.12
 uniforms.catEnabled.value=!artwork&&n.finish==='cat'?1:0
 uniforms.catAngle.value=n.catAngle*Math.PI/180
 uniforms.catTangent.value.set(Math.cos(uniforms.catAngle.value),Math.sin(uniforms.catAngle.value),0)
 uniforms.catWidth.value=surface.catWidth/110;uniforms.catStrength.value=surface.catStrength/55
 uniforms.catOffset.value=surface.catPosition/70
 uniforms.catStyle.value=({ribbon:0,straight:0,diagonal:0,halo:1,velvet:2,french:3,cross:4,spot:5}[surface.catStyle])
 uniforms.glitterPower.value=!artwork&&n.finish==='glitter'?surface.sparkle/65:0
 uniforms.catTint.value.set(n.color)
 material.addEventListener('dispose',()=>texture.dispose())
 return material
}
