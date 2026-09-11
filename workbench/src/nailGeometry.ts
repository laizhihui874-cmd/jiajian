import {BufferGeometry,Float32BufferAttribute} from 'three'

// A thin curved shell: the free edge keeps its C curve instead of closing into a seed.
export function createNailGeometry(shape='oval',variant='classic'){
 const segments=96,rings=28,positions:number[]=[],uvs:number[]=[],indices:number[]=[]
 const surfaceCount=(rings+1)*segments
 for(let side=0;side<2;side++)for(let ring=0;ring<=rings;ring++)for(let s=0;s<segments;s++){
  const a=s/segments*Math.PI*2,r=ring/rings,c=Math.cos(a),q=Math.sin(a)
  const square=shape==='square'||shape==='coffin',almond=shape==='almond'
  const y=r*1.48*Math.sign(q)*Math.abs(q)**(q<0?.48:square?.22:almond?1.05:shape==='round'?.65:.84)
  const taper=shape==='coffin'?1-.23*Math.max(0,y/1.48):almond?1-.22*Math.max(0,y/1.48):1-.035*y/1.48
  const x=r*.77*Math.sign(c)*Math.abs(c)**(square?.3:almond?1.23:.9)*taper*(variant==='slim'?.85:1)
  const z=.075+.27*(1-(x/.8)**2)-.045*(y/1.48)**2-side*.045
  positions.push(x,y,z);uvs.push(x/1.6+.5,y/2.96+.5)
 }
 for(let side=0;side<2;side++)for(let r=0;r<rings;r++)for(let s=0;s<segments;s++){
  const a=side*surfaceCount+r*segments+s,b=side*surfaceCount+r*segments+(s+1)%segments,c=a+segments,d=b+segments
  if(side===0)indices.push(a,c,b,b,c,d);else indices.push(a,b,c,b,d,c)
 }
 for(let s=0;s<segments;s++){
  const a=rings*segments+s,b=rings*segments+(s+1)%segments
  indices.push(a,b,a+surfaceCount,b,b+surfaceCount,a+surfaceCount)
 }
 const geometry=new BufferGeometry()
 geometry.setAttribute('position',new Float32BufferAttribute(positions,3));geometry.setAttribute('uv',new Float32BufferAttribute(uvs,2))
 geometry.setIndex(indices);geometry.computeVertexNormals();geometry.computeBoundingSphere()
 return geometry
}
