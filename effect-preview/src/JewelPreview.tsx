import type {CSSProperties} from 'react'
import type {Design} from '../shared/design'
import {fingerNames,nailName} from '../shared/design'
import {NailArt} from './NailArt'

export function JewelPreview({design,selected,hand,onSelect,onDetail,affected=[]}:{design:Design;selected:number;hand?:'left'|'right';affected?:number[];onSelect:(i:number)=>void;onDetail:(i:number)=>void}){
 return <div className={`jewel-layout ${hand?'jewel-five':'jewel-ten'}`} aria-label={hand?'五指珠宝陈列':'十指珠宝陈列'} role="group">
  {(hand?[hand==='left'?0:1]:[0,1]).map(side=><div className="jewel-row" key={side}><span className="jewel-hand-label">{side===0?'左手':'右手'}</span>{Array.from({length:5},(_,finger)=>{
   const i=side*5+finger,nail=design.nails[i]
   return <button key={i} className={`jewel-nail ${selected===i?'selected':''} ${affected.includes(i)?'scope-affected':''}`} aria-label={`编辑${nailName(i)}`} aria-pressed={selected===i} onClick={()=>onSelect(i)} onDoubleClick={()=>onDetail(i)} style={{'--nail-scale':[.94,1,1.03,.99,.86][finger],'--nail-angle':`${[-4,-2,0,2,4][finger]}deg`} as CSSProperties}>
    <span className={`jewel-art ${nail.length}`}><NailArt nail={nail}/></span><span className="jewel-selection-dot"/><span className="jewel-finger-label">{fingerNames[finger]}</span>
   </button>
  })}</div>)}
 </div>
}
