import {describe,it,expect} from 'vitest'
import {atelierNail,baseNail,designSchema,newDesign} from './design.js'
import {designSummary,previewWithoutLayers,updateEditableNails} from './designDetails.js'

describe('editable materials and composition',()=>{
 it('opens old saved works with new defaults and round-trips customized effects',()=>{
  const design=newDesign(),old=JSON.parse(JSON.stringify(design))
  old.nails.forEach((n:Record<string,unknown>)=>{delete n.surface;delete n.patternSettings;delete n.lockedLayers})
  expect(designSchema.parse(old).nails[0].surface.catStyle).toBe('ribbon')
  design.nails[2]={...baseNail(),finish:'jelly',pattern:'gradient',patternSettings:{...baseNail().patternSettings,gradientStyle:'aura',position:68,softness:23}}
  expect(designSchema.parse(JSON.parse(JSON.stringify(design)))).toEqual(design)
  expect(()=>designSchema.parse({...design,nails:design.nails.map(n=>({...n,surface:{...n.surface,catWidth:0}}))})).toThrow()
 })
 it('preserves locked fingers under bulk edits while changing unlocked fingers',()=>{
  const design=newDesign();design.nails[1].lockedLayers=['surface']
  const updated=updateEditableNails(design,1,'all',{finish:'cat'})
  expect(updated.nails[1].finish).toBe(design.nails[1].finish)
  expect(updated.nails.filter(n=>n.finish==='cat')).toHaveLength(9)
  expect(design.nails[0].finish).toBe('gloss')
 })
 it('keeps locked ornaments when replacing a style and does not let a patch unlock layers',()=>{
  const design=newDesign(),d={id:crypto.randomUUID(),type:'pearl' as const,x:50,y:78,size:8,locked:true}
  design.nails[0].decorations=[d]
  expect(updateEditableNails(design,0,'single',atelierNail('ruby-gold')).nails[0].decorations).toEqual([d])
  design.nails[0].lockedLayers=['pattern']
  expect(updateEditableNails(design,0,'single',{lockedLayers:[]}).nails[0].lockedLayers).toEqual(['pattern'])
 })
 it('uses an independent preview for hiding layers without changing the document or price',()=>{
  const design=newDesign();design.nails[0]={...baseNail(),finish:'cat',pattern:'french'}
  const before=JSON.stringify(design),price=designSummary(design).total
  const hidden=previewWithoutLayers(design.nails[0],['surface','pattern'])
  expect(hidden.finish).toBe('gloss');expect(hidden.pattern).toBe('none')
  expect(JSON.stringify(design)).toBe(before);expect(designSummary(design).total).toBe(price)
 })
})
describe('clearly fictional whole-set estimate',()=>{
 it('charges the base once, groups actual nails and ignores light and position adjustments',()=>{
  const design={...newDesign(),nails:Array.from({length:10},baseNail)}
  design.nails[0].finish='cat';design.nails[5].finish='cat';design.nails[2].pattern='french'
  expect(designSummary(design).total).toBe(41)
  expect(designSummary(design).lines.find(l=>l.label==='猫眼色胶')?.quantity).toBe(2)
  design.nails[0].catAngle=-82;design.nails[0].surface.catStyle='halo';design.nails[2].patternSettings.curve=90
  expect(designSummary(design).total).toBe(41)
 })
 it('does not double-count embedded artwork; deleting an extra ornament removes only its charge',()=>{
  const design={...newDesign(),nails:Array.from({length:10},baseNail)}
  design.nails[0]={...atelierNail('ivory-rose'),finish:'cat',pattern:'french',decorations:[{id:crypto.randomUUID(),type:'gem',x:50,y:78,size:8,locked:false}]}
  expect(designSummary(design).total).toBe(41)
  design.nails[0].decorations=[]
  expect(designSummary(design).total).toBe(38)
 })
})
