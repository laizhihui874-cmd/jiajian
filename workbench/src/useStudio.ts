import {useCallback,useEffect,useRef,useState} from 'react'
import {baseNail,designSchema,newDesign} from '../shared/design'
import type {Design} from '../shared/design'

export class ApiError extends Error { status:number; constructor(message:string,status:number){super(message);this.status=status} }
const fingerprint=(doc:Design)=>JSON.stringify(designSchema.parse(doc))

export async function api<T>(url:string,options?:RequestInit):Promise<T>{
  const res=await fetch(url,{...options,headers:{'Content-Type':'application/json',...options?.headers}})
  const body=await res.json()
  if(!res.ok)throw new ApiError(body.error||'操作没有完成，请重试',res.status)
  return body as T
}
export type SavedDesign={document:Design;created_at:string;updated_at:string}
export function useStudio(){
  const sandbox=new URLSearchParams(window.location.search).get('demo')==='effects'
  const [design,setDesign]=useState<Design>(()=>{
    if(!sandbox)return newDesign()
    try{const saved=localStorage.getItem('nail-effects-demo-v1');if(saved)return designSchema.parse(JSON.parse(saved))}catch{/* Recover a damaged demonstration independently of the real draft. */}
    return {...newDesign(),name:'光感与图案体验',nails:Array.from({length:10},(_,i)=>({...baseNail(),color:['#861B37','#D9AEA5','#38635C','#D6BA97','#705783'][i%5],finish:i%5===0?'cat':i%5===3?'jelly':'gloss',pattern:i%5===1?'french':i%5===2?'gradient':'none'}))}
  })
  const [ready,setReady]=useState(sandbox)
  const [status,setStatus]=useState('正在打开工作台')
  const [error,setError]=useState('')
  const [history,setHistory]=useState<{past:Design[];future:Design[]}>({past:[],future:[]})
  const current=useRef(design)
  const rev=useRef(0),queue=useRef(Promise.resolve()),initialized=useRef(false)
  const persisted=useRef('')
  const [retry,setRetry]=useState(0)
  useEffect(()=>{
    if(sandbox||initialized.current)return
    let active=true
    api<{document:Design|null;revision:number}>('/api/draft').then(r=>{
      if(!active)return
      const doc=r.document?designSchema.parse(r.document):current.current
      persisted.current=r.document?fingerprint(doc):''
      current.current=doc;setDesign(doc);rev.current=r.revision;initialized.current=true
      setReady(true);setError('');setStatus('草稿已恢复')
    }).catch(e=>{if(active){setStatus('暂时无法连接');setError(e.message)}})
    return()=>{active=false}
  },[retry,sandbox])
  useEffect(()=>{
    if(!ready)return
    if(sandbox){try{localStorage.setItem('nail-effects-demo-v1',JSON.stringify(design));persisted.current=fingerprint(design);setStatus('体验草稿已保留');setError('')}catch{setStatus('体验草稿未保留');setError('当前浏览器无法保留体验草稿，可保存到作品集。')}return}
    const snapshot=design,key=fingerprint(snapshot)
    if(key===persisted.current){setStatus('草稿已保存');setError('')}
    else setStatus('等待保存')
    const timer=setTimeout(()=>{
      queue.current=queue.current.then(async()=>{
        if(snapshot!==current.current)return
        if(key===persisted.current){setStatus('草稿已保存');setError('');return}
        setStatus('正在保存草稿')
        try{
          let result:{revision:number}
          try{
            result=await api('/api/draft',{method:'PUT',body:JSON.stringify({document:snapshot,revision:rev.current})})
          }catch(e){
            if(!(e instanceof ApiError)||e.status!==409)throw e
            const remote=await api<{document:Design|null;revision:number}>('/api/draft')
            const remoteKey=remote.document?fingerprint(remote.document):''
            if(remoteKey===key){result={revision:remote.revision}}
            else if(remoteKey===persisted.current){
              result=await api('/api/draft',{method:'PUT',body:JSON.stringify({document:snapshot,revision:remote.revision})})
            }else throw new Error('其他窗口修改了草稿。当前设计仍在这里，请先点“保存作品”保留，再刷新页面。')
          }
          rev.current=result.revision;persisted.current=key
          if(snapshot===current.current){setStatus('草稿已保存');setError('')}
        }catch(e){setStatus('草稿未保存');setError((e as Error).message)}
      })
    },650)
    return()=>clearTimeout(timer)
  },[design,ready,retry,sandbox])
  useEffect(()=>{
    const handler=(e:BeforeUnloadEvent)=>{if(ready&&fingerprint(current.current)!==persisted.current)e.preventDefault()}
    window.addEventListener('beforeunload',handler);return()=>window.removeEventListener('beforeunload',handler)
  },[ready])
  const commit=useCallback((doc:Design)=>{
    if(JSON.stringify(doc)===JSON.stringify(current.current))return
    const prev=current.current
    setHistory(h=>({past:[...h.past,prev].slice(-80),future:[]}));current.current=doc;setDesign(doc)
  },[])
  const undo=()=>{if(!history.past.length)return;const doc=history.past[history.past.length-1],old=current.current;setHistory({past:history.past.slice(0,-1),future:[old,...history.future]});current.current=doc;setDesign(doc)}
  const redo=()=>{if(!history.future.length)return;const doc=history.future[0],old=current.current;setHistory({past:[...history.past,old],future:history.future.slice(1)});current.current=doc;setDesign(doc)}
  return{sandbox,design:designSchema.parse(design),commit,ready,status,error,undo,redo,canUndo:history.past.length>0,canRedo:history.future.length>0,retry:()=>setRetry(x=>x+1)}
}
