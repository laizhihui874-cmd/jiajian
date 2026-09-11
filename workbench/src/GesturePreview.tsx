import type {Design} from '../shared/design'
import {nailName} from '../shared/design'
import {NailArt} from './NailArt'
import {gestureLayout,gestureNailSize} from './gestureLayout'

export function GesturePreview({design,selected,hand,onSelect,onDetail}:{design:Design;selected:number;hand?:'left'|'right';onSelect:(i:number)=>void;onDetail:(i:number)=>void}){
 const layout=gestureLayout(hand)
 return <div className="gesture-layout" role="group" aria-label="手心轻拢排列"><div className="gesture-board" style={{width:`min(100cqw, ${layout.width/layout.height*100}cqh)`,aspectRatio:`${layout.width}/${layout.height}`}}>
  {layout.nails.map(p=>{const nail=design.nails[p.index],size=gestureNailSize(p.h,nail.length);return <button key={p.index} className={`gesture-nail ${selected===p.index?'selected':''}`} aria-label={`编辑${nailName(p.index)}`} aria-pressed={selected===p.index} title={nailName(p.index)} onClick={()=>onSelect(p.index)} onDoubleClick={()=>onDetail(p.index)} style={{left:`${p.x/layout.width*100}%`,top:`${p.y/layout.height*100}%`,width:`${size.width/layout.width*100}%`,height:`${size.height/layout.height*100}%`,transform:`translate(-50%,-50%) rotate(${p.angle}deg)`}}><NailArt nail={nail}/>{selected===p.index&&<span className="gesture-pin"/>}</button>})}
 </div></div>
}
