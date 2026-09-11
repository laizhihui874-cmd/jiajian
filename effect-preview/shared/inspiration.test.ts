import {describe,it,expect} from 'vitest'
import {designSchema,newDesign} from './design.js'
import {applyInspirationSet,filterInspirations,inspirationCatalog} from './inspiration.js'
const options={mode:'all' as const,selected:1,source:0,keepShape:true,keep:[] as number[]}
describe('灵感库',()=>{
 it('每套十指款式都符合保存规则且有独立内容',()=>{for(const p of inspirationCatalog){expect(designSchema.safeParse({...newDesign(),nails:p.nails}).success).toBe(true);expect(new Set(p.nails.map(n=>n.color)).size).toBeGreaterThan(1)}expect(new Set(inspirationCatalog.map(p=>p.id)).size).toBe(12)})
 it('筛选同时匹配关键词与条件，空结果不会回退全部',()=>{expect(filterInspirations({query:'猫眼',style:'轻奢',colorFamily:'红色',occasion:'聚会'}).map(x=>x.id)).toEqual(['ruby-night']);expect(filterInspirations({query:'不存在',style:'',colorFamily:'',occasion:''})).toEqual([])})
 it('套用保留设计身份、甲型和长度且不会修改原设计',()=>{const d=newDesign();d.nails[0].shape='square';d.nails[0].length='short';const before=structuredClone(d);const r=applyInspirationSet(d,inspirationCatalog[4],options);expect(r.design.id).toBe(d.id);expect(r.design.nails[0].shape).toBe('square');expect(r.design.nails[0].length).toBe('short');expect(d).toEqual(before);expect(designSchema.safeParse(r.design).success).toBe(true)})
 it('仅借用指定来源到当前指，不改其他九指和作品名',()=>{const d=newDesign(),r=applyInspirationSet(d,inspirationCatalog[4],{...options,mode:'single',selected:8,source:3});expect(r.changed).toEqual([8]);expect(r.design.name).toBe(d.name);expect(r.design.nails[8].decorations).toHaveLength(1);expect(r.design.nails.filter((_,i)=>i!==8)).toEqual(d.nails.filter((_,i)=>i!==8))})
 it('整指保留与各类锁定内容不被替换',()=>{const d=newDesign();d.nails[0].lockedLayers=['base'];d.nails[1].decorations=[{id:crypto.randomUUID(),type:'gem',x:50,y:50,size:8,locked:true}];d.nails[2].patternLayers=[{id:'locked',type:'dots',accent:'#ffffff',patternSize:15,settings:d.nails[2].patternSettings,locked:true,drawMode:'preset',strokes:[]}];const r=applyInspirationSet(d,inspirationCatalog[4],{...options,keep:[3]});expect(r.retained).toEqual([0,1,2,3]);expect(r.design.nails.slice(0,4)).toEqual(d.nails.slice(0,4))})
 it('全部保留时不会改名或产生可套用的修改',()=>{const d=newDesign(),r=applyInspirationSet(d,inspirationCatalog[4],{...options,keep:Array.from({length:10},(_,i)=>i)});expect(r.changed).toEqual([]);expect(r.design).toEqual(d)})
})
