import {useEffect,useState} from 'react'
import type {Design} from '../shared/design'
import type {Arrangement} from './gestureLayout'
import {createExportImage,Dialog,downloadImage} from './Widgets'
import {PriceDetails} from './DesignDetails'

type Props={open:boolean;design:Design;arrangement:Arrangement;onArrangement:(a:Arrangement)=>void;onClose:()=>void;onSave:()=>Promise<boolean>;saving:boolean;onName:(name:string)=>void;nameValue:string;actionError:string}
export function FinishDialog({open,design,arrangement,onArrangement,onClose,onSave,saving,onName,nameValue,actionError}:Props){
 const [preview,setPreview]=useState<{url:string;blob:Blob;key:string}>(),[error,setError]=useState(''),[retry,setRetry]=useState(0),[notice,setNotice]=useState('')
 const key=JSON.stringify([design,arrangement])
 useEffect(()=>{
  if(!open)return
  let cancelled=false,url=''
  setError('');setPreview(undefined);setNotice('')
  const timer=setTimeout(()=>{void createExportImage(design,arrangement).then(blob=>{if(cancelled)return;url=URL.createObjectURL(blob);setPreview({url,blob,key})}).catch(()=>{if(!cancelled)setError('图片暂时未生成，请重试。')})},200)
  return()=>{cancelled=true;clearTimeout(timer);if(url)URL.revokeObjectURL(url)}
 },[open,key,retry]) // The serialized key includes all export content.
 return <Dialog open={open} title="完成作品" onClose={onClose} wide>{actionError&&<p className="dialog-error" role="alert">{actionError}</p>}<div className="finish-layout"><section className="finish-preview">{preview?.key===key?<img src={preview.url} alt="将导出的完整十指甲片图"/>:error?<div role="alert">{error}<button onClick={()=>setRetry(v=>v+1)}>重试</button></div>:<p role="status">正在生成作品图…</p>}</section><section className="finish-options"><label className="name-field">作品名称<input value={nameValue} disabled={saving} maxLength={60} onChange={e=>onName(e.target.value)}/></label><h3>图片排列</h3><div className="choice-grid">{([{id:'jewel',name:'珠宝陈列'},{id:'cupped',name:'手心轻拢'},{id:'original',name:'标准排列'}] as const).map(a=><button key={a.id} aria-pressed={arrangement===a.id} className={arrangement===a.id?'active':''} onClick={()=>onArrangement(a.id)}>{a.name}</button>)}</div><p className="helper">导出十指甲片图。临时隐藏的内容已完整显示在预览中；上手示意和观看灯光不包含在图片里。</p><button className="primary" disabled={saving} onClick={async()=>{if(await onSave())setNotice('已保存到“我的作品”')}}>{saving?'保存中…':'保存作品'}</button><button className="ghost" disabled={!preview||preview.key!==key} onClick={()=>{if(preview?.key===key){downloadImage(preview.blob,design.name.trim()||'未命名作品');setNotice('已开始下载图片')}}}>导出十指甲片图</button><p role="status">{notice}</p><button className="text-button" onClick={onClose}>返回修改</button><details className="fine-options"><summary>模拟价格 · 非实际报价</summary><PriceDetails design={design}/></details></section></div></Dialog>
}
