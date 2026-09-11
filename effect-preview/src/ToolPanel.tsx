import {useLayoutEffect,useRef} from 'react'
import type {CSSProperties,ReactNode} from 'react'
import {Check,Expand,Flower2,Gem,Palette,Plus} from 'lucide-react'
import {baseNail,palette,shapeNames,shapes,variantNames} from '../shared/design'
import type {Nail,Decoration} from '../shared/design'
import {NailArt} from './NailArt'
import {Range} from './Widgets'
import {SurfaceControls} from './EffectControls'

type Props={n:Nail;ready:boolean;tool:string;setTool:(t:string)=>void;patch:(p:Partial<Nail>)=>void;activeDecor?:string;setActiveDecor:(id:string)=>void;add:(type:'pearl'|'gem')=>void;patchDecor:(p:Partial<Decoration>)=>void;showSingle:()=>void;layerPanel:ReactNode;patternPanel:ReactNode;colorSection:'base'|'surface';setColorSection:(s:'base'|'surface')=>void;unlock:(id:string)=>void;itemActions:(id:string)=>ReactNode;addGradient:()=>void;openStyles:()=>void;freeDesign:()=>void}
export function ToolPanel({n,ready,tool,setTool,patch,activeDecor,setActiveDecor,add,patchDecor,showSingle,layerPanel,patternPanel,colorSection,setColorSection,unlock,itemActions,addGradient,openStyles,freeDesign}:Props){
 const scroll=useRef<HTMLDivElement>(null)
 useLayoutEffect(()=>{if(scroll.current)scroll.current.scrollTop=0},[tool,colorSection])
 const decor=n.decorations.find(d=>d.id===activeDecor)
 const tabs=[{id:'shape',name:'甲型',icon:Expand},{id:'color',name:'配色',icon:Palette},{id:'pattern',name:'图案',icon:Flower2},{id:'decor',name:'饰品',icon:Gem}]
 function lockNotice(id:Nail['lockedLayers'][number],label:string){return n.lockedLayers.includes(id)?<div className="lock-notice">{label}已锁定 <button onClick={()=>unlock(id)}>解锁</button></div>:null}
 const lengths=<><h3>长度</h3><div className="choice-grid three">{([{id:'short',label:'短'},{id:'medium',label:'中长'},{id:'long',label:'长'}] as const).map(l=><button key={l.id} aria-pressed={n.length===l.id} className={n.length===l.id?'active':''} onClick={()=>patch({length:l.id})}>{l.label}</button>)}</div></>
 return <><div className="tool-tabs" role="tablist" aria-label="设计工具">{tabs.map(t=><button key={t.id} role="tab" aria-selected={tool===t.id} className={tool===t.id?'active':''} onClick={()=>setTool(t.id)}><t.icon size={18}/>{t.name}</button>)}</div>
 <div ref={scroll} className="tool-scroll"><fieldset disabled={!ready}>
 {n.artwork&&<div className="complete-style-note"><strong>完整成品款</strong><p>可调整长度、搭配其他甲片、添加饰品。自带花纹和光泽不能单独修改。</p><button className="text-button" onClick={openStyles}>更换款式</button><button className="text-button" onClick={freeDesign}>改为自由设计</button></div>}
 {tool==='shape'&&<>{lockNotice('shape','甲型与长度')}<fieldset disabled={n.lockedLayers.includes('shape')}>
 {!n.artwork&&<><h3>甲型</h3><div className="choice-grid shape-categories">{shapes.map(s=><button key={s} className={n.shape===s?'active':''} aria-pressed={n.shape===s} onClick={()=>patch({shape:s,variant:'classic'})}><NailArt nail={{...baseNail(),shape:s,color:'#CDB8AB'}}/><span>{shapeNames[s]}</span></button>)}</div><div className="shape-branches">{(['classic','slim'] as const).map((variant,i)=><button key={variant} aria-pressed={n.variant===variant} className={n.variant===variant?'active':''} onClick={()=>patch({variant})}><NailArt nail={{...baseNail(),shape:n.shape,variant,color:'#CDB8AB'}}/><strong>{variantNames[n.shape][i]}</strong></button>)}</div></>}
 {lengths}</fieldset></>}
 {tool==='color'&&!n.artwork&&<><div className="segmented color-section" role="group" aria-label="配色选项">{(['base','surface'] as const).map(s=><button key={s} className={colorSection===s?'active':''} aria-pressed={colorSection===s} onClick={()=>setColorSection(s)}>{s==='base'?'颜色':'质感'}</button>)}</div>
 {colorSection==='base'?<>{lockNotice('base','底色')}<fieldset disabled={n.lockedLayers.includes('base')}><h3>底色</h3><div className="color-grid">{palette.map(([label,c])=><button key={c} className={`color-choice ${n.color.toLowerCase()===c.toLowerCase()?'active':''}`} aria-label={`底色：${label}`} aria-pressed={n.color.toLowerCase()===c.toLowerCase()} style={{'--swatch':c} as CSSProperties} onClick={()=>patch({color:c})}><span>{n.color.toLowerCase()===c.toLowerCase()&&<Check size={17}/>}</span><small>{label}</small></button>)}</div><label className="custom-color"><span><Plus size={15}/>自选颜色</span><input type="color" aria-label="自选底色" value={n.color} onChange={e=>patch({color:e.target.value})}/></label><details className="fine-options" key={n.finish} open={n.finish==='jelly'?true:undefined}><summary>颜色浓淡</summary><Range label="浅 — 浓" value={n.opacity*100} min={35} max={100} suffix="%" onChange={v=>patch({opacity:v/100})}/><small>{n.color.toUpperCase()}</small></details></fieldset><button className="ghost add-gradient" onClick={addGradient}>添加渐变到这一指</button></>:<>{lockNotice('surface','质感')}<SurfaceControls n={n} patch={patch}/></>}
 </>}
 {tool==='pattern'&&!n.artwork&&<>{lockNotice('pattern','图案')}<fieldset disabled={n.lockedLayers.includes('pattern')}>{patternPanel}</fieldset></>}
 {n.artwork&&(tool==='color'||tool==='pattern')&&<p className="helper">这款的{tool==='color'?'配色与质感':'图案'}作为整体保留。可以更换款式，或改为自由设计后重新创作。</p>}
 {tool==='decor'&&<><h3>添加饰品</h3><div className="decor-options"><button onClick={()=>add('pearl')}><span className="pearl-sample"/><span>珍珠</span><Plus size={14}/></button><button onClick={()=>add('gem')}><span className="gem-sample"/><span>水钻</span><Plus size={14}/></button></div>
 {!n.decorations.length?<p className="helper">尚未添加{n.artwork?'额外':''}饰品</p>:<><h3>已添加饰品</h3><div className="decor-list">{n.decorations.map((d,i)=><button key={d.id} className={activeDecor===d.id?'active':''} aria-pressed={activeDecor===d.id} onClick={()=>{setActiveDecor(d.id);showSingle()}}>{d.type==='pearl'?'珍珠':'水钻'} {i+1}{d.locked?' · 已锁定':''}</button>)}</div>{decor&&<><fieldset disabled={decor.locked}><Range label="大小" value={decor.size} min={5} max={18} onChange={v=>patchDecor({size:v})}/><p className="helper">在甲面上拖动这颗饰品，调整位置。</p><details className="fine-options"><summary>精细位置</summary><Range label="左右位置" value={decor.x} min={12} max={88} onChange={x=>patchDecor({x})}/><Range label="上下位置" value={decor.y} min={20} max={140} onChange={y=>patchDecor({y})}/></details></fieldset>{itemActions(decor.id)}</>}</>}
 </>}
 </fieldset></div><details className="current-nail"><summary>当前甲片 <span>查看与调整已有内容</span></summary>{layerPanel}</details></>
}
