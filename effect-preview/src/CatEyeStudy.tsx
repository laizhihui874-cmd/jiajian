import {useEffect,useRef,useState} from 'react'
import {ArrowLeft,Move,Pause,Play,RotateCcw} from 'lucide-react'
import {createCatEyeStudy,initialCatStudy} from './catEyeStudyScene'
import type {CatStudySettings,CatStudyStyle,CatStudyColor} from './catEyeStudyScene'
import './CatEyeStudy.css'

const styles:{id:CatStudyStyle;name:string;description:string;hint:string}[]=[
 {id:'side',name:'侧光',description:'沿一侧聚起的亮带',hint:'左右慢慢倾斜，观察细亮带怎样进入甲面，再收向边缘。'},
 {id:'wide',name:'宽光',description:'铺开一片细腻水光',hint:'轻轻转动，让整片亮面翻过来，观察水光与深底色的交替。'},
 {id:'tracking',name:'追光',description:'像光球浮在甲胶里',hint:'横向转动后再上下倾斜，观察亮团的位置、大小和明暗变化。'},
]
const colors:{id:CatStudyColor;name:string;color:string}[]=[
 {id:'teal',name:'青绿',color:'#247c6e'},{id:'rose',name:'莓紫',color:'#873351'},{id:'champagne',name:'香槟',color:'#b89a60'},
]
export default function CatEyeStudy({onClose}:{onClose:()=>void}){
 const dialog=useRef<HTMLDialogElement>(null),host=useRef<HTMLDivElement>(null)
 const engine=useRef<ReturnType<typeof createCatEyeStudy>|null>(null)
 const [settings,setSettings]=useState<CatStudySettings>(initialCatStudy)
 const [playing,setPlaying]=useState(false),[error,setError]=useState('')
 const current=styles.find(style=>style.id===settings.style)!
 useEffect(()=>{
  dialog.current?.showModal()
  if(!host.current)return
  try{engine.current=createCatEyeStudy(host.current,()=>setPlaying(false),setError)}
  catch{setError('当前设备暂时无法显示立体猫眼，可以返回工作台继续设计。')}
  return()=>{engine.current?.dispose();engine.current=null}
 },[])
 useEffect(()=>{engine.current?.update(settings)},[settings])
 useEffect(()=>{engine.current?.play(playing)},[playing])
 function patch(change:Partial<CatStudySettings>){setSettings(value=>({...value,...change}))}
 function reset(){setSettings({...initialCatStudy});setPlaying(false);engine.current?.orient(0,0)}
 return <dialog ref={dialog} className="cat-study" aria-labelledby="cat-study-title" onCancel={onClose}>
  <header className="cs-header"><button className="text-button" onClick={onClose}><ArrowLeft size={16}/>返回工作台</button><h1 id="cat-study-title">猫眼体验<span>第三版 · 颗粒可调</span></h1><button className="text-button" onClick={reset}><RotateCcw size={15}/>重置</button></header>
  <div className="cs-body">
   <section className="cs-preview" aria-label="动态猫眼预览">
    <div className="cs-caption"><span>同一片甲胶 · 同一盏灯</span><strong>{current.name}</strong></div>
    <div className="cs-canvas" ref={host}/>
    {error&&<div className="cs-error" role="alert"><p>{error}</p><button className="primary" onClick={onClose}>返回工作台</button></div>}
    <div className="cs-view-controls"><button aria-pressed={playing} disabled={!!error} onClick={()=>setPlaying(value=>!value)}>{playing?<Pause size={15}/>:<Play size={15}/>} {playing?'暂停转动':'自动转动'}</button><button disabled={!!error} onClick={()=>engine.current?.orient(0,-.42)}>左倾</button><button disabled={!!error} onClick={()=>engine.current?.orient(0,0)}>正面</button><button disabled={!!error} onClick={()=>engine.current?.orient(0,.42)}>右倾</button></div>
    <p className="cs-gesture"><Move size={15}/>拖动甲片，观察光在里面翻动</p>
   </section>
   <aside className="cs-controls"><div className="cs-intro"><h2>先看光，怎样动。</h2><p>保持颜色和观看角度，切换三种聚光方式，比较它们转动时的变化。</p></div>
    <div className="cs-styles" role="group" aria-label="猫眼聚光方式">{styles.map(style=><button key={style.id} aria-pressed={settings.style===style.id} onClick={()=>patch({style:style.id})}><i className={`cs-style-icon ${style.id}`}/><span><strong>{style.name}</strong><small>{style.description}</small></span></button>)}</div>
    <p className="cs-style-help">{current.hint}</p>
    <section className="cs-section"><h3>换一片颜色</h3><div className="cs-colors">{colors.map(color=><button key={color.id} aria-pressed={settings.color===color.id} onClick={()=>patch({color:color.id})}><i style={{backgroundColor:color.color}}/>{color.name}</button>)}</div></section>
    <section className="cs-section"><label className="cs-range">猫眼亮度<span>{settings.brightness}%</span><input type="range" min="0" max="100" value={settings.brightness} onChange={event=>patch({brightness:Number(event.target.value)})}/></label><label className="cs-range">聚光柔和度<span>{settings.softness}%</span><input type="range" min="0" max="100" value={settings.softness} onChange={event=>patch({softness:Number(event.target.value)})}/></label><p className="cs-small">左侧更集中、锐利，右侧更柔和、铺开。</p></section>
    <section className="cs-section"><label className="cs-range">颗粒感<span>{settings.grain}%</span><input type="range" min="0" max="100" value={settings.grain} onChange={event=>patch({grain:Number(event.target.value)})}/></label><p className="cs-small">往左更细腻，往右保留更明显的闪亮颗粒。</p></section>
    <section className="cs-section"><label className="cs-check"><input type="checkbox" checked={settings.coat} onChange={event=>patch({coat:event.target.checked})}/><span>显示表面灯影<small>暂时关掉，更容易看清甲胶里的猫眼光。</small></span></label></section>
    <p className="cs-footnote">这里的调整只用于体验。返回后，你的工作台作品保持原样。</p>
   </aside>
  </div>
 </dialog>
}
