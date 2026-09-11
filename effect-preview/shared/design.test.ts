import {describe,it,expect} from 'vitest'
import {applyAtelier,atelierNail,baseNail,applyInspiration,designSchema,duplicateDesign,newDesign,targets,updateNails} from './design.ts'
describe('设计编辑范围与保存边界',()=>{
 it('单指编辑不改变其他指或原始设计',()=>{const d=newDesign(),r=updateNails(d,2,'single',{color:'#123456'});expect(r.nails[2].color).toBe('#123456');expect(d.nails[2].color).not.toBe('#123456');expect(r.nails.filter((n,i)=>JSON.stringify(n)!==JSON.stringify(d.nails[i]))).toHaveLength(1)})
 it('左右对应只更新两个相同手指',()=>{expect(targets(8,'mirror')).toEqual([8,3]);const r=updateNails(newDesign(),8,'mirror',{finish:'matte'});expect(r.nails.map((n,i)=>n.finish==='matte'?i:-1).filter(i=>i>=0)).toEqual([3,8])})
 it('整套修改覆盖十指而不清掉其他属性',()=>{const d=newDesign(),r=updateNails(d,1,'all',{color:'#123456'});expect(r.nails.every(n=>n.color==='#123456')).toBe(true);expect(r.nails[1].pattern).toBe(d.nails[1].pattern)})
 it('模板完整替换旧饰品，保留用户甲型和长度',()=>{const d=newDesign();d.nails[0].shape='square';d.nails[0].length='long';d.nails[0].decorations=[{id:crypto.randomUUID(),type:'gem',locked:false,x:50,y:50,size:10}];const r=applyInspiration(d,1);expect(r.nails[0].decorations).toHaveLength(0);expect(r.nails[0].finish).toBe('cat');expect(r.nails[0].shape).toBe('square');expect(r.nails[0].length).toBe('long')})
 it('复制作品使用新编号，改副本不会修改原作',()=>{const d=newDesign(),r=duplicateDesign(d);r.nails[0].color='#000000';expect(r.id).not.toBe(d.id);expect(d.nails[0].color).not.toBe(r.nails[0].color)})
 it('拒绝缺少指甲、非法颜色、越界饰品和未知版本',()=>{const d=newDesign();expect(designSchema.safeParse(d).success).toBe(true);expect(designSchema.safeParse({...d,nails:d.nails.slice(0,9)}).success).toBe(false);expect(designSchema.safeParse({...d,version:2}).success).toBe(false);d.nails[0].color='url(https://example.com)';expect(designSchema.safeParse(d).success).toBe(false);d.nails[0].color='#123456';d.nails[0].decorations=[{id:crypto.randomUUID(),type:'gem',locked:false,x:-1,y:50,size:10}];expect(designSchema.safeParse(d).success).toBe(false)})
})
it('opens earlier saved designs with the classic shape branch',()=>{const old=JSON.parse(JSON.stringify(newDesign()));for(const n of old.nails)delete n.variant;const restored=designSchema.parse(old);expect(restored.nails.every(n=>n.variant==='classic')).toBe(true)})
it('keeps the chosen shape branch when a color inspiration is applied',()=>{const d=updateNails(newDesign(),1,'single',{shape:'square',variant:'slim'});expect(applyInspiration(d,2).nails[1]).toMatchObject({shape:'square',variant:'slim'})})
it('成品系列保存再打开保留十指款式，并拒绝未知素材地址',()=>{
 const design=applyAtelier(newDesign()),restored=designSchema.parse(JSON.parse(JSON.stringify(design)))
 expect(restored.nails.map(n=>n.artwork)).toEqual(['ruby-gold','blush-foil','ruby-pearl','ivory-rose','ruby-studs','ruby-gold','ivory-rose','ruby-pearl','blush-foil','ruby-studs'])
 expect(designSchema.safeParse({...restored,nails:restored.nails.map(n=>({...n,artwork:'https://unknown/image.png'}))}).success).toBe(false)
})
it('单款套用尊重左右对应范围，换回基础甲片和旧灵感清除成品图案',()=>{
 const design=newDesign(),paired=updateNails(design,3,'mirror',atelierNail('ivory-rose'))
 expect(paired.nails.flatMap((n,i)=>n.artwork?[i]:[])).toEqual([3,8])
 expect(updateNails(paired,3,'single',baseNail()).nails[3].artwork).toBeUndefined()
 expect(applyInspiration(paired,0).nails.every(n=>!n.artwork)).toBe(true)
 expect(design.nails.every(n=>!n.artwork)).toBe(true)
})
