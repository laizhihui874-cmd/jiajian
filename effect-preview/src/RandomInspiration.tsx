import {useState} from 'react'
import type {Design} from '../shared/design'
import {nailName,finishNames} from '../shared/design'
import {hasInspirationLock} from '../shared/inspiration'
import {generateInspiration,inspirationFamilies,inspirationMoods,inspirationIntensities} from '../shared/randomInspiration'
import type {Family,GeneratedInspiration,Mood,Intensity} from '../shared/randomInspiration'
import {NailArt} from './NailArt'
export function RandomInspiration({design,ready,onApply}:{design:Design;ready:boolean;onApply:(d:Design,mode:'all'|'single')=>void}){
 const [mood,setMood]=useState<Mood|''>(''),[family,setFamily]=useState<Family|''>('')
 const [intensity,setIntensity]=useState<Intensity>('大胆')
 const [history,setHistory]=useState<GeneratedInspiration[]>([]),[cursor,setCursor]=useState(-1),[keep,setKeep]=useState<number[]>([])
 const current=history[cursor]
 // Locks belong to the live work, so a stale preview never overwrites them.
 const preview=current?{...current.design,id:design.id,nails:current.design.nails.map((n,i)=>hasInspirationLock(design.nails[i])?design.nails[i]:n)}:design
 const changed=preview.nails.filter((n,i)=>JSON.stringify(n)!==JSON.stringify(design.nails[i])).length
 const allKept=design.nails.every((n,i)=>hasInspirationLock(n)||keep.includes(i))
 function generate(variation:'similar'|'different'){
  const seed=crypto.getRandomValues(new Uint32Array(1))[0]
  const next=generateInspiration(design,{seed,intensity,mood:mood||undefined,family:family||undefined,variation,previous:current?{...current,design:preview}:undefined,keep})
  setHistory(old=>[...old.slice(0,cursor+1),next].slice(-20));setCursor(Math.min(cursor+1,19))
 }
 return <div className="random-inspiration">
 <p className="inspo-intro">给你一套新的搭配。喜欢哪几指就保留，让其余的继续变化。</p>
 <div className="random-preferences"><label>搭配张力<select aria-label="搭配张力" value={intensity} onChange={e=>setIntensity(e.target.value as Intensity)}>{inspirationIntensities.map(x=><option key={x}>{x}</option>)}</select></label><label>想要的感觉<select aria-label="生成风格" value={mood} onChange={e=>setMood(e.target.value as Mood|'')}><option value="">交给你搭配</option>{inspirationMoods.map(x=><option key={x}>{x}</option>)}</select></label><label>偏好的色系<select aria-label="生成色系" value={family} onChange={e=>setFamily(e.target.value as Family|'')}><option value="">不限色系</option>{inspirationFamilies.map(x=><option key={x}>{x}</option>)}</select></label></div>
 <div className="random-actions"><button className="primary" disabled={!ready||allKept} onClick={()=>generate('different')}>{current?'换个方向':'给我一个灵感'}</button>{current&&<button className="ghost" disabled={!ready||allKept} onClick={()=>generate('similar')}>沿着这个感觉变化</button>}</div>
 <p className="random-help">{current?'“沿着这个感觉”保留本套配色；“换个方向”按上方偏好重新搭配。':'撞色、明暗反差、图案和宝石相互呼应；左右手错位搭配。'}</p>
 {current?<><div className="random-result"><strong>{current.family} · {current.intensity} · {finishNames[current.finish]} · {current.concept}</strong><div className="random-swatches" aria-label="本套配色">{current.colors.map(c=><span key={c} style={{background:c}}/>)}</div><div className="random-history"><button className="ghost" disabled={cursor<=0} onClick={()=>setCursor(cursor-1)}>上一套</button><span>{cursor+1} / {history.length}</span><button className="ghost" disabled={cursor>=history.length-1} onClick={()=>setCursor(cursor+1)}>下一套</button></div></div>
 <div className="inspo-preview-title"><strong>新灵感预览</strong><span>点击保留的是眼前这一片，不会换回原款</span></div></>:<div className="inspo-preview-title"><strong>你当前的搭配</strong><span>也可以先保留几指，再生成</span></div>}
 <div className="inspo-preview">{[0,1].map(hand=><div className="inspo-hand" key={hand}><span>{hand?'右手':'左手'}</span>{preview.nails.slice(hand*5,hand*5+5).map((n,i)=>{const idx=hand*5+i,locked=hasInspirationLock(design.nails[idx]),held=locked||keep.includes(idx);return <button key={idx} aria-label={`${held?'已保留':'保留'}${nailName(idx)}`} aria-pressed={held} disabled={locked} className={held?'retained':''} onClick={()=>setKeep(old=>old.includes(idx)?old.filter(x=>x!==idx):[...old,idx])}><NailArt nail={n}/><small>{nailName(idx).slice(2)}</small><em>{locked?'已锁定':held?'已保留':''}</em></button>})}</div>)}</div>
 <div className="random-retained"><span>{allKept?'十指都已保留，释放几指后才能继续变化。':'保留甲型和长度；已锁定的手指不变。'}</span>{keep.length>0&&<button className="text-button" onClick={()=>setKeep([])}>释放手动保留的指甲</button>}</div>
 <p className="inspo-apply-note">生成和翻看都不会改动作品。{current?`应用后修改 ${changed} 指，可以撤销恢复。`:''} 本次打开期间可回看最近 20 套。</p>
 {current&&<div className="inspo-apply"><button className="primary" disabled={!ready||!changed} onClick={()=>onApply(preview,'all')}>用这套开始设计</button></div>}
 </div>
}
