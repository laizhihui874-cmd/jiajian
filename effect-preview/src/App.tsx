import {lazy,Suspense,useEffect,useRef,useState} from 'react'
import {Menu,Sparkles,Expand,Palette,Flower2,Gem,ArrowLeft,ArrowRight,Copy,Layers,LoaderCircle,Plus,Redo2,Save,Undo2} from 'lucide-react'
import {applyAtelier,atelierNail,atelierStyles,applyInspiration,baseNail,duplicateDesign,finishNames,fingerNames,inspirations,nailName,newDesign,shapeNames,targets,updateNails} from '../shared/design'
import type {Decoration,Design,Nail,PatternLayer,Scope} from '../shared/design'
import {NailArt,updateDecoration} from './NailArt'
import {HandPreview} from './HandPreview'
import {api,useStudio} from './useStudio'
import type {SavedDesign} from './useStudio'
import {Dialog} from './Widgets'
import {ChoiceStrip} from './ChoiceStrip'
import {ToolPanel} from './ToolPanel'
import {JewelPreview} from './JewelPreview'
import {MaterialLabBoundary} from './MaterialLabBoundary'
import {GesturePreview} from './GesturePreview'
import type {Arrangement} from './gestureLayout'
import {PatternStackControls} from './PatternStackControls'
import {nailPatterns,patternPatch} from '../shared/patternLayers'
import {defaultPatternSettings} from '../shared/effects'
import {ContentActions,DesignLayers} from './DesignDetails'
import {previewWithoutLayers,updateEditableNails} from '../shared/designDetails'
import {InspirationLibrary} from './InspirationLibrary'
import {FinishDialog} from './FinishDialog'
import './App.css'
import './Workspace.css'
import './MobileWorkspace.css'

const MaterialLab=lazy(()=>import('./MaterialLab'))
const CatEyeStudy=lazy(()=>import('./CatEyeStudy'))
const demoLibraryKey='nail-effects-library-v2'
const arrangements=[{id:'jewel',label:'珠宝陈列'},{id:'cupped',label:'手心轻拢'},{id:'original',label:'标准排列'}] as const
const scopeChoices=[{value:'single',label:'仅这一指'},{value:'mirror',label:'左右对应',description:'左右手同名指'},{value:'all',label:'全部十指'}] as const

export default function App(){
 const [mobileMenu,setMobileMenu]=useState(false)
 const [inspire,setInspire]=useState(false)
 const [catStudy,setCatStudy]=useState(()=>['cat-eye','magnetic'].includes(new URLSearchParams(window.location.search).get('preview')||''))
 const [materialLab,setMaterialLab]=useState(()=>new URLSearchParams(window.location.search).get('preview')==='material')
 const studio=useStudio(),{design,commit,ready,status,error}=studio
 const [selected,setSelected]=useState(1),[scope,setScope]=useState<Scope>('single')
 const [view,setView]=useState<'single'|'five'|'set'|'hand'>('set'),[side,setSide]=useState<'left'|'right'>('left')
 const [arrangement,setArrangement]=useState<Arrangement>(()=>{try{const v=localStorage.getItem('nail-preview-arrangement-v2');return v==='original'||v==='cupped'?v:'jewel'}catch{return 'jewel'}})
 const [tool,setTool]=useState('color'),[colorSection,setColorSection]=useState<'base'|'surface'>('base')
 const [gallery,setGallery]=useState(false),[saved,setSaved]=useState<SavedDesign[]>([]),[galleryLoading,setGalleryLoading]=useState(false),[galleryError,setGalleryError]=useState('')
 const [styles,setStyles]=useState<'set'|'single'|null>(null),[confirm,setConfirm]=useState<'new'|'clear'|'reset'|'free'|null>(null)
 const [activePattern,setActivePattern]=useState<string>(),[drawingId,setDrawingId]=useState<string>(),[activeDecor,setActiveDecor]=useState<string>()
 const [notice,setNotice]=useState<{text:string;error:boolean}|null>(null),[saving,setSaving]=useState(false),busy=useRef(false)
 const [finished,setFinished]=useState(false),[rename,setRename]=useState(false),[nameDraft,setNameDraft]=useState(design.name)
 const [hiddenLayers,setHiddenLayers]=useState<Record<string,string[]>>({}),[lightPlaying,setLightPlaying]=useState(false),[lightControlsOpen,setLightControlsOpen]=useState(false),[light,setLight]=useState(0)
 const [toolsOpen,setToolsOpen]=useState(true)
 const [copy,setCopy]=useState<{kind:'full'|'pattern'|'decor';id?:string;targets:number[]}|null>(null)
 const n=design.nails[selected],decor=n.decorations.find(d=>d.id===activeDecor)
 const editable=ready&&!saving
 const localEditing=tool==='pattern'||tool==='decor'
 const actualScope=localEditing?'single':scope
 const editingTargets=targets(selected,actualScope)
 const hiddenKey=design.id+':'+selected,hidden=hiddenLayers[hiddenKey]||[]
 const previewDesign={...design,nails:design.nails.map((n,i)=>previewWithoutLayers(n,hiddenLayers[design.id+':'+i]))},displayN=previewDesign.nails[selected]
 const hiddenCount=Object.entries(hiddenLayers).filter(([key])=>key.startsWith(design.id+':')).reduce((sum,[,ids])=>sum+ids.length,0)
 const paintLayer=nailPatterns(n).find(l=>l.id===drawingId),drawing=tool==='pattern'&&view==='single'&&!n.artwork&&!n.lockedLayers.includes('pattern')&&paintLayer?.drawMode==='free'&&!paintLayer.locked?paintLayer:undefined
 function tell(text:string,isError=false){setNotice({text,error:isError})}
 useEffect(()=>{if(!notice||notice.error)return;const timer=setTimeout(()=>setNotice(null),4500);return()=>clearTimeout(timer)},[notice])
 useEffect(()=>setNameDraft(design.name),[design.name])
 useEffect(()=>{if(!lightPlaying||view!=='single')return;let frame=0,start=0,last=0;const tick=(time:number)=>{if(!start)start=time;if(time-start>6000){setLightPlaying(false);setLight(0);return}if(!document.hidden&&time-last>40){setLight(Math.round(Math.sin((time-start)/900)*25));last=time}frame=requestAnimationFrame(tick)};frame=requestAnimationFrame(tick);return()=>cancelAnimationFrame(frame)},[lightPlaying,view])
 function changeArrangement(value:Arrangement){setArrangement(value);try{localStorage.setItem('nail-preview-arrangement-v2',value)}catch{/* Preference is optional. */}}
 function stopDetail(){setDrawingId(undefined);setActivePattern(undefined);setActiveDecor(undefined);setLightPlaying(false);setLightControlsOpen(false);setLight(0)}
 function select(i:number){stopDetail();setScope('single');setSelected(i);setSide(i<5?'left':'right')}
 function changeTool(value:string){setToolsOpen(true);setDrawingId(undefined);setScope('single');setTool(value)}
 function reveal(id:string){setHiddenLayers(old=>({...old,[hiddenKey]:(old[hiddenKey]||[]).filter(x=>x!==id)}))}
 function editItem(next:string,id?:string){changeTool(next);if(id){reveal(id);if(id==='base'||id==='surface')setColorSection(id);else if(next==='pattern'){setActivePattern(id);setView('single')}else if(next==='decor'){setActiveDecor(id);setView('single')}}}
 function toggleHidden(id:string){setHiddenLayers(old=>{const ids=old[hiddenKey]||[];return {...old,[hiddenKey]:ids.includes(id)?ids.filter(x=>x!==id):[...ids,id]}})}
 function singlePatch(change:Partial<Nail>){if(!editable)return;commit(updateNails(design,selected,'single',change))}
 function applyChanges(indices:number[],make:(n:Nail,i:number)=>Partial<Nail>|null,skipMessage='有锁定内容或已达到数量上限'){
  if(!editable)return
  let next=design,changed=0,skipped=0
  for(const i of indices){const p=make(next.nails[i],i);if(p===null){skipped++;continue}const wanted=updateNails(next,i,'single',p);if(JSON.stringify(wanted.nails[i])===JSON.stringify(next.nails[i]))continue;const updated=updateEditableNails(next,i,'single',p);if(JSON.stringify(updated.nails[i])===JSON.stringify(next.nails[i]))skipped++;else changed++;next=updated}
  if(changed)commit(next)
  if(skipped)tell(`${changed?`已修改 ${changed} 指；`:''}${skipped} 指未修改：${skipMessage}`,true)
  else if(changed&&indices.length>1)tell(`已修改 ${changed} 指`)
 }
 function patch(change:Partial<Nail>){
  const surface=change.surface?Object.fromEntries(Object.entries(change.surface).filter(([key,value])=>value!==n.surface[key as keyof Nail['surface']])):null
  applyChanges(editingTargets,item=>{
   if(item.artwork&&Object.keys(change).some(key=>!['length'].includes(key)))return null
   return {...change,...(surface?{surface:{...item.surface,...surface}}:{})}
  },'内容已锁定、属于完整成品款，或已达到数量上限')
 }
 function patchDecor(change:Partial<Decoration>){if(decor&&!decor.locked)singlePatch({decorations:updateDecoration(n,decor.id,change)})}
 function toggleLock(id:string){if(!editable)return;const patterns=nailPatterns(n),p=patterns.find(x=>x.id===id),d=n.decorations.find(x=>x.id===id);if(p)singlePatch(patternPatch(patterns.map(x=>x.id===id?{...x,locked:!x.locked}:x)));else if(d)singlePatch({decorations:n.decorations.map(x=>x.id===id?{...x,locked:!x.locked}:x)});else{const key=id as Nail['lockedLayers'][number];singlePatch({lockedLayers:n.lockedLayers.includes(key)?n.lockedLayers.filter(x=>x!==key):[...n.lockedLayers,key]})}}
 function removeLayer(id:string){
  const patterns=nailPatterns(n),p=patterns.find(x=>x.id===id),d=n.decorations.find(x=>x.id===id)
  if(p){if(!p.locked&&!n.lockedLayers.includes('pattern'))singlePatch(patternPatch(patterns.filter(x=>x.id!==id)));setDrawingId(undefined);return}
  if(d){if(!d.locked)singlePatch({decorations:n.decorations.filter(x=>x.id!==id)});setActiveDecor(undefined);return}
  if(n.lockedLayers.includes(id as Nail['lockedLayers'][number]))return
  if(id==='surface')singlePatch({finish:'gloss'})
  if(id==='artwork')setConfirm('free')
 }
 function moveLayer(id:string,direction:number){const patterns=nailPatterns(n),isPattern=patterns.some(x=>x.id===id);if(isPattern&&n.lockedLayers.includes('pattern'))return;const items=isPattern?patterns:[...n.decorations],a=items.findIndex(x=>x.id===id),b=a+direction;if(a<0||b<0||b>=items.length||items[a].locked||items[b].locked)return;[items[a],items[b]]=[items[b],items[a]];singlePatch(isPattern?patternPatch(items as PatternLayer[]):{decorations:items as Decoration[]})}
 function openCopy(id?:string){setDrawingId(undefined);setCopy({kind:id?(nailPatterns(n).some(x=>x.id===id)?'pattern':'decor'):'full',id,targets:[(selected+5)%10]})}
 const actionProps={n,hidden,onHide:toggleHidden,onLock:toggleLock,onRemove:removeLayer,onMove:moveLayer,onCopy:openCopy}
 function itemActions(id:string){return <ContentActions {...actionProps} id={id}/>}
 function doCopy(){
  if(!copy)return
  const selectedCopy=copy
  applyChanges(copy.targets,item=>{
   if(selectedCopy.kind==='pattern'){
    const p=nailPatterns(n).find(x=>x.id===selectedCopy.id);if(!p||item.artwork||item.lockedLayers.includes('pattern'))return null
    const layers=[...nailPatterns(item),{...structuredClone(p),id:crypto.randomUUID(),locked:false}]
    if(layers.length>12||layers.reduce((sum,l)=>sum+l.strokes.reduce((count,s)=>count+s.points.length,0),0)>4096)return null
    return patternPatch(layers)
   }
   if(selectedCopy.kind==='decor'){
    const d=n.decorations.find(x=>x.id===selectedCopy.id);if(!d||item.decorations.length>=12)return null
    return {decorations:[...item.decorations,{...structuredClone(d),id:crypto.randomUUID(),locked:false}]}
   }
   if(item.lockedLayers.length||nailPatterns(item).some(x=>x.locked)||item.decorations.some(x=>x.locked))return null
   return {...structuredClone(n),lockedLayers:[],...patternPatch(nailPatterns(n).map(p=>({...structuredClone(p),id:crypto.randomUUID(),locked:false}))),decorations:n.decorations.map(d=>({...structuredClone(d),id:crypto.randomUUID(),locked:false}))}
  },'有锁定内容、属于不支持此图案的成品款，或已达到数量上限')
  setCopy(null)
 }
 function addDecoration(type:'pearl'|'gem'){
  if(n.decorations.length>=12){tell('这根指甲已有 12 颗饰品，删除一颗后可继续添加。',true);return}
  const id=crypto.randomUUID();singlePatch({decorations:[...n.decorations,{id,type,locked:false,x:50,y:78+(n.decorations.length%3)*16,size:type==='pearl'?8:10}]});setScope('single');setActiveDecor(id);setView('single');tell(`已在${nailName(selected)}添加${type==='pearl'?'珍珠':'水钻'}`)
 }
 function addGradient(){
  const layers=nailPatterns(n);if(n.lockedLayers.includes('pattern')){tell('图案已锁定，请在“当前甲片”中解锁。',true);return}if(layers.length>=12){tell('这根指甲已有 12 项图案，请删除一项后继续。',true);return}
  const id=crypto.randomUUID();singlePatch(patternPatch([...layers,{id,type:'gradient',accent:'#E8CCC2',patternSize:22,settings:defaultPatternSettings(),locked:false,drawMode:'preset',strokes:[]}]));changeTool('pattern');setActivePattern(id)
 }
 function readDemoLibrary():SavedDesign[]{const value=JSON.parse(localStorage.getItem(demoLibraryKey)||'[]');if(!Array.isArray(value))throw new Error('作品列表暂时无法读取');return value}
 async function storeDesign(doc:Design){
  if(studio.sandbox){const rows=readDemoLibrary(),existing=rows.find(row=>row.document.id===doc.id),now=new Date().toISOString();localStorage.setItem(demoLibraryKey,JSON.stringify([{document:doc,created_at:existing?.created_at||now,updated_at:now},...rows.filter(row=>row.document.id!==doc.id)]));return}
  await api(`/api/designs/${doc.id}`,{method:'PUT',body:JSON.stringify(doc)})
 }
 function snapshot(){return {...design,name:nameDraft.trim()||'未命名作品'}}
 async function save():Promise<boolean>{
  if(busy.current||!ready)return false;busy.current=true;setSaving(true)
  setNotice(null)
  try{const doc=snapshot();await storeDesign(doc);commit(doc);tell('已保存到“我的作品”');return true}catch{tell('作品未保存，请重试。当前设计仍保留在工作台。',true);return false}finally{busy.current=false;setSaving(false)}
 }
 async function switchDesign(next:Design){
  if(busy.current||!ready)return;busy.current=true;setSaving(true)
  setNotice(null)
  try{await storeDesign(snapshot());commit(next);stopDetail();setScope('single');setSelected(1);setSide('left');setView('set');setTool('color');setColorSection('base');setStyles(null);setGallery(false);setConfirm(null);setFinished(false);tell('已打开设计，之前的设计已保留在“我的作品”')}catch{tell('当前设计尚未保留，请重试后再切换。',true)}finally{busy.current=false;setSaving(false)}
 }
 async function openGallery(){setGallery(true);setGalleryLoading(true);setGalleryError('');try{setSaved(studio.sandbox?readDemoLibrary():await api<SavedDesign[]>('/api/designs'))}catch{setGalleryError('作品暂时无法读取，请重试。')}finally{setGalleryLoading(false)}}
 function openRow(row:SavedDesign,duplicate=false){
  if(row.document.id===design.id){if(duplicate)void switchDesign(duplicateDesign(snapshot()));else setGallery(false);return}
  void switchDesign(duplicate?duplicateDesign(row.document):row.document)
 }
 function resetCurrent(){
  if(confirm==='new'){void switchDesign({...newDesign(),name:'未命名作品',nails:Array.from({length:10},baseNail)});return}
  if(confirm==='free'){if(n.lockedLayers.includes('artwork')){tell('完整款式已锁定，请先解锁。',true);return}singlePatch({artwork:undefined});setConfirm(null);setTool('color');return}
  if(confirm==='reset'){
   if(n.lockedLayers.length||nailPatterns(n).some(p=>p.locked)||n.decorations.some(d=>d.locked)){tell('这根指甲有锁定内容，请先在“当前甲片”中解锁。',true);return}
   singlePatch(baseNail())
  }else if(confirm==='clear'){
   singlePatch({...(!n.artwork&&!n.lockedLayers.includes('pattern')?patternPatch(nailPatterns(n).filter(p=>p.locked)):{}),decorations:n.decorations.filter(d=>d.locked)})
  }
  stopDetail();setConfirm(null)
 }
 const actionError=notice?.error?notice.text:''
 const exportDesign={...design,name:nameDraft.trim()||'未命名作品'}
 return <div className={`app-shell atelier-shell organized-workspace ${toolsOpen?'':'tools-collapsed'} preview-${view}`}><header className="topbar">
 <div className="brand"><span className="brand-mark">j.</span><span>甲间<small>NAIL ATELIER</small></span></div>
 <button className="project-title project-name" disabled={!editable} onClick={()=>setRename(true)} title="修改作品名称"><span>{studio.sandbox?'体验草稿 · 单独保留':'当前作品'}</span><strong>{design.name}</strong></button>
 <div className="top-actions"><span className={`save-state ${error?'error':''}`} role="status">{status}</span><button className="ghost" disabled={!editable} onClick={()=>setConfirm('new')}><Plus size={16}/><span>新建</span></button><button className="ghost library-trigger" onClick={openGallery}><Layers size={16}/><span>我的作品</span></button><button className="ghost save-button" disabled={!editable} onClick={()=>void save()}><Save size={16}/><span>{saving?'保存中…':'保存作品'}</span></button><button className="primary" disabled={!editable} onClick={()=>{setDrawingId(undefined);setFinished(true)}}>完成</button></div>
 </header><header className="mobile-header"><button className="icon-button" aria-label="打开作品菜单" onClick={()=>setMobileMenu(true)}><Menu size={20}/></button><button className="mobile-title" disabled={!editable} aria-label="修改作品名称" onClick={()=>setRename(true)}><strong>{design.name}</strong><span>{status}</span></button><button className="primary" disabled={!editable} onClick={()=>{stopDetail();setFinished(true)}}>完成</button></header>{error&&<div className="error-banner" role="alert">{error}<button onClick={()=>ready?studio.retry():window.location.reload()}>重试</button></div>}
 {notice&&<div className={`workspace-notice ${notice.error?'is-error':''}`} role={notice.error?'alert':'status'}><span>{notice.text}</span><button aria-label="关闭提示" onClick={()=>setNotice(null)}>关闭</button></div>}
 <main className="workspace" aria-busy={!editable}><section className="preview-panel" aria-label="甲片与手部预览">
 <div className="preview-toolbar"><div className="segmented view-tabs" role="tablist" aria-label="预览方式">{([{id:'single',label:'单甲'},{id:'five',label:'五指'},{id:'set',label:'十指'},{id:'hand',label:'上手预览'}] as const).map(v=><button key={v.id} role="tab" aria-selected={view===v.id} className={view===v.id?'active':''} onClick={()=>{setDrawingId(undefined);setView(v.id)}}>{v.label}</button>)}</div><button className="material-lab-trigger" onClick={()=>{setDrawingId(undefined);setCatStudy(true)}}>猫眼体验</button><button className="material-lab-trigger" disabled={!editable} onClick={()=>{setDrawingId(undefined);setMaterialLab(true)}}>立体试色</button><div className="history"><button className="icon-button" aria-label="撤销" title="撤销" disabled={!studio.canUndo||!editable} onClick={()=>{setDrawingId(undefined);studio.undo()}}><Undo2 size={18}/></button><button className="icon-button" aria-label="重做" title="重做" disabled={!studio.canRedo||!editable} onClick={()=>{setDrawingId(undefined);studio.redo()}}><Redo2 size={18}/></button></div></div>
 {(view==='set'||view==='five')&&<div className="arrangement-toolbar"><ChoiceStrip label="排列" value={arrangement} options={arrangements.map(a=>({value:a.id,label:a.label}))} onChange={changeArrangement} className="arrangement-choices"/>{view==='five'&&<div className="segmented"><button className={side==='left'?'active':''} onClick={()=>select(selected%5)}>左手</button><button className={side==='right'?'active':''} onClick={()=>select(selected%5+5)}>右手</button></div>}<button className="text-button" onClick={()=>setView('single')}>放大{nailName(selected)}</button></div>}
 {view==='single'&&<div className="detail-return"><button className="text-button" onClick={()=>{setDrawingId(undefined);setView('set')}}>返回十指</button>{!n.artwork&&!drawing&&<div className="workbench-light-controls"><button aria-expanded={lightControlsOpen} onClick={()=>{const open=!lightControlsOpen;setLightControlsOpen(open);setLightPlaying(open);setLight(0)}}>{lightControlsOpen?'收起灯光':'摇光对照'}</button>{lightControlsOpen&&<div className="workbench-light-options"><label>灯光位置<input aria-label="展示灯光位置" type="range" min={-25} max={25} value={light} onChange={e=>{setLightPlaying(false);setLight(Number(e.target.value))}}/></label><button onClick={()=>{setLightPlaying(false);setLight(0)}}>归位</button></div>}</div>}</div>}
 {hiddenCount>0&&<div className="comparison-notice">有内容暂时隐藏，仅用于预览对照。<button onClick={()=>setHiddenLayers({})}>显示全部</button></div>}
 {drawing&&<div className="drawing-toolbar"><span>{drawing.type==='dots'?'点击甲面放圆点':'按住拖动画线'} · 仅{nailName(selected)}</span><button onClick={()=>setDrawingId(undefined)}>完成绘制</button></div>}
  <div className={`preview-stage ${view} ${saving?'is-busy':''}`} onPointerMove={e=>{if(lightControlsOpen&&view==='single'&&!n.artwork&&!lightPlaying&&!activeDecor&&!drawing){const r=e.currentTarget.getBoundingClientRect();setLight(((e.clientX-r.left)/r.width-.5)*35)}}} onPointerLeave={()=>{if(lightControlsOpen&&!lightPlaying)setLight(0)}}>
   {(view==='set'||view==='five')&&arrangement==='jewel'&&<JewelPreview affected={actualScope!=='single'?editingTargets:[]} design={previewDesign} selected={selected} hand={view==='five'?side:undefined} onSelect={select} onDetail={i=>{select(i);setView('single')}}/>}
   {(view==='set'||view==='five')&&arrangement==='cupped'&&<GesturePreview affected={actualScope!=='single'?editingTargets:[]} design={previewDesign} selected={selected} hand={view==='five'?side:undefined} onSelect={select} onDetail={i=>{select(i);setView('single')}}/>}
   {(view==='set'||view==='five')&&arrangement==='original'&&<div className={`set-layout fan-layout ${view==='five'?'five-nails':'ten-nails'}`}>{(view==='five'?[side==='left'?0:1]:[0,1]).map(hand=><div className="nail-row" key={hand}>{Array.from({length:5},(_,i)=>{const idx=hand*5+i;return <button aria-label={`编辑${nailName(idx)}`} aria-pressed={selected===idx} className={`sheet-nail ${selected===idx?'selected':''} ${actualScope!=='single'&&editingTargets.includes(idx)?'scope-affected':''}`} key={idx} onClick={()=>select(idx)} onDoubleClick={()=>{select(idx);setView('single')}}><div className={`nail-wrap ${design.nails[idx].length}`}><NailArt nail={previewDesign.nails[idx]}/></div><span>{fingerNames[i]}</span>{selected===idx&&<span className="selected-pin"/>}</button>})}<span className="hand-label">{hand===0?'LEFT / 左手':'RIGHT / 右手'}</span></div>)}</div>}
   {view==='single'&&<div className="single-layout"><button className="icon-button previous" aria-label="上一个指甲" onClick={()=>select((selected+9)%10)}><ArrowLeft size={20}/></button><div className={`single-nail ${n.length}`}><NailArt key={`${selected}:${drawing?.id||'view'}`} nail={displayN} light={light} drawing={drawing?{layerId:drawing.id,onStroke:points=>{
 const layers=nailPatterns(n),current=layers.find(l=>l.id===drawing.id)
 if(!current||current.locked||n.lockedLayers.includes('pattern'))return
 const total=layers.reduce((sum,l)=>sum+l.strokes.reduce((count,s)=>count+s.points.length,0),0)
 if(current.strokes.length>=64||total+points.length>4096){tell('这根指甲的绘制内容已满，可删除部分笔画后继续。',true);return}
 singlePatch(patternPatch(layers.map(l=>l.id===drawing.id?{...l,strokes:[...l.strokes,{points}]}:l)))
 }}:undefined} selectedDecor={activeDecor} onDecorSelect={setActiveDecor} onDecorMove={(id,x,y)=>singlePatch({decorations:updateDecoration(n,id,{x,y})})}/></div><button className="icon-button next" aria-label="下一个指甲" onClick={()=>select((selected+1)%10)}><ArrowRight size={20}/></button><div className="single-label">{nailName(selected)}<small>{shapeNames[n.shape]} · {finishNames[n.finish]}</small></div></div>}
   {view==='hand'&&<div className="hand-layout"><HandPreview design={previewDesign} side={side} selected={selected} onSelect={select}/><div className="segmented hand-switch"><button className={side==='left'?'active':''} onClick={()=>select(selected%5)}>左手</button><button className={side==='right'?'active':''} onClick={()=>select(selected%5+5)}>右手</button></div></div>}
   <div className="preview-note">{drawing?'可用上方撤销退回上一笔':(view==='set'||view==='five')?'点击选中指甲，再放大编辑':view==='single'?(!n.artwork&&n.finish==='cat'?(lightControlsOpen?'移动灯光查看反光变化':'点击摇光对照查看反光变化'):n.decorations.length?'拖动饰品，找到喜欢的位置':'点击工具修改当前甲片'):'拖动转动手模 · 点击甲片选择手指'}</div>
  </div>{view!=='set'&&<div className="finger-strip" aria-label="选择手指">{previewDesign.nails.map((x,i)=><button key={i} aria-label={`选择${nailName(i)}`} aria-pressed={selected===i} className={`${selected===i?'active':''} ${actualScope!=='single'&&editingTargets.includes(i)?'scope-affected':''}`} onClick={()=>select(i)}><span className="mini-nail"><NailArt nail={x}/></span><small>{i===0?'左拇':i===5?'右拇':fingerNames[i%5].replace('指','')}</small></button>)}</div>} <footer className="preview-footer"><button className="text-button" disabled={!editable} onClick={()=>{stopDetail();setInspire(true)}}>找一点灵感</button><button className="text-button" disabled={!editable} onClick={()=>setStyles('set')}>选择款式</button><button className="text-button" disabled={!editable} onClick={()=>{setDrawingId(undefined);setFinished(true)}}>查看作品与导出</button></footer>
 </section><aside className="tools-panel" aria-label="设计工具"><button className="mobile-tool-toggle" aria-expanded={toolsOpen} onClick={()=>setToolsOpen(v=>!v)}>{toolsOpen?'收起工具，查看作品':'展开设计工具'}</button><div className="editing-context"><h2>{nailName(selected)}</h2><button className="text-button" disabled={!editable} onClick={()=>openCopy()}><Copy size={15}/>复制到…</button><details className="nail-more"><summary>更多</summary><div><button disabled={!editable} onClick={()=>setStyles('single')}>选择单片款式</button><button disabled={!editable} onClick={()=>setConfirm('clear')}>清除图案和饰品</button><button disabled={!editable} onClick={()=>setConfirm('reset')}>恢复默认甲片</button></div></details></div>
 <div className="scope-row">{localEditing?<span>仅修改{nailName(selected)}的{tool==='pattern'?'图案':'饰品'}</span>:<ChoiceStrip label="修改范围" value={scope} options={scopeChoices} onChange={setScope} disabled={!editable} className="scope-choices"/>}</div>
 {actualScope!=='single'&&<div className="scope-targets" aria-label="本次修改的手指">{editingTargets.map(i=><span key={i}>{nailName(i)}</span>)}</div>}
 <ToolPanel n={n} ready={editable} tool={tool} setTool={changeTool} patch={patch} activeDecor={activeDecor} setActiveDecor={id=>{setActiveDecor(id);reveal(id)}} add={addDecoration} patchDecor={patchDecor} showSingle={()=>setView('single')} colorSection={colorSection} setColorSection={setColorSection} unlock={toggleLock} itemActions={itemActions} addGradient={addGradient} openStyles={()=>setStyles('single')} freeDesign={()=>setConfirm('free')}
 patternPanel={<PatternStackControls n={n} patch={patch} active={activePattern} select={id=>{setActivePattern(id);reveal(id)}} itemActions={itemActions} drawing={!!drawing} start={()=>{const p=nailPatterns(n).find(p=>p.id===activePattern)||nailPatterns(n).at(-1);if(!p)return;setDrawingId(p.id);setView('single');setScope('single');setLightPlaying(false);setLight(0);setActiveDecor(undefined)}} stop={()=>setDrawingId(undefined)}/>}
 layerPanel={<fieldset disabled={!editable}><DesignLayers {...actionProps} onEdit={editItem}/></fieldset>}/>
 </aside></main>
 <nav className="mobile-dock" aria-label="手机设计工具">{[{id:'shape',label:'甲型',icon:Expand},{id:'color',label:'配色',icon:Palette},{id:'pattern',label:'图案',icon:Flower2},{id:'decor',label:'饰品',icon:Gem}].map(t=><button key={t.id} aria-pressed={tool===t.id&&toolsOpen} onClick={()=>{if(tool===t.id&&toolsOpen){stopDetail();setToolsOpen(false)}else changeTool(t.id)}}><t.icon size={21}/><span>{t.label}</span></button>)}<button disabled={!editable} onClick={()=>{stopDetail();setInspire(true)}}><Sparkles size={21}/><span>灵感</span></button></nav>
 <Dialog open={mobileMenu} title="甲间 · 我的工作台" onClose={()=>setMobileMenu(false)}><p className="mobile-menu-intro">{design.name}<br/>{status}</p><div className="mobile-menu-grid"><button disabled={!editable} onClick={()=>{setMobileMenu(false);void save()}}>保存作品<small>收藏这次设计</small></button><button onClick={()=>{setMobileMenu(false);void openGallery()}}>我的作品<small>继续上次的创作</small></button><button disabled={!editable} onClick={()=>{setMobileMenu(false);setConfirm('new')}}>新建设计<small>开始一套新作品</small></button><button disabled={!editable} onClick={()=>{setMobileMenu(false);setStyles('set')}}>选择款式<small>从现有款式开始</small></button><button onClick={()=>{setMobileMenu(false);stopDetail();setCatStudy(true)}}>猫眼体验<small>探索流动的光感</small></button><button disabled={!editable} onClick={()=>{setMobileMenu(false);stopDetail();setMaterialLab(true)}}>立体试色<small>转动查看甲片质感</small></button></div></Dialog>
 <Dialog open={inspire} title="找一点灵感" onClose={()=>setInspire(false)} wide>{inspire&&<InspirationLibrary design={design} selected={selected} ready={editable} onAtelier={()=>{setInspire(false);setStyles('set')}} onApply={(next,mode)=>{if(!editable)return;commit(next);stopDetail();setHiddenLayers({});setScope('single');setInspire(false);setView(mode==='all'?'set':'single');tell('灵感已应用，可继续修改，也可以撤销恢复')}}/>}</Dialog>
 <Dialog open={styles!==null} title="选择款式" onClose={()=>setStyles(null)} wide>{actionError&&<p className="dialog-error" role="alert">{actionError}</p>}<div className="segmented style-sections"><button aria-pressed={styles==='set'} className={styles==='set'?'active':''} onClick={()=>setStyles('set')}>整套款式</button><button aria-pressed={styles==='single'} className={styles==='single'?'active':''} onClick={()=>setStyles('single')}>单片款式</button></div>
 {styles==='set'?<><p className="dialog-intro">以款式新建作品。当前设计会先保留到“我的作品”。</p><div className="inspiration-grid">{inspirations.map((p,i)=><button key={p.name} className="inspiration-card" disabled={!editable} onClick={()=>void switchDesign({...applyInspiration(design,i),id:crypto.randomUUID()})}><div className="inspiration-nails">{p.colors.map((c,k)=><NailArt key={c} nail={{...baseNail(),color:c,finish:p.finish,pattern:k===1?p.pattern:'none'}}/>)}</div><h3>{p.caption}</h3><span>{p.name} · 可自由修改</span><strong>以此新建</strong></button>)}<button className="inspiration-card" disabled={!editable} onClick={()=>void switchDesign({...applyAtelier(design),id:crypto.randomUUID()})}><div className="inspiration-nails">{atelierStyles.slice(0,3).map(s=><NailArt key={s.id} nail={atelierNail(s.id)}/>)}</div><h3>玫瑰金线</h3><span>完整成品款 · 可改长度和额外饰品</span><strong>以此新建</strong></button></div></>:<><p className="dialog-intro">替换{nailName(selected)}的整片设计。款式自带花纹和光泽不能拆分，可调整长度并另加饰品。替换后可撤销。</p><div className="atelier-style-grid">{atelierStyles.map(style=><button disabled={!editable||n.lockedLayers.length>0||nailPatterns(n).some(p=>p.locked)||n.decorations.some(d=>d.locked)} key={style.id} onClick={()=>{singlePatch(atelierNail(style.id,n.length));stopDetail();setScope('single');setTool('shape');setStyles(null)}}><NailArt nail={atelierNail(style.id)}/><span>{style.name}</span><small>替换这一指</small></button>)}</div>{(n.lockedLayers.length>0||nailPatterns(n).some(p=>p.locked)||n.decorations.some(d=>d.locked))&&<p className="helper">这根指甲有锁定内容，请先在“当前甲片”中解锁，再替换整片款式。</p>}</>}
 </Dialog>
 <Dialog open={gallery} title="我的作品" onClose={()=>setGallery(false)} wide>{actionError&&<p className="dialog-error" role="alert">{actionError}</p>}<div className="gallery-toolbar"><p>{studio.sandbox?'体验作品单独保留在此浏览器。':'保存在本地工作台。'}草稿需点击“保存作品”才会加入这里。</p><button className="ghost" disabled={!editable} onClick={()=>{setGallery(false);setConfirm('new')}}>新建设计</button></div>{galleryLoading?<p role="status">正在加载作品…</p>:galleryError?<div role="alert">{galleryError}<button onClick={openGallery}>重试</button></div>:!saved.length?<div className="empty-gallery"><h3>暂无作品</h3><p>保存作品后，可在这里继续编辑。</p><button className="ghost" onClick={()=>setGallery(false)}>返回工作台</button></div>:<div className="gallery-grid">{saved.map(row=><article className="saved-card" key={row.document.id}><div className="saved-set">{[0,1].map(hand=><div className="saved-nails" key={hand}>{row.document.nails.slice(hand*5,hand*5+5).map((n,i)=><NailArt key={i} nail={n}/>)}</div>)}</div><h3>{row.document.name}</h3><small>{new Date(row.updated_at).toLocaleDateString('zh-CN')}</small><div><button className="ghost" disabled={!editable} onClick={()=>openRow(row)}>编辑作品</button><button className="ghost" disabled={!editable} onClick={()=>openRow(row,true)}>复制为新作品</button></div></article>)}</div>}</Dialog>
 <Dialog open={copy!==null} title={copy?.kind==='full'?'复制整片设计':'添加到其他手指'} onClose={()=>setCopy(null)}><p className="dialog-intro">{copy?.kind==='full'?`将${nailName(selected)}的整片设计复制到所选手指，替换原有内容。有锁定内容的手指会跳过。`:`仅添加所选${copy?.kind==='pattern'?'图案':'饰品'}，保留目标手指的原有设计。`}</p><p className="helper">左右手复制保留原有方向，不自动翻转图案。</p><div className="copy-targets">{design.nails.map((_,i)=>i===selected?null:<label key={i}><input type="checkbox" checked={copy?.targets.includes(i)||false} onChange={e=>setCopy(old=>old?{...old,targets:e.target.checked?[...old.targets,i]:old.targets.filter(x=>x!==i)}:old)}/>{nailName(i)}</label>)}</div><div className="dialog-actions"><button className="ghost" onClick={()=>setCopy(null)}>取消</button><button className="primary" disabled={!editable||!copy?.targets.length} onClick={doCopy}>{copy?.kind==='full'?'复制整片':'添加所选项'}</button></div></Dialog>
 <Dialog open={confirm!==null} title={confirm==='new'?'新建设计':confirm==='clear'?'清除图案和饰品？':confirm==='free'?'改为自由设计？':'恢复默认甲片？'} onClose={()=>setConfirm(null)}>
 {actionError&&<p className="dialog-error" role="alert">{actionError}</p>}<p className="dialog-intro">{confirm==='new'?'当前设计会先保留到“我的作品”，再开始一套新设计。':confirm==='clear'?`清除${nailName(selected)}未锁定的额外图案和饰品。甲型、长度、底色、质感及完整成品款保留。`:confirm==='free'?`移除${nailName(selected)}的完整成品图案，保留长度和额外饰品，之后可重新配色和添加图案。`:`将${nailName(selected)}恢复为默认椭圆甲型、中长、粉色亮面，并移除图案和饰品。有锁定内容时不会执行。`}</p><p className="helper">修改后可撤销。</p><div className="dialog-actions"><button className="ghost" disabled={saving} onClick={()=>setConfirm(null)}>取消</button><button className="primary" disabled={!editable} onClick={resetCurrent}>{saving?'正在保留…':confirm==='new'?'保留并新建':confirm==='clear'?'清除未锁定内容':confirm==='free'?'移除成品图案':'恢复默认甲片'}</button></div></Dialog>
 <Dialog open={rename} title="作品名称" onClose={()=>{setNameDraft(design.name);setRename(false)}}><label className="name-field">名称<input value={nameDraft} maxLength={60} disabled={!editable} onChange={e=>setNameDraft(e.target.value)}/></label><div className="dialog-actions"><button className="ghost" onClick={()=>{setNameDraft(design.name);setRename(false)}}>取消</button><button className="primary" disabled={!editable} onClick={()=>{commit({...design,name:nameDraft.trim()||'未命名作品'});setRename(false)}}>确定</button></div></Dialog>
 <FinishDialog open={finished} design={exportDesign} arrangement={arrangement} onArrangement={changeArrangement} onClose={()=>{commit({...design,name:nameDraft.trim()||'未命名作品'});setFinished(false)}} saving={saving} onSave={save} onName={setNameDraft} nameValue={nameDraft} actionError={actionError}/>
 {catStudy&&<MaterialLabBoundary onClose={()=>setCatStudy(false)}><Suspense fallback={<div className="loading-overlay">正在打开猫眼体验…</div>}><CatEyeStudy onClose={()=>setCatStudy(false)}/></Suspense></MaterialLabBoundary>}
 {materialLab&&<MaterialLabBoundary onClose={()=>setMaterialLab(false)}><Suspense fallback={<div className="loading-overlay">正在打开立体试色…</div>}><MaterialLab nail={n} nailLabel={nailName(selected)} onClose={()=>setMaterialLab(false)}/></Suspense></MaterialLabBoundary>}
 {!ready&&!error&&<div className="loading-overlay"><LoaderCircle className="spin"/>正在打开工作台…</div>}
 </div>
}
