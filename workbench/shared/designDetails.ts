import {atelierStyles,finishNames,nailName,patternNames,targets} from './design.js'
import {nailPatterns,patternPatch} from './patternLayers.js'
import type {Design,Nail,Scope} from './design.js'

const groupKeys:Record<Nail['lockedLayers'][number],(keyof Nail)[]>={shape:['shape','variant','length'],base:['color','opacity'],surface:['finish','surface','catAngle'],pattern:['pattern','patternSize','patternSettings','accent','patternLayers'],artwork:['artwork']}
export function updateEditableNails(design:Design,selected:number,scope:Scope,patch:Partial<Nail>):Design{
 const indexes=targets(selected,scope)
 return {...design,nails:design.nails.map((n,i)=>{
  if(!indexes.includes(i))return n
  const blocked=n.lockedLayers.some(group=>groupKeys[group].some(key=>key in patch))
  if(blocked)return n
  const change=structuredClone(patch);delete change.lockedLayers
  if(change.patternLayers){
   const locked=nailPatterns(n).filter(l=>l.locked)
   change.patternLayers=change.patternLayers.map(l=>locked.find(old=>old.id===l.id)||l)
   for(const old of locked)if(!change.patternLayers.some(l=>l.id===old.id))change.patternLayers.push(old)
   if(locked.length)change.pattern='none'
   if(change.patternLayers.length>12||change.patternLayers.reduce((sum,l)=>sum+l.strokes.reduce((count,s)=>count+s.points.length,0),0)>4096)return n
  }
  if(change.decorations)change.decorations=[...change.decorations.filter(d=>!n.decorations.some(old=>old.locked&&old.id===d.id)),...n.decorations.filter(d=>d.locked)]
  return {...n,...change}
 })}
}
export function previewWithoutLayers(n:Nail,hidden:string[]=[]):Nail{
 return {...n,...(hidden.includes('artwork')?{artwork:undefined}:{}),...(hidden.includes('base')?{color:'#F4ECE3',opacity:1}:{}),...(hidden.includes('surface')?{finish:'gloss' as const}:{}),...patternPatch(nailPatterns(n).filter(l=>!hidden.includes('pattern')&&!hidden.includes(l.id))),decorations:n.decorations.filter(d=>!hidden.includes(d.id))}
}
export type PriceLine={label:string;quantity:number;unit:number;amount:number;fingers:string[]}
// Deliberately fictional design-demo rules, never a salon quote or a payable order.
export function designSummary(design:Design){
 const lines:PriceLine[]=[{label:'基础甲片 · 十片一套',quantity:1,unit:30,amount:30,fingers:[]}]
 const grouped=new Map<string,PriceLine>()
 function add(label:string,unit:number,index:number){let line=grouped.get(label);if(!line){line={label,quantity:0,unit,amount:0,fingers:[]};grouped.set(label,line)}line.quantity++;line.amount+=unit;if(!line.fingers.includes(nailName(index)))line.fingers.push(nailName(index))}
 const finishFees:Record<Nail['finish'],number>={gloss:0,jelly:2,matte:1,glitter:3,chrome:4,cat:4}
 const patternFees:Record<Nail['pattern'],number>={none:0,french:3,gradient:3,dots:2,lines:2}
 design.nails.forEach((n,i)=>{
  if(n.artwork)add(`完整款 · ${atelierStyles.find(x=>x.id===n.artwork)!.name}`,8,i)
  else{
   if(finishFees[n.finish])add(`${finishNames[n.finish]}色胶`,finishFees[n.finish],i)
   for(const type of new Set(nailPatterns(n).filter(l=>l.drawMode!=='free'||l.strokes.length>0).map(l=>l.type)))add(`${patternNames[type]}图案`,patternFees[type],i)
  }
  for(const d of n.decorations)add(d.type==='pearl'?'另加珍珠':'另加水钻',d.type==='pearl'?2:3,i)
 })
 lines.push(...grouped.values())
 return {lines,total:lines.reduce((sum,x)=>sum+x.amount,0)}
}
