import {baseNail,nailSchema} from './design.js'
import type {Design,Nail} from './design.js'

export type Inspiration={id:string;name:string;description:string;style:string;colorFamily:string;occasion:string;nails:Nail[]}
type Recipe={id:string;name:string;description:string;style:string;colorFamily:string;occasion:string;colors:string[];finish:Nail['finish'];pattern:Nail['pattern'];pearl?:boolean;cat?:Nail['surface']['catStyle']}
const recipes:Recipe[]=[
 {id:'rose-letter',name:'玫瑰的来信',description:'奶粉与豆沙，搭配细边法式。',style:'温柔',colorFamily:'粉裸',occasion:'日常',colors:['#C98996','#E8CCC2','#B65C70'],finish:'gloss',pattern:'french'},
 {id:'moon-purple',name:'月光落在指尖',description:'深浅紫交替，用柔和猫眼留一点光。',style:'轻奢',colorFamily:'紫色',occasion:'约会',colors:['#67527B','#B5A1C5','#8C729E'],finish:'cat',pattern:'none',cat:'velvet'},
 {id:'matcha',name:'抹茶与奶油',description:'奶油色打底，墨绿波点做点缀。',style:'俏皮',colorFamily:'绿色',occasion:'日常',colors:['#84917A','#F4E9D8','#365B52'],finish:'gloss',pattern:'dots'},
 {id:'sea-letter',name:'海边的一封信',description:'雾蓝与深海蓝，加入柔和渐变。',style:'清爽',colorFamily:'蓝色',occasion:'旅行',colors:['#8AA8B8','#E1E8E8','#385C7A'],finish:'gloss',pattern:'gradient'},
 {id:'ruby-night',name:'微醺酒红',description:'酒红猫眼与裸粉相间，一颗珍珠收尾。',style:'轻奢',colorFamily:'红色',occasion:'聚会',colors:['#711D29','#E8CCC2','#98324B'],finish:'cat',pattern:'none',cat:'diagonal',pearl:true},
 {id:'oat',name:'燕麦拿铁',description:'柔和棕裸色，用哑光和细线收住层次。',style:'简约',colorFamily:'粉裸',occasion:'通勤',colors:['#C1A083','#EEE0CC','#98694F'],finish:'matte',pattern:'lines'},
 {id:'peach-jelly',name:'蜜桃果冻',description:'透亮蜜桃粉，留两片轻柔晕染。',style:'温柔',colorFamily:'粉裸',occasion:'约会',colors:['#D69782','#EBC6BE','#C98996'],finish:'jelly',pattern:'gradient'},
 {id:'forest',name:'森林漫步',description:'深绿配鼠尾草绿，用奶油细线提亮。',style:'简约',colorFamily:'绿色',occasion:'通勤',colors:['#365B52','#84917A','#D7BE9B'],finish:'gloss',pattern:'lines'},
 {id:'silver',name:'银色夜航',description:'银灰和墨色交替，细边法式更利落。',style:'甜酷',colorFamily:'黑白灰',occasion:'聚会',colors:['#A5ABAD','#303238','#D9DEE2'],finish:'chrome',pattern:'french'},
 {id:'lilac',name:'紫丁香汽水',description:'淡紫细闪，配小颗白色波点。',style:'俏皮',colorFamily:'紫色',occasion:'旅行',colors:['#B5A1C5','#E8DBED','#8C729E'],finish:'glitter',pattern:'dots'},
 {id:'ivory',name:'奶白珍珠',description:'奶白与裸粉法式，少量珍珠点缀。',style:'温柔',colorFamily:'粉裸',occasion:'约会',colors:['#F4E9D8','#E8CCC2','#D7BE9B'],finish:'gloss',pattern:'french',pearl:true},
 {id:'blue-hour',name:'蓝调时刻',description:'蓝色光环猫眼与浅灰交替。',style:'清爽',colorFamily:'蓝色',occasion:'聚会',colors:['#385C7A','#A5ABAD','#8AA8B8'],finish:'cat',pattern:'none',cat:'halo'},
]
export const inspirationCatalog:Inspiration[]=recipes.map((r,ri)=>({...r,nails:Array.from({length:10},(_,i)=>{
 const slot=[0,1,0,2,1,0,2,0,1,1][i],n=baseNail(),accent=i%5===1||i%5===3
 return nailSchema.parse({...n,color:r.colors[slot],accent:r.id==='matcha'?'#365B52':'#FFF7E9',finish:r.finish,opacity:r.finish==='jelly'?.75:1,pattern:accent?r.pattern:'none',patternSize:r.pattern==='lines'?10:r.pattern==='dots'?15:18,surface:{...n.surface,catStyle:r.cat||'ribbon',shine:r.finish==='matte'?25:72,sparkle:r.finish==='glitter'?35:20},decorations:r.pearl&&i%5===3?[{id:`00000000-0000-4000-8000-${String(ri*10+i).padStart(12,'0')}`,type:'pearl',x:55,y:115,size:7,locked:false}]:[]})
})}))
export function filterInspirations(filters:{query:string;style:string;colorFamily:string;occasion:string}){
 const query=filters.query.trim().toLowerCase()
 return inspirationCatalog.filter(p=>(!filters.style||p.style===filters.style)&&(!filters.colorFamily||p.colorFamily===filters.colorFamily)&&(!filters.occasion||p.occasion===filters.occasion)&&(!query||[p.name,p.description,p.style,p.colorFamily,p.occasion].join(' ').toLowerCase().includes(query)))
}
export function hasInspirationLock(n:Nail){return n.lockedLayers.length>0||n.decorations.some(d=>d.locked)||n.patternLayers.some(l=>l.locked)}
export function applyInspirationSet(design:Design,p:Inspiration,options:{mode:'all'|'single';selected:number;source:number;keepShape:boolean;keep:number[]}){
 const changed:number[]=[],retained:number[]=[]
 const nails=design.nails.map((n,i)=>{
  if(options.mode==='single'&&i!==options.selected)return n
  if(options.keep.includes(i)||hasInspirationLock(n)){retained.push(i);return n}
  let next=structuredClone(p.nails[options.mode==='single'?options.source:i])
  if(options.keepShape)next={...next,shape:n.shape,variant:n.variant,length:n.length}
  if(JSON.stringify(n)!==JSON.stringify(next))changed.push(i)
  return next
 })
 return {design:{...design,name:options.mode==='all'&&changed.length?p.name:design.name,nails},changed,retained}
}
