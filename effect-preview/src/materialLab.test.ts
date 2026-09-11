import {describe,it,expect} from 'vitest'
import {createNailGeometry} from './nailGeometry'
import {defaultMaterialSettings,parseMaterialSettings} from './materialLabSettings'

describe('local material study',()=>{
 it('recovers from missing, damaged or out-of-range saved controls',()=>{
  for(const value of [null,'{broken','null',JSON.stringify({...defaultMaterialSettings,width:0}),JSON.stringify({...defaultMaterialSettings,color:'url(https://invalid)'})])expect(parseMaterialSettings(value)).toEqual(defaultMaterialSettings)
 })
 it('preserves a customized study and supplies the new density control for older studies',()=>{
  const custom={...defaultMaterialSettings,finish:'jelly' as const,color:'#23564D',density:24,angle:-66}
  expect(parseMaterialSettings(JSON.stringify(custom))).toEqual(custom)
  const {density:_,...old}=custom
  expect(parseMaterialSettings(JSON.stringify(old)).density).toBe(55)
 })
 it('builds a finite, thin, curved nail shell with outward front normals',()=>{
  const geometry=createNailGeometry(),position=geometry.getAttribute('position'),normal=geometry.getAttribute('normal')
  expect(Array.from(position.array).every(Number.isFinite)).toBe(true)
  expect(Array.from(normal.array).every(Number.isFinite)).toBe(true)
  const half=position.count/2
  for(let i=0;i<half;i++){
   expect(position.getZ(i)-position.getZ(i+half)).toBeCloseTo(.045,5)
   if(i>96&&i<half-96)expect(normal.getZ(i)).toBeGreaterThan(0)
  }
  geometry.computeBoundingBox();const box=geometry.boundingBox!
  expect(box.max.z-box.min.z).toBeLessThan(.4)
  expect(box.max.y-box.min.y).toBeGreaterThan(1.8*(box.max.x-box.min.x))
  geometry.dispose()
 })
})
