import {useEffect,useRef,useState} from 'react'
import {ArrowLeft,Download,Pause,Play,RotateCcw} from 'lucide-react'
import {baseNail} from '../shared/design'
import {NailArt} from './NailArt'
import {Range} from './Widgets'
import {createMaterialScene} from './materialScene'
import {defaultMaterialSettings,materialStorageKey,parseMaterialSettings} from './materialLabSettings'
import type {MaterialSettings} from './materialLabSettings'
import './MaterialLab.css'

const colors=[['酒红','#861B37'],['玫瑰','#B75375'],['奶粉','#D6A69C'],['香槟','#B4945D'],['墨绿','#23564D'],['雾蓝','#53869C'],['紫晶','#71518F'],['奶白','#EADBD0']]
export default function MaterialLab({onClose}:{onClose:()=>void}){
 const dialog=useRef<HTMLDialogElement>(null),host=useRef<HTMLDivElement>(null),engine=useRef<ReturnType<typeof createMaterialScene>|null>(null)
 const [settings,setSettings]=useState<MaterialSettings>(()=>{try{return parseMaterialSettings(localStorage.getItem(materialStorageKey))}catch{return {...defaultMaterialSettings}}})
 const [playing,setPlaying]=useState(false),[count,setCount]=useState(1),[compare,setCompare]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState(''),[exporting,setExporting]=useState(false)
 const initial=useRef(settings)
 useEffect(()=>{
  dialog.current?.showModal()
  if(!host.current)return
  let cancelled=false
  try{engine.current=createMaterialScene(host.current,initial.current,setError)}catch{queueMicrotask(()=>{if(!cancelled)setError('当前设备暂时无法打开立体预览，可以返回工作台继续设计。')})}
  return()=>{cancelled=true;engine.current?.dispose();engine.current=null}
 },[])
 useEffect(()=>{engine.current?.update(settings);try{localStorage.setItem(materialStorageKey,JSON.stringify(settings))}catch{/* The preview remains editable without storage. */}},[settings])
 useEffect(()=>{engine.current?.play(playing)},[playing])
 useEffect(()=>{engine.current?.count(count)},[count])
 useEffect(()=>{if(!notice)return;const id=setTimeout(()=>setNotice(''),3000);return()=>clearTimeout(id)},[notice])
 function patch(change:Partial<MaterialSettings>){setSettings(s=>({...s,...change}))}
 function orient(x:number,y:number){setPlaying(false);engine.current?.orient(x,y)}
 async function download(){setExporting(true);try{if(!engine.current||error)throw new Error('立体预览尚未就绪');await engine.current.download();setNotice('已导出当前角度的试色图片')}catch(e){setNotice((e as Error).message)}finally{setExporting(false)}}
 const finishLabel={gloss:'纯色亮面',jelly:'果冻透色',cat:'猫眼'}[settings.finish]
 return <dialog className="material-lab" ref={dialog} aria-labelledby="material-lab-title" onCancel={onClose}>
  <header className="ml-header"><button className="text-button" onClick={onClose}><ArrowLeft size={17}/>返回工作台</button><h1 id="material-lab-title">立体试色<span>材质预览</span></h1><button className="ghost" disabled={!!error||exporting} onClick={download}><Download size={15}/>{exporting?'导出中':'导出试色图'}</button></header>
  <div className="ml-body"><section className="ml-preview" aria-label="立体材质预览">
   <div className="ml-toolbar"><div className="segmented" aria-label="立体预览数量">{[1,10].map(v=><button key={v} aria-pressed={count===v} className={count===v?'active':''} onClick={()=>{setCount(v);if(v===10)setCompare(false)}}>{v===1?'单甲精看':'十甲同色'}</button>)}</div><button className={`ml-compare ${compare?'active':''}`} aria-pressed={compare} disabled={count===10} onClick={()=>setCompare(v=>!v)}>照片版对照</button></div>
   <div className={`ml-stage ${compare?'comparing':''}`}>
    <div className="ml-live"><div ref={host} className="ml-canvas" onPointerDown={()=>setPlaying(false)} onKeyDown={()=>setPlaying(false)}/>{compare&&<span className="ml-image-label">立体渲染</span>}</div>
    {compare&&<div className="ml-photo"><NailArt photo nail={{...baseNail(),color:settings.color,finish:settings.finish==='jelly'?'gloss':settings.finish,opacity:settings.finish==='jelly'?.55:1,catAngle:settings.angle}}/><span className="ml-image-label">原照片版 · 同色参考</span></div>}
    {error&&<div className="ml-error" role="alert"><p>{error}</p><button className="primary" onClick={onClose}>返回工作台</button></div>}
   </div>
   <div className="ml-view-controls"><button className={playing?'active':''} disabled={!!error} aria-pressed={playing} onClick={()=>setPlaying(p=>!p)}>{playing?<Pause size={15}/>:<Play size={15}/>} {playing?'暂停看光':'摇一摇看光'}</button><button disabled={!!error} onClick={()=>orient(0,-.52)}>左倾</button><button disabled={!!error} onClick={()=>orient(0,0)}>正面</button><button disabled={!!error} onClick={()=>orient(0,.52)}>右倾</button></div>
   <p className="ml-hint">拖动甲片，看光随弧面流动<span>也可用方向键转动 · 停止操作后静止展示</span></p>
  </section><aside className="ml-controls" aria-label="立体试色工具">
   <div className="ml-control-heading"><span>中椭圆 · 自然弧面</span><h2>{finishLabel}</h2><p>先选胶的质感，再找到喜欢的光。</p></div>
   <div className="ml-materials" role="group" aria-label="色胶质感">{([{id:'gloss',label:'纯色亮面',desc:'饱满 · 圆润'},{id:'jelly',label:'果冻透色',desc:'透亮 · 轻盈'},{id:'cat',label:'猫眼',desc:'流光 · 细闪'}] as const).map(m=><button className={settings.finish===m.id?'active':''} aria-pressed={settings.finish===m.id} key={m.id} onClick={()=>patch({finish:m.id})}><strong>{m.label}</strong><small>{m.desc}</small></button>)}</div>
   <div className="ml-section"><h3>试一个颜色 <span>{settings.color.toUpperCase()}</span></h3><div className="ml-swatches">{colors.map(([name,color])=><button key={color} aria-label={`试色${name}`} aria-pressed={settings.color===color} onClick={()=>patch({color})}><i style={{backgroundColor:color}}/><small>{name}</small></button>)}</div><label className="ml-custom">自己的颜色<input type="color" aria-label="自选试色颜色" value={settings.color} onChange={e=>patch({color:e.target.value})}/></label></div>
   {settings.finish==='cat'&&<div className="ml-section"><h3>设计猫眼光带</h3><p className="ml-help">这里改变款式；左边转动甲片只改变观看角度。</p><div className="ml-presets"><button onClick={()=>patch({angle:32,width:20,strength:80})}>斜向细光</button><button onClick={()=>patch({angle:0,width:58,strength:65})}>柔雾宽光</button><button onClick={()=>patch({angle:90,width:30,strength:75})}>横向光带</button></div><Range label="光带方向" value={settings.angle} min={-90} max={90} suffix="°" onChange={angle=>patch({angle})}/><Range label="光带宽度" value={settings.width} min={8} max={80} onChange={width=>patch({width})}/><Range label="光带强度" value={settings.strength} min={0} max={100} suffix="%" onChange={strength=>patch({strength})}/></div>}
   {settings.finish==='jelly'&&<div className="ml-section"><Range label="透色浓度" value={settings.density} min={20} max={90} suffix="%" onChange={density=>patch({density})}/></div>}
   <div className="ml-section"><Range label="展示灯光" value={settings.light} min={40} max={140} suffix="%" onChange={light=>patch({light})}/></div>
   <div className="ml-footnote"><p>试色单独保留在此浏览器，不改动原作品。当前先体验基础色胶，花纹与饰品仍在原工作台编辑。</p><button className="text-button" onClick={()=>{setSettings({...defaultMaterialSettings});orient(-.08,-.12);setCount(1);setCompare(false)}}><RotateCcw size={14}/>恢复酒红猫眼</button></div>
  </aside></div>{notice&&<div className="toast" role="status">{notice}</div>}
 </dialog>
}
