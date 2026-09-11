import { z } from 'zod'
import {surfaceSchema,patternSettingsSchema,patternLayerSchema,defaultSurface,defaultPatternSettings} from './effects.js'

export const shapes = ['round', 'oval', 'almond', 'square', 'coffin'] as const
export const finishes = ['gloss', 'jelly', 'matte', 'glitter', 'chrome', 'cat'] as const
export const patterns = ['none', 'french', 'gradient', 'dots', 'lines'] as const
export const artworkIds = ['ruby-gold','blush-foil','ruby-pearl','ivory-rose','ruby-studs'] as const
const color = z.string().regex(/^#[0-9a-fA-F]{6}$/)
export const decorationSchema = z.object({
  id: z.string().uuid(), type: z.enum(['pearl','gem']),
  x: z.number().min(12).max(88), y: z.number().min(20).max(140),
  size: z.number().min(5).max(18),
  locked:z.boolean().default(false),
}).strict()
export const nailSchema = z.object({
  shape: z.enum(shapes), variant: z.enum(['classic','slim']).default('classic'), length: z.enum(['short','medium','long']),
  color, accent: color, opacity: z.number().min(0.35).max(1),
  finish: z.enum(finishes), pattern: z.enum(patterns),
  patternSize: z.number().min(8).max(50), catAngle: z.number().min(-90).max(90),
  decorations: z.array(decorationSchema).max(12),
  artwork: z.enum(artworkIds).optional(),
  surface:surfaceSchema.default(defaultSurface),
  patternSettings:patternSettingsSchema.default(defaultPatternSettings),
  patternLayers:z.array(patternLayerSchema).max(12).default([]),
  lockedLayers:z.array(z.enum(['shape','base','surface','pattern','artwork'])).max(5).default([]),
}).strict().refine(n=>n.patternLayers.reduce((sum,l)=>sum+l.strokes.reduce((count,s)=>count+s.points.length,0),0)<=4096,'手绘内容过多，请精简部分笔画')
export const designSchema = z.object({
  version: z.literal(1), id: z.string().uuid(),
  name: z.string().trim().min(1).max(60), nails: z.array(nailSchema).length(10),
}).strict()
export type Nail = z.infer<typeof nailSchema>
export type PatternLayer = z.infer<typeof patternLayerSchema>
export type Design = z.infer<typeof designSchema>
export type Decoration = z.infer<typeof decorationSchema>
export type Scope = 'single'|'mirror'|'all'
export const fingerNames = ['拇指','食指','中指','无名指','小指']
export const nailName = (i: number) => `${i < 5 ? '左' : '右'}手${fingerNames[i % 5]}`
export const shapeNames: Record<Nail['shape'],string> = {round:'圆形',oval:'椭圆',almond:'杏仁',square:'方形',coffin:'梯形'}
export const finishNames: Record<Nail['finish'],string> = {gloss:'亮面',jelly:'果冻',matte:'哑光',glitter:'细闪',chrome:'镜面',cat:'猫眼'}
export const patternNames: Record<Nail['pattern'],string> = {none:'无图案',french:'法式',gradient:'渐变',dots:'波点',lines:'线条'}
export const palette = [
  ['浅粉','#E8CCC2'],['玫瑰粉','#B65C70'],['莓紫','#763F53'],['红色','#AC303B'],
  ['杏粉','#D69782'],['焦糖棕','#98694F'],['米棕','#D7BE9B'],['奶油白','#F4E9D8'],
  ['灰绿','#84917A'],['墨绿','#365B52'],['雾蓝','#8AA8B8'],['深蓝','#385C7A'],
  ['浅紫','#B5A1C5'],['深紫','#67527B'],['灰色','#A5ABAD'],['墨黑','#303238'],
] as const
export function baseNail(): Nail {
  return {shape:'oval',variant:'classic',length:'medium',color:'#C98996',accent:'#FFF7E9',opacity:1,finish:'gloss',pattern:'none',patternSize:22,catAngle:25,decorations:[],artwork:undefined,surface:defaultSurface(),patternSettings:defaultPatternSettings(),patternLayers:[],lockedLayers:[]}
}
export function newDesign(): Design {
  return {version:1,id:crypto.randomUUID(),name:'玫瑰的来信',nails:Array.from({length:10},(_,i)=>({...baseNail(),color:i%5===3?'#E8CCC2':'#C98996',pattern:i%5===1?'french':'none'}))}
}
export function targets(selected: number, scope: Scope): number[] {
  return scope==='all'?Array.from({length:10},(_,i)=>i):scope==='mirror'?[selected,(selected+5)%10]:[selected]
}
export function updateNails(design: Design, selected: number, scope: Scope, patch: Partial<Nail>): Design {
  const indexes=targets(selected,scope)
  return {...design,nails:design.nails.map((n,i)=>indexes.includes(i)?{...n,...structuredClone(patch)}:n)}
}
export function duplicateDesign(design: Design): Design {
  return {...structuredClone(design),id:crypto.randomUUID(),name:`${design.name.slice(0,55)} · 副本`}
}
export const inspirations = [
  {name:'玫瑰的来信',caption:'粉色法式',colors:['#C98996','#E8CCC2','#B65C70'],finish:'gloss',pattern:'french'},
  {name:'月光落在指尖',caption:'紫色猫眼',colors:['#67527B','#B5A1C5','#8C729E'],finish:'cat',pattern:'none'},
  {name:'抹茶与奶油',caption:'绿白波点',colors:['#84917A','#F4E9D8','#365B52'],finish:'gloss',pattern:'dots'},
  {name:'海边的一封信',caption:'蓝色渐变',colors:['#8AA8B8','#E1E8E8','#385C7A'],finish:'gloss',pattern:'gradient'},
] as const
export function applyInspiration(design: Design,index:number): Design {
  const p=inspirations[index]
  return {...design,name:p.name,nails:design.nails.map((n,i)=>({...baseNail(),shape:n.shape,variant:n.variant,length:n.length,color:p.colors[(i%5)%3],finish:p.finish,pattern:i%5===1||i%5===3?p.pattern:'none'}))}
}

export const variantNames:Record<Nail['shape'],[string,string]>={round:['自然圆','纤细圆'],oval:['经典椭圆','修长椭圆'],almond:['柔尖杏仁','纤长杏仁'],square:['经典方形','修长窄方'],coffin:['柔棺形','收尖芭蕾']}

export const atelierStyles = [
 {id:'ruby-gold',name:'酒红金线',color:'#711D29'},
 {id:'blush-foil',name:'奶粉金箔',color:'#DFAEAA'},
 {id:'ruby-pearl',name:'珍珠猫眼',color:'#711D29'},
 {id:'ivory-rose',name:'奶白玫瑰',color:'#F3E9DF'},
 {id:'ruby-studs',name:'酒红金珠',color:'#711D29'},
] as const
export function atelierNail(id:typeof artworkIds[number],length:Nail['length']='medium'):Nail {
 return {...baseNail(),artwork:id,length,color:atelierStyles.find(s=>s.id===id)!.color}
}
export function applyAtelier(design:Design):Design {
 const order=[0,1,2,3,4,0,3,2,1,4]
 return {...design,name:'玫瑰金线',nails:design.nails.map((n,i)=>atelierNail(atelierStyles[order[i]].id,n.length))}
}
