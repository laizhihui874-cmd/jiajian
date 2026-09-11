import type {Nail} from '../shared/design'
import {nailPatterns} from '../shared/patternLayers'
import {defaultPatternSettings} from '../shared/effects'

// Paint lives under the reflective top coat, so pattern highlights follow the nail surface.
export function paintNailColor(n:Nail){
 const canvas=document.createElement('canvas');canvas.width=400;canvas.height=640
 const ctx=canvas.getContext('2d')!
 ctx.scale(4,4);ctx.fillStyle=n.color;ctx.fillRect(0,0,100,160)
 if(n.opacity<1&&n.finish!=='jelly'){ctx.globalAlpha=1-n.opacity;ctx.fillStyle='#f7e6dc';ctx.fillRect(0,0,100,160);ctx.globalAlpha=1}
 for(const layer of nailPatterns(n)){
 const p={...defaultPatternSettings(),...layer.settings},pattern=layer.type,size=layer.patternSize,accent=layer.accent
 ctx.save();
 if(layer.drawMode==='free'&&(pattern==='dots'||pattern==='lines')){
  ctx.globalAlpha=p.opacity/100;ctx.fillStyle=accent;ctx.strokeStyle=accent;ctx.lineWidth=size/8;ctx.lineCap='round';ctx.lineJoin='round'
  for(const stroke of layer.strokes){const first=stroke.points[0];if(!first)continue;ctx.beginPath();if(pattern==='dots'||stroke.points.length===1){ctx.arc(first.x,first.y,pattern==='dots'?size/9:size/16,0,Math.PI*2);ctx.fill()}else{ctx.moveTo(first.x,first.y);for(const point of stroke.points.slice(1))ctx.lineTo(point.x,point.y);ctx.stroke()}}
  ctx.restore();continue
 }
 ctx.translate(50,80);ctx.rotate(p.angle*Math.PI/180);ctx.translate(-50,-80);ctx.globalAlpha=p.opacity/100
 ctx.fillStyle=accent;ctx.strokeStyle=accent;ctx.lineCap='round'
 if(pattern==='french'){
  const deep=p.frenchStyle==='deep',depth=size*(deep?1.3:1),curve=p.curve*(deep?.65:.4),shift=(p.position-50)*.45
  ctx.translate(0,shift)
  ctx.beginPath();ctx.moveTo(-100,-150);ctx.lineTo(200,-150)
  if(p.frenchStyle==='diagonal'){ctx.lineTo(200,depth+95);ctx.lineTo(-100,depth-70)}
  else{ctx.lineTo(100,depth+curve);ctx.quadraticCurveTo(50,depth-curve,0,depth+curve);ctx.lineTo(-100,depth+curve)}
  ctx.closePath();ctx.fill()
  if(p.frenchStyle==='double'){ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(0,depth+curve+10);ctx.quadraticCurveTo(50,depth-curve+10,100,depth+curve+10);ctx.stroke()}
 }
 if(pattern==='gradient'){
  const center=p.position*1.6,soft=p.softness*.95
  const g=p.gradientStyle==='aura'?ctx.createRadialGradient(50,center,0,50,center,18+p.softness):ctx.createLinearGradient(0,center-soft,0,center+soft)
  g.addColorStop(0,accent);g.addColorStop(.45,accent+'b0');g.addColorStop(1,accent+'00');ctx.fillStyle=g;ctx.fillRect(-150,-200,400,550)
 }
 if(pattern==='dots'){
  const space=p.spacing,radius=size/9
  for(let y=-space,row=0;y<200;y+=space,row++)for(let x=-space,col=0;x<140;x+=space,col++){
   const seed=Math.abs(Math.sin(row*91.7+col*47.2)),scatter=p.dotsStyle==='scatter'
   const px=x+(row%2)*space*.5+(scatter?(seed-.5)*space*.65:0),py=y+(p.position-50)*.5+(scatter?(Math.cos(row*13+col*19))*.3*space:0)
   ctx.beginPath();ctx.arc(px,py,radius*(scatter?.65+seed*.7:1),0,Math.PI*2);ctx.fill()
  }
 }
 if(pattern==='lines'){
  ctx.lineWidth=size/8
  for(let i=0;i<p.lineCount;i++){
   const y=p.position*1.6+(i-(p.lineCount-1)/2)*p.spacing
   ctx.beginPath();ctx.moveTo(-100,y)
   if(p.linesStyle==='straight')ctx.lineTo(200,y)
   else{ctx.lineTo(-5,y);ctx.bezierCurveTo(30,y-p.curve*.6,65,y+p.curve*.6,110,y);ctx.lineTo(200,y)}
   ctx.stroke()
  }
 }
 ctx.restore()
 }
 return canvas
}
