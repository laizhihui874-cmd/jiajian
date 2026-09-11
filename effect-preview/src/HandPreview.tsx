import {useEffect,useRef,useState} from 'react'
import type {Design,Nail} from '../shared/design'
import {createHandScene,handSkinTones} from './handScene'
import './HandPreview.css'

export function HandPreview({design,side,selected,onSelect}:{design:Design;side:'left'|'right';selected:number;onSelect:(index:number)=>void}){
 const host=useRef<HTMLDivElement>(null),selectRef=useRef(onSelect)
 selectRef.current=onSelect
 const [engine,setEngine]=useState<ReturnType<typeof createHandScene>|null>(null)
 const [status,setStatus]=useState<'loading'|'ready'|'error'>('loading')
 const [retry,setRetry]=useState(0),[skin,setSkin]=useState(1)
 const offset=side==='right'?5:0,source=JSON.stringify(design.nails.slice(offset,offset+5))
 useEffect(()=>{
  if(!host.current)return
  setStatus('loading')
  try{
   const scene=createHandScene(host.current,index=>selectRef.current(index),setStatus)
   setEngine(scene)
   return()=>scene.dispose()
  }catch{setEngine(null);setStatus('error')}
 },[retry])
 useEffect(()=>{if(engine)void engine.update(JSON.parse(source) as Nail[],side)},[engine,source,side])
 useEffect(()=>{engine?.select(selected)},[engine,selected])
 useEffect(()=>{engine?.skin(handSkinTones[skin].color)},[engine,skin])
 return <div className="hand-preview modeled-hand" role="group" aria-label={`${side==='left'?'左':'右'}手三维上手预览`} aria-busy={status==='loading'}>
  <div ref={host} className="hand-scene"/>
  <div className="hand-view-controls" aria-label="观看角度">
   <button type="button" disabled={status!=='ready'} onClick={()=>engine?.view('angle')}>斜侧面</button>
   <button type="button" disabled={status!=='ready'} onClick={()=>engine?.view('front')}>正面归位</button>
  </div>
  <div className="hand-skin-controls" role="group" aria-label="手模肤色">
   <span>肤色</span>
   {handSkinTones.map((tone,index)=><button key={tone.name} type="button" aria-label={tone.name} aria-pressed={skin===index} title={tone.name} onClick={()=>setSkin(index)}><span style={{background:tone.color}}/></button>)}
  </div>
  {status!=='ready'&&<div className={`hand-preview-status ${status==='error'?'is-error':''}`} role={status==='error'?'alert':'status'}>
   {status==='error'?<><span>三维上手预览暂时没有载入</span><button type="button" onClick={()=>setRetry(value=>value+1)}>重新载入</button></>:<span>正在呈现三维上手效果…</span>}
  </div>}
 </div>
}
