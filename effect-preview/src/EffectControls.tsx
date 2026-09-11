import {baseNail,finishes,finishNames} from '../shared/design'
import type {Nail} from '../shared/design'
import {NailArt} from './NailArt'
import {Range} from './Widgets'

type Props={n:Nail;patch:(p:Partial<Nail>)=>void}
export function SurfaceControls({n,patch}:{n:Nail;patch:(p:Partial<Nail>)=>void}){
 const s=n.surface,change=(p:Partial<Nail['surface']>)=>patch({surface:{...s,...p}})
 return <fieldset className="surface-controls" disabled={n.lockedLayers.includes('surface')}><div className="section-title material-heading"><h3>质感</h3><span>{finishNames[n.finish]}</span></div><div className="material-card-grid">{finishes.map(f=><button key={f} aria-label={`质感：${finishNames[f]}`} aria-pressed={n.finish===f} className={n.finish===f?'active':''} onClick={()=>patch({finish:f})}><NailArt nail={{...baseNail(),color:n.color,finish:f}}/><span>{finishNames[f]}</span></button>)}</div><details className="fine-options"><summary>光泽细调</summary><Range label={n.finish==='matte'?'柔雾程度':'表面光泽'} value={s.shine} min={0} max={100} suffix="%" onChange={shine=>change({shine})}/></details>
 {n.finish==='jelly'&&<p className="helper">在“颜色”中调整颜色浓淡，改变透色深浅。</p>}
 {n.finish==='cat'&&<div className="effect-detail"><h3>猫眼光效</h3><div className="choice-grid three">{([{id:'straight',name:'直线猫眼',angle:0},{id:'diagonal',name:'斜线猫眼',angle:35},{id:'halo',name:'圆形猫眼',angle:0},{id:'velvet',name:'宽光猫眼',angle:0},{id:'french',name:'法式猫眼',angle:0},{id:'cross',name:'十字猫眼',angle:0},{id:'spot',name:'聚光猫眼',angle:0}] as const).map(x=><button key={x.id} aria-pressed={(s.catStyle===x.id||(s.catStyle==='ribbon'&&x.id==='diagonal'))} className={(s.catStyle===x.id||(s.catStyle==='ribbon'&&x.id==='diagonal'))?'active':''} onClick={()=>patch({catAngle:x.angle,surface:{...s,catStyle:x.id}})}>{x.name}</button>)}</div><details className="fine-options"><summary>调整猫眼光带</summary>{!['halo','spot','french'].includes(s.catStyle)&&<Range label="猫眼光带方向" value={n.catAngle} min={-90} max={90} suffix="°" onChange={catAngle=>patch({catAngle})}/>}<Range label="猫眼光带宽度" value={s.catWidth} min={8} max={80} onChange={catWidth=>change({catWidth})}/><Range label="猫眼光带强度" value={s.catStrength} min={0} max={100} suffix="%" onChange={catStrength=>change({catStrength})}/><Range label="猫眼光带位置" value={s.catPosition} min={-60} max={60} onChange={catPosition=>change({catPosition})}/></details><p className="helper">单甲页的“摇光对照”会移动展示灯光；作品设计保持不变。</p></div>}
 {n.finish==='glitter'&&<details className="fine-options"><summary>闪亮程度</summary><Range label="闪粉亮度" value={s.sparkle} min={0} max={100} suffix="%" onChange={sparkle=>change({sparkle})}/></details>}
 </fieldset>
}
export function PatternSettingsControls({n,patch}:Props){
 const p=n.patternSettings,change=(next:Partial<Nail['patternSettings']>)=>patch({patternSettings:{...p,...next}})
 if(n.pattern==='none')return null
 return <>
 <label className="custom-color"><span>{n.pattern==='gradient'?'渐变色':'图案颜色'}</span><input type="color" aria-label="图案颜色" value={n.accent} onChange={e=>patch({accent:e.target.value})}/></label>
 {n.pattern==='french'&&<><div className="choice-grid two">{([{id:'smile',label:'微笑法式'},{id:'deep',label:'深弧法式'},{id:'diagonal',label:'斜切法式'},{id:'double',label:'双线法式'}] as const).map(x=><button key={x.id} aria-pressed={p.frenchStyle===x.id} className={p.frenchStyle===x.id?'active':''} onClick={()=>change({frenchStyle:x.id})}>{x.label}</button>)}</div><Range label="法式宽度" value={n.patternSize} min={8} max={50} onChange={patternSize=>patch({patternSize})}/></>}
 {n.pattern==='gradient'&&<div className="choice-grid two">{([{id:'linear',label:'双色渐变'},{id:'aura',label:'中心腮红'}] as const).map(x=><button key={x.id} aria-pressed={p.gradientStyle===x.id} className={p.gradientStyle===x.id?'active':''} onClick={()=>change({gradientStyle:x.id})}>{x.label}</button>)}</div>}
 {n.pattern==='dots'&&<><div className="choice-grid two">{(['regular','scatter'] as const).map(style=><button key={style} className={p.dotsStyle===style?'active':''} aria-pressed={p.dotsStyle===style} onClick={()=>change({dotsStyle:style})}>{style==='regular'?'规则波点':'错落波点'}</button>)}</div><Range label="波点大小" value={n.patternSize} min={8} max={50} onChange={patternSize=>patch({patternSize})}/></>}
 {n.pattern==='lines'&&<><div className="choice-grid two">{(['straight','wave'] as const).map(style=><button key={style} className={p.linesStyle===style?'active':''} aria-pressed={p.linesStyle===style} onClick={()=>change({linesStyle:style})}>{style==='straight'?'直线':'曲线'}</button>)}</div><Range label="线条粗细" value={n.patternSize} min={8} max={50} onChange={patternSize=>patch({patternSize})}/></>}
 <details className="fine-options" key={n.pattern}><summary>更多细节</summary>
 {n.pattern==='french'&&p.frenchStyle!=='diagonal'&&<Range label="弧度" value={p.curve} min={0} max={100} onChange={curve=>change({curve})}/>}
 {n.pattern==='gradient'&&<><button className="text-button" onClick={()=>patch({color:n.accent,accent:n.color})}>交换底色与渐变色</button><p className="helper">交换会同时改变这根指甲的底色。</p><Range label="渐变柔和度" value={p.softness} min={5} max={100} onChange={softness=>change({softness})}/></>}
 {(n.pattern==='dots'||n.pattern==='lines')&&<Range label="间距" value={p.spacing} min={12} max={50} onChange={spacing=>change({spacing})}/>}
 {n.pattern==='lines'&&<><Range label="线条数量" value={p.lineCount} min={1} max={5} onChange={lineCount=>change({lineCount})}/>{p.linesStyle==='wave'&&<Range label="弯曲度" value={p.curve} min={0} max={100} onChange={curve=>change({curve})}/>}</>}
 <Range label="上下位置" value={p.position} min={10} max={90} onChange={position=>change({position})}/>
 {!(n.pattern==='gradient'&&p.gradientStyle==='aura')&&<Range label="方向" value={p.angle} min={-90} max={90} suffix="°" onChange={angle=>change({angle})}/>}
 <Range label="图案浓淡" value={p.opacity} min={10} max={100} suffix="%" onChange={opacity=>change({opacity})}/>
 </details></>
}
