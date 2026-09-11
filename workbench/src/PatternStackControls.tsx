import type {Nail,PatternLayer} from '../shared/design'
import {patternNames} from '../shared/design'
import {defaultPatternSettings} from '../shared/effects'
import {nailPatterns,patternPatch} from '../shared/patternLayers'
import {PatternSettingsControls} from './EffectControls'
import {Range} from './Widgets'

type Props={n:Nail;patch:(p:Partial<Nail>)=>void;active?:string;select:(id:string)=>void;drawing:boolean;start:()=>void;stop:()=>void}
export function PatternStackControls({n,patch,active,select,drawing,start,stop}:Props){
 const layers=nailPatterns(n),layer=layers.find(l=>l.id===active)||layers.at(-1)
 const update=(change:Partial<PatternLayer>)=>{if(layer&&!layer.locked)patch(patternPatch(layers.map(l=>l.id===layer.id?{...l,...change}:l)))}
 function add(type:PatternLayer['type']){if(layers.length>=12)return;stop();const id=crypto.randomUUID();patch(patternPatch([...layers,{id,type,accent:type==='gradient'?'#E8CCC2':'#FFF7E9',patternSize:22,settings:defaultPatternSettings(),locked:false,drawMode:'preset',strokes:[]}]));select(id)}
 const free=layer?.drawMode==='free'
 return <section className="pattern-stack"><div className="section-title"><h3>一层层搭配图案</h3><span>{layers.length}/12 层</span></div><div className="choice-grid four">{(['gradient','french','dots','lines'] as const).map(type=><button disabled={layers.length>=12} key={type} onClick={()=>add(type)}>＋{patternNames[type]}</button>)}</div><p className="helper">点击添加一层，不会替换已有图案。后添加的图案显示在上面。</p>
 <div className="pattern-layer-tabs">{layers.map((l,i)=><button key={l.id} className={layer?.id===l.id?'active':''} aria-pressed={layer?.id===l.id} onClick={()=>{stop();select(l.id)}}>{i+1} · {l.drawMode==='free'?'手绘':''}{patternNames[l.type]}{l.locked?' · 已锁定':''}</button>)}</div>
 {layer?<><div className="section-title"><h3>调整{patternNames[layer.type]}这一层</h3><span>前后顺序、锁定请到图层</span></div>{layer.locked&&<p className="helper">这一层已锁定，请到图层解锁后继续画。</p>}<fieldset disabled={layer.locked}>
 {(layer.type==='dots'||layer.type==='lines')&&<div className="choice-grid two"><button className={!free?'active':''} onClick={()=>{stop();update({drawMode:'preset'})}}>现成{patternNames[layer.type]}</button><button className={free?'active':''} onClick={()=>{stop();update({drawMode:'free'})}}>自己{layer.type==='dots'?'点画':'画线'}</button></div>}
 {free?<><label className="custom-color"><span>画笔颜色</span><input type="color" aria-label="画笔颜色" value={layer.accent} onChange={e=>update({accent:e.target.value})}/></label><Range label={layer.type==='dots'?'圆点大小':'画笔粗细'} value={layer.patternSize} min={8} max={50} onChange={patternSize=>update({patternSize})}/><Range label="画笔浓度" value={layer.settings.opacity} min={10} max={100} suffix="%" onChange={opacity=>update({settings:{...layer.settings,opacity}})}/><button className="primary draw-start" onClick={drawing?stop:()=>{select(layer.id);start()}}>{drawing?'完成绘画':layer.type==='dots'?'到甲面上点画':'到甲面上画线'}</button><p className="helper">{layer.type==='dots'?'在甲面上点击放圆点。':'按住鼠标或手指，在甲面上拖动画线。'}同一层的笔画一起调色；需要另一种颜色，可以再添加一层。每次落笔都可撤销。</p><button className="text-button" disabled={!layer.strokes.length} onClick={()=>update({strokes:layer.strokes.slice(0,-1)})}>撤回这一层最后一笔</button></>:<PatternSettingsControls n={{...n,pattern:layer.type,accent:layer.accent,patternSize:layer.patternSize,patternSettings:layer.settings}} patch={change=>{
 const changed={...layer,...(change.accent?{accent:change.accent}:{}),...(change.patternSize!==undefined?{patternSize:change.patternSize}:{}),...(change.patternSettings?{settings:change.patternSettings}:{})}
 patch({...patternPatch(layers.map(l=>l.id===layer.id?changed:l)),...(change.color?{color:change.color}:{})})
 }}/>}</fieldset></>:<p className="helper">先添加一层渐变或法式，再继续叠加你喜欢的细节。</p>}
 </section>
}
