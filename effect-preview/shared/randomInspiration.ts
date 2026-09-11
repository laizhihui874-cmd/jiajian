import {baseNail} from './design.js'
import type {Design,Nail} from './design.js'
import {hasInspirationLock} from './inspiration.js'
export const inspirationMoods=['温柔','清爽','简约','轻奢','甜酷','艺术撞色'] as const
export const inspirationFamilies=['粉裸','红色','紫色','蓝色','绿色','棕色'] as const
export const inspirationIntensities=['大胆','更出挑','克制'] as const
export type Intensity=typeof inspirationIntensities[number]
export type Mood=typeof inspirationMoods[number]
export type Family=typeof inspirationFamilies[number]
export type GeneratedInspiration={design:Design;mood:Mood;family:Family;colors:string[];finish:Nail['finish'];seed:number;intensity:Intensity;concept:string}
function random(seed:number){let t=seed>>>0;return()=>{t+=0x6D2B79F5;let n=t;n=Math.imul(n^n>>>15,n|1);n^=n+Math.imul(n^n>>>7,n|61);return((n^n>>>14)>>>0)/4294967296}}
function hex(h:number,s:number,l:number){h=(h%360+360)%360;s/=100;l/=100;const a=s*Math.min(l,1-l);return '#'+[0,8,4].map(n=>{const k=(n+h/30)%12,c=l-a*Math.max(-1,Math.min(k-3,9-k,1));return Math.round(c*255).toString(16).padStart(2,'0')}).join('')}
const hues:Record<Family,number>={'粉裸':340,'红色':355,'紫色':280,'蓝色':220,'绿色':145,'棕色':28}
const finishes:Record<Mood,Nail['finish'][]>={'温柔':['gloss','jelly'],'清爽':['jelly','cat'],'简约':['gloss','matte'],'轻奢':['cat','glitter'],'甜酷':['chrome','cat'],'艺术撞色':['chrome','gloss','cat']}
export function generateInspiration(original:Design,options:{seed:number;mood?:Mood;family?:Family;intensity?:Intensity;previous?:GeneratedInspiration;variation?:'similar'|'different';keep?:number[]}):GeneratedInspiration{
 const rng=random(options.seed),pick=<T,>(xs:readonly T[])=>xs[Math.floor(rng()*xs.length)]
 const previous=options.previous,similar=options.variation==='similar'&&previous
 const intensity=options.intensity||previous?.intensity||'大胆',quiet=intensity==='克制',extra=intensity==='更出挑'
 const mood=similar?previous.mood:options.mood||pick(['轻奢','甜酷','艺术撞色','清爽'] as const)
 const family=similar?previous.family:options.family||pick(inspirationFamilies.filter(f=>f!==previous?.family))
 const hue=hues[family]+rng()*24-12,offset=quiet?25:pick([125,155,185,215])
 const colors=similar?[...previous.colors]:[hex(hue,quiet?35:72,45),hex(hue+offset,quiet?25:78,extra?57:64),hex(hue,24,93),hex(hue+15,42,17)]
 const finish=similar?previous.finish:pick(finishes[mood])
 const motifs=pick<['french'|'gradient','dots'|'lines']>([['french','dots'],['gradient','lines'],['french','lines'],['gradient','dots']])
 const rotation=Math.floor(rng()*5),direction=pick([1,-1]),angle=Math.floor(rng()*110)-55
 const concept=`${motifs[0]==='french'?'斜切法式':'晕染光圈'} × ${motifs[1]==='dots'?'跳色波点':'流动曲线'}`
 const nails=original.nails.map((old,i):Nail=>{
  if(hasInspirationLock(old))return structuredClone(old)
  if(options.keep?.includes(i))return structuredClone(previous?.design.nails[i]||old)
  const hand=Math.floor(i/5),role=((i%5)*direction+rotation+hand+10)%5
  const patterned=quiet?role===2:role===1||role===2||role===4
  const hero=role===2,secondary=role===4
  const n=baseNail(),pattern=patterned?(hero?motifs[0]:motifs[1]):'none'
  const color=colors[role===0?0:role===1?2:role===2?3:role===3?1:0],accent=colors[hero?1:secondary?2:3]
  const surfaceFinish=role===0?finish:role===3?(quiet?'gloss':pick<Nail['finish']>(['chrome','cat','glitter'])):role===1?'jelly':'gloss'
  const decorations:Nail['decorations']=!quiet&&(hero||extra&&secondary)?Array.from({length:hero?(extra?3:2):1},(_,k)=>({id:`00000000-0000-4000-8000-${((options.seed>>>0)*100+i*10+k).toString().padStart(12,'0')}`,type:k%2===0?'gem':'pearl',x:hero?36+k*14:50,y:hero?112+(k%2)*8:38,size:k===0?11:6,locked:false})):[]
  return {...n,shape:old.shape,variant:old.variant,length:old.length,color,accent,finish:surfaceFinish,opacity:surfaceFinish==='jelly'?.86:1,pattern,patternSize:pattern==='dots'?10:pattern==='lines'?9:28,catAngle:angle,
   surface:{...n.surface,shine:surfaceFinish==='matte'?20:88,catStyle:pick<Nail['surface']['catStyle']>(['diagonal','halo','velvet','cross']),catWidth:24+Math.floor(rng()*32),catStrength:85,sparkle:extra?72:48},
   patternSettings:{...n.patternSettings,frenchStyle:pick(['diagonal','double','deep'] as const),gradientStyle:'aura',dotsStyle:'scatter',linesStyle:'wave',angle:hand?-angle:angle,curve:70,softness:55,spacing:30,lineCount:2},
   patternLayers:extra&&hero?[{id:`inspiration-${options.seed}-${i}`,type:'lines',accent:colors[2],patternSize:8,settings:{...n.patternSettings,linesStyle:'wave',lineCount:1,angle:-angle,opacity:85},locked:false,drawMode:'preset',strokes:[]}]:[],decorations}
 })
 return {design:{...original,name:`${family} · ${concept}`,nails},mood,family,colors,finish,seed:options.seed,intensity,concept}
}
