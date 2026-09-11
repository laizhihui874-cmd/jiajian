import {baseNail} from './design.js'
import type {Design,Nail} from './design.js'
import {hasInspirationLock} from './inspiration.js'
export const inspirationMoods=['温柔','清爽','简约','轻奢','甜酷'] as const
export const inspirationFamilies=['粉裸','红色','紫色','蓝色','绿色','棕色'] as const
export type Mood=typeof inspirationMoods[number]
export type Family=typeof inspirationFamilies[number]
export type GeneratedInspiration={design:Design;mood:Mood;family:Family;colors:string[];finish:Nail['finish'];seed:number}
function random(seed:number){let t=seed>>>0;return()=>{t+=0x6D2B79F5;let n=t;n=Math.imul(n^n>>>15,n|1);n^=n+Math.imul(n^n>>>7,n|61);return((n^n>>>14)>>>0)/4294967296}}
function hex(h:number,s:number,l:number){s/=100;l/=100;const a=s*Math.min(l,1-l);return '#'+[0,8,4].map(n=>{const k=(n+h/30)%12,c=l-a*Math.max(-1,Math.min(k-3,9-k,1));return Math.round(c*255).toString(16).padStart(2,'0')}).join('')}
const hues:Record<Family,number>={'粉裸':350,'红色':355,'紫色':280,'蓝色':210,'绿色':145,'棕色':28}
const finishes:Record<Mood,Nail['finish'][]>={'温柔':['gloss','jelly'],'清爽':['gloss','jelly'],'简约':['gloss','matte'],'轻奢':['cat','glitter'],'甜酷':['chrome','cat']}
export function generateInspiration(original:Design,options:{seed:number;mood?:Mood;family?:Family;previous?:GeneratedInspiration;variation?:'similar'|'different';keep?:number[]}):GeneratedInspiration{
 const rng=random(options.seed),pick=<T,>(xs:readonly T[])=>xs[Math.floor(rng()*xs.length)]
 const previous=options.previous,similar=options.variation==='similar'&&previous
 const mood=similar?previous.mood:options.mood||pick(inspirationMoods)
 const family=similar?previous.family:options.family||pick(inspirationFamilies.filter(f=>f!==previous?.family))
 const hue=(hues[family]+rng()*18-9+360)%360
 const colors=similar?[...previous.colors]:[hex(hue,mood==='甜酷'?32:24,mood==='轻奢'||mood==='甜酷'?34:65),hex(hue+8,20,84),hex(hue,35,mood==='轻奢'?48:42)]
 const finish=similar?previous.finish:pick(finishes[mood])
 const motif=pick<Nail['pattern']>(mood==='简约'?['french','lines']:mood==='轻奢'?['none','lines']:['french','gradient','dots','lines'])
 const leftAccent=pick([1,3]),rightAccent=leftAccent===1?3:1
 const secondary=pick([0,4]),positions=[leftAccent,rightAccent]
 const nails=original.nails.map((old,i)=>{
  if(hasInspirationLock(old))return structuredClone(old)
  if(options.keep?.includes(i))return structuredClone(previous?.design.nails[i]||old)
  const hand=Math.floor(i/5),finger=i%5,hero=finger===positions[hand],support=finger===secondary
  const n=baseNail(),pattern=hero?motif:'none'
  return {...n,shape:old.shape,variant:old.variant,length:old.length,color:hero?colors[2]:support?colors[1]:colors[0],accent:colors[1],finish:hero||!support?finish:'gloss',opacity:finish==='jelly'?.78:1,pattern,patternSize:motif==='lines'?8+Math.floor(rng()*6):14+Math.floor(rng()*9),catAngle:Math.floor(rng()*70)-35,
   surface:{...n.surface,shine:finish==='matte'?22:65+Math.floor(rng()*20),catStyle:pick<Nail['surface']['catStyle']>(['ribbon','diagonal','velvet','halo']),catWidth:18+Math.floor(rng()*25),catStrength:55+Math.floor(rng()*25),sparkle:18+Math.floor(rng()*20)},
   patternSettings:{...n.patternSettings,angle:Math.floor(rng()*40)-20,curve:35+Math.floor(rng()*30),softness:75,spacing:32,lineCount:1},
   decorations:hero&&mood==='轻奢'?[{id:`00000000-0000-4000-8000-${((options.seed>>>0)*10+i).toString().padStart(12,'0')}`,type:'pearl' as const,x:55,y:115,size:6,locked:false}]:[],
  }
 })
 return {design:{...original,name:`${family} · ${mood}灵感`,nails},mood,family,colors,finish,seed:options.seed}
}
