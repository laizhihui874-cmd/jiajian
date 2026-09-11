import type {ReactNode} from 'react'
import type {Nail,PatternLayer} from '../shared/design'
import {patternNames} from '../shared/design'
import {defaultPatternSettings} from '../shared/effects'
import {nailPatterns,patternPatch} from '../shared/patternLayers'
import {PatternSettingsControls} from './EffectControls'
import {Range} from './Widgets'

type Props={n:Nail;patch:(p:Partial<Nail>)=>void;active?:string;select:(id:string)=>void;drawing:boolean;start:()=>void;stop:()=>void;itemActions:(id:string)=>ReactNode}
export function PatternStackControls({n,patch,active,select,drawing,start,stop,itemActions}:Props){
 const layers=nailPatterns(n),layer=layers.find(l=>l.id===active)||layers.at(-1)
 const update=(change:Partial<PatternLayer>)=>{if(layer&&!layer.locked)patch(patternPatch(layers.map(l=>l.id===layer.id?{...l,...change}:l)))}
 function add(type:PatternLayer['type']){if(layers.length>=12)return;stop();const id=crypto.randomUUID();patch(patternPatch([...layers,{id,type,accent:type==='gradient'?'#E8CCC2':'#FFF7E9',patternSize:22,settings:defaultPatternSettings(),locked:false,drawMode:'preset',strokes:[]}]));select(id)}
 const free=layer?.drawMode==='free'
 return <section className="pattern-stack"><div className="section-title"><h3>添加图案</h3><span>{layers.length} 项</span></div><div className="choice-grid four">{(['gradient','french','dots','lines'] as const).map(type=><button disabled={layers.length>=12} key={type} onClick={()=>add(type)}>＋{patternNames[type]}</button>)}</div><p className="helper">添加新图案会保留已有内容。点击下方已有图案可继续修改。</p>
 {layers.length>=12&&<p className="helper">这根指甲已有 12 项图案，删除一项后可继续添加。</p>}{layers.length>0&&<h3>已添加图案</h3>}<div className="pattern-layer-tabs">{layers.map((l,i)=><button key={l.id} className={layer?.id===l.id?'active':''} aria-pressed={layer?.id===l.id} onClick={()=>{stop();select(l.id)}}>{i+1} · {l.drawMode==='free'?'手绘':''}{patternNames[l.type]}{l.locked?' · 已锁定':''}</button>)}</div>
 {layer?<><div className="section-title"><h3>编辑{patternNames[layer.type]}</h3></div>{layer.locked&&<p className="helper">此图案已锁定，可在下方解锁。</p>}<fieldset disabled={layer.locked}>
 {(layer.type==='dots'||layer.type==='lines')&&<div className="choice-grid two"><button className={!free?'active':''} onClick={()=>{stop();update({drawMode:'preset'})}}>预设{patternNames[layer.type]}</button><button className={free?'active':''} onClick={()=>{stop();update({drawMode:'free'})}}>手绘{layer.type==='dots'?'波点':'线条'}</button></div>}
 {free?<><label className="custom-color"><span>画笔颜色</span><input type="color" aria-label="画笔颜色" value={layer.accent} onChange={e=>update({accent:e.target.value})}/></label><Range label={layer.type==='dots'?'圆点大小':'画笔粗细'} value={layer.patternSize} min={8} max={50} onChange={patternSize=>update({patternSize})}/><Range label="画笔浓淡" value={layer.settings.opacity} min={10} max={100} suffix="%" onChange={opacity=>update({settings:{...layer.settings,opacity}})}/><button className="primary draw-start" onClick={drawing?stop:()=>{select(layer.id);start()}}>{drawing?'完成绘制':layer.strokes.length?'继续绘制':layer.type==='dots'?'开始点画':'开始画线'}</button><p className="helper">{layer.type==='dots'?'在甲面上点击放圆点。':'按住鼠标或手指，在甲面上拖动画线。'}此图案的笔画一起调色；需要另一种颜色，可以再添加一个手绘图案。每次落笔都可撤销。</p><button className="text-button" disabled={!layer.strokes.length} onClick={()=>update({strokes:layer.strokes.slice(0,-1)})}>删除此图案最后一笔</button></>:<PatternSettingsControls n={{...n,pattern:layer.type,accent:layer.accent,patternSize:layer.patternSize,patternSettings:layer.settings}} patch={change=>{
 const changed={...layer,...(change.accent?{accent:change.accent}:{}),...(change.patternSize!==undefined?{patternSize:change.patternSize}:{}),...(change.patternSettings?{settings:change.patternSettings}:{})}
 patch({...patternPatch(layers.map(l=>l.id===layer.id?changed:l)),...(change.color?{color:change.color}:{})})
 }}/>}</fieldset>{itemActions(layer.id)}</>:<p className="helper">尚未添加图案</p>}
 </section>
}
