import {useEffect,useRef,useState} from 'react'
import {ArrowLeft,Download,Pause,Play,RotateCcw} from 'lucide-react'
import {atelierStyles,finishNames,palette,shapeNames} from '../shared/design'
import type {Nail} from '../shared/design'
import {nailPatterns} from '../shared/patternLayers'
import {NailArt} from './NailArt'
import {Range} from './Widgets'
import {SurfaceControls} from './EffectControls'
import {createMaterialScene} from './materialScene'
import {defaultMaterialSettings} from './materialLabSettings'
import './MaterialLab.css'

function trialFrom(nail:Nail):Nail{return {...structuredClone(nail),lockedLayers:[]}}
export default function MaterialLab({nail,nailLabel,onClose}:{nail:Nail;nailLabel:string;onClose:()=>void}){
 const dialog=useRef<HTMLDialogElement>(null),host=useRef<HTMLDivElement>(null),engine=useRef<ReturnType<typeof createMaterialScene>|null>(null)
 const [trial,setTrial]=useState(()=>trialFrom(nail)),[playing,setPlaying]=useState(false),[count,setCount]=useState(1),[compare,setCompare]=useState(false)
 const [light,setLight]=useState(0),[error,setError]=useState(''),[notice,setNotice]=useState(''),[exporting,setExporting]=useState(false),[loading,setLoading]=useState(true),[retry,setRetry]=useState(0)
 const sourceKey=JSON.stringify(nail),trialKey=JSON.stringify(trial)
 useEffect(()=>{
  dialog.current?.showModal()
  if(!host.current)return
  let cancelled=false
  setError('');setLoading(true)
  try{engine.current=createMaterialScene(host.current,defaultMaterialSettings,message=>{if(!cancelled){setError(message);setLoading(false)}})}catch{setError('当前设备暂时无法打开立体预览，可以返回工作台继续设计。');setLoading(false)}
  return()=>{cancelled=true;engine.current?.dispose();engine.current=null}
 },[retry])
 useEffect(()=>{setTrial(trialFrom(nail));setPlaying(false);setLight(0);engine.current?.orient(-.08,-.12)},[sourceKey])
 useEffect(()=>{
  const scene=engine.current;if(!scene)return
  let cancelled=false;setLoading(true)
  void scene.present(trial,light).then(()=>{if(!cancelled)setLoading(false)}).catch(()=>{if(!cancelled){setLoading(false);setError('这片美甲暂时未载入，请重试。')}})
  return()=>{cancelled=true}
 },[trialKey,light,retry])
 useEffect(()=>{engine.current?.play(playing)},[playing,retry])
 useEffect(()=>{engine.current?.count(count)},[count,retry])
 useEffect(()=>{if(!notice)return;const timer=setTimeout(()=>setNotice(''),4000);return()=>clearTimeout(timer)},[notice])
 function patch(change:Partial<Nail>){setTrial(current=>({...current,...change}))}
 function orient(x:number,y:number){setPlaying(false);engine.current?.orient(x,y)}
 function reset(){setTrial(trialFrom(nail));setLight(0);setNotice('已恢复工作台选中的设计');orient(-.08,-.12)}
 async function download(){
  if(loading||error)return
  setExporting(true)
  try{if(!engine.current)throw new Error();await engine.current.download();setNotice('已开始下载当前角度的试色图')}
  catch{setError('试色图暂时无法导出，请重试。')}finally{setExporting(false)}
 }
 const lengthLabel={short:'短',medium:'中长',long:'长'}[nail.length]
 const changed=JSON.stringify(trial)!==JSON.stringify(trialFrom(nail))
 return <dialog className="material-lab selected-nail-study" ref={dialog} aria-labelledby="material-lab-title" onCancel={onClose}>
 <header className="ml-header"><button className="text-button" onClick={onClose}><ArrowLeft size={17}/>返回工作台</button><h1 id="material-lab-title">立体试色<span>{nailLabel}</span></h1><button className="ghost" disabled={loading||!!error||exporting} onClick={download}><Download size={15}/>{exporting?'导出中…':'导出试色图'}</button></header>
 <div className="ml-body"><section className="ml-preview" aria-label={`${nailLabel}的立体预览`}>
 <div className="ml-source-note"><strong>{nailLabel}</strong><span>{shapeNames[nail.shape]} · {lengthLabel} · {nail.artwork?'完整成品款':finishNames[trial.finish]}{changed?' · 临时试色':''}</span></div>
 <div className="ml-toolbar"><div className="segmented" role="group" aria-label="试色展示数量">{[1,10].map(value=><button key={value} aria-pressed={count===value} className={count===value?'active':''} onClick={()=>{setCount(value);if(value===10)setCompare(false)}}>{value===1?'当前单甲':'十甲同款'}</button>)}</div><button className={`ml-compare ${compare?'active':''}`} aria-pressed={compare} disabled={count===10} onClick={()=>setCompare(v=>!v)}>对照原设计</button></div>
 {count===10&&<p className="ml-help ml-count-note">将当前选中的款式重复展示十片，不是工作台的整套搭配。</p>}
 <div className={`ml-stage ${compare?'comparing':''}`}><div className="ml-live"><div ref={host} className="ml-canvas" onPointerDown={()=>setPlaying(false)} onKeyDown={()=>setPlaying(false)}/>{compare&&<span className="ml-image-label">立体试色{changed?' · 临时调整':''}</span>}</div>
 {compare&&<div className={`ml-photo study-length-${nail.length}`}><NailArt nail={nail}/><span className="ml-image-label">工作台原设计</span></div>}
 {loading&&!error&&<div className="ml-loading" role="status">正在载入所选美甲…</div>}
 {error&&<div className="ml-error" role="alert"><p>{error}</p><button className="primary" onClick={()=>{setError('');setRetry(v=>v+1)}}>重试</button><button className="text-button" onClick={onClose}>返回工作台</button></div>}</div>
 <div className="ml-view-controls"><button className={playing?'active':''} disabled={!!error||loading} aria-pressed={playing} onClick={()=>setPlaying(v=>!v)}>{playing?<Pause size={15}/>:<Play size={15}/>} {playing?'暂停转动':'自动转动'}</button><button disabled={!!error} onClick={()=>orient(0,-.52)}>左倾</button><button disabled={!!error} onClick={()=>orient(0,0)}>正面</button><button disabled={!!error} onClick={()=>orient(0,.52)}>右倾</button></div>
 <p className="ml-hint">拖动甲片，查看角度和反光<span>也可用方向键转动，按 Home 回到正面</span></p>
 </section><aside className="ml-controls" aria-label="当前甲片试色选项">
 <div className="ml-control-heading"><h2>{nail.artwork?atelierStyles.find(s=>s.id===nail.artwork)?.name||'完整成品款':'当前甲片'}</h2><p>已带入工作台选中的设计。这里的调整仅用于比较，返回工作台不会改变原作品。</p></div>
 <div className="ml-design-summary"><span>{nail.artwork?'完整款式':`${nailPatterns(nail).length} 项图案`}</span><span>{nail.decorations.length} 颗额外饰品</span></div>
 <details className="ml-section fine-options" open><summary>查看灯光</summary><Range label="灯光位置" value={light} min={-25} max={25} onChange={setLight}/><button className="text-button" onClick={()=>setLight(0)}>灯光归位</button></details>
 {nail.artwork?<p className="ml-help">成品款的自带花纹和装饰作为整张款式展示，不能拆开试色；额外添加的珍珠、水钻会随甲片转动。</p>:<>
 <details className="ml-section fine-options"><summary>临时换色</summary><div className="ml-swatches">{palette.map(([label,color])=><button key={color} aria-label={`试色：${label}`} aria-pressed={trial.color===color} onClick={()=>patch({color})}><i style={{backgroundColor:color}}/><small>{label}</small></button>)}</div><label className="ml-custom">自选颜色<input type="color" aria-label="临时底色" value={trial.color} onChange={e=>patch({color:e.target.value})}/></label><Range label="颜色浓淡" value={trial.opacity*100} min={35} max={100} suffix="%" onChange={value=>patch({opacity:value/100})}/></details>
 <details className="ml-section fine-options"><summary>临时调整质感</summary><SurfaceControls n={trial} patch={patch}/></details>
 </>}
 <div className="ml-footnote"><button className="ghost" onClick={reset}><RotateCcw size={14}/>恢复工作台设计</button><p>展示完整设计，包含工作台中暂时隐藏的内容。重新打开时载入当前选中的甲片，不沿用上次临时试色。</p></div>
 </aside></div>{notice&&<div className="toast" role="status">{notice}</div>}
 </dialog>
}
