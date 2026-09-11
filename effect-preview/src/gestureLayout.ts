import type {Nail} from '../shared/design'

export type Arrangement = 'jewel' | 'cupped' | 'original'
// Nail centers and axes follow the approved palm-facing reference photograph.
const positions = [
 {x:120,y:160,h:172,angle:55}, {x:280,y:120,h:180,angle:27},
 {x:341,y:240,h:185,angle:35}, {x:375,y:345,h:174,angle:40},
 {x:415,y:430,h:145,angle:49}, {x:985,y:310,h:153,angle:-42},
 {x:843,y:350,h:166,angle:-27}, {x:787,y:457,h:164,angle:-35},
 {x:755,y:565,h:152,angle:-39}, {x:710,y:625,h:133,angle:-50},
]
export function gestureLayout(hand?:'left'|'right') {
 const first=hand==='right'?5:0
 const nails=positions.map((p,index)=>({...p,index})).slice(first,hand?first+5:10)
 if(!hand)return {width:1090,height:750,nails}
 const minX=Math.min(...nails.map(p=>p.x))-125,minY=Math.min(...nails.map(p=>p.y))-120
 return {width:Math.max(...nails.map(p=>p.x))-minX+125,height:Math.max(...nails.map(p=>p.y))-minY+120,nails:nails.map(p=>({...p,x:p.x-minX,y:p.y-minY}))}
}
export function gestureNailSize(height:number,length:Nail['length']) {
 return {width:height*.61,height:height*({short:.85,medium:1,long:1.13}[length])}
}
