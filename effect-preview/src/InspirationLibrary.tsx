import {useLayoutEffect,useMemo,useRef,useState} from 'react'
import type {Design} from '../shared/design'
import {nailName} from '../shared/design'
import {applyInspirationSet,filterInspirations,hasInspirationLock,inspirationCatalog} from '../shared/inspiration'
import {NailArt} from './NailArt'
import {RandomInspiration} from './RandomInspiration'
import './InspirationLibrary.css'

function FixedInspirationLibrary({design,selected,ready,onApply,onAtelier}:{design:Design;selected:number;ready:boolean;onApply:(d:Design,mode:'all'|'single')=>void;onAtelier:()=>void}){
 const root=useRef<HTMLDivElement>(null)
 const [query,setQuery]=useState(''),[style,setStyle]=useState(''),[colorFamily,setColor]=useState(''),[occasion,setOccasion]=useState('')
 const [active,setActive]=useState<string>(),[mode,setMode]=useState<'all'|'single'>('all'),[source,setSource]=useState(selected),[keepShape,setKeepShape]=useState(true),[keep,setKeep]=useState<number[]>([])
 useLayoutEffect(()=>{root.current?.closest('dialog')?.scrollTo({top:0})},[active])
 const list=filterInspirations({query,style,colorFamily,occasion}),p=inspirationCatalog.find(p=>p.id===active)
 const result=useMemo(()=>p?applyInspirationSet(design,p,{mode,selected,source,keepShape,keep}):undefined,[design,p,mode,selected,source,keepShape,keep])
 function reset(){setQuery('');setStyle('');setColor('');setOccasion('')}
 return <div ref={root} className="inspo-library">
 {!p?<><p className="inspo-intro">先选一套喜欢的，再慢慢改成自己的。所有搭配都能继续编辑。</p>
 <div className="inspo-filters"><label className="inspo-search">搜索灵感<input aria-label="搜索灵感" placeholder="试试：猫眼、法式、雾蓝" value={query} onChange={e=>setQuery(e.target.value)}/></label>{([{label:'风格',value:style,set:setStyle,key:'style'},{label:'色系',value:colorFamily,set:setColor,key:'colorFamily'},{label:'场景',value:occasion,set:setOccasion,key:'occasion'}] as const).map(f=><label key={f.key}>{f.label}<select aria-label={`灵感${f.label}`} value={f.value} onChange={e=>f.set(e.target.value)}><option value="">全部{f.label}</option>{[...new Set(inspirationCatalog.map(p=>p[f.key]))].map(v=><option key={v}>{v}</option>)}</select></label>)}</div>
 <div className="inspo-results"><span role="status">{list.length} 套搭配</span><button className="text-button" onClick={reset}>清除筛选</button></div>
 {list.length?<div className="inspo-grid">{list.map(p=><button className="inspo-card" key={p.id} aria-label={`预览灵感：${p.name}`} onClick={()=>{setActive(p.id);setMode('all');setSource(selected)}}><div className="inspo-card-nails" aria-hidden="true">{p.nails.map((n,i)=><NailArt key={i} nail={n}/>)}</div><div className="inspo-card-caption"><strong>{p.name}</strong><span>{p.style} · {p.colorFamily} · {p.occasion}</span><p>{p.description}</p><small>预览整套 →</small></div></button>)}</div>:<div className="inspo-empty"><h3>还没有符合条件的搭配</h3><p>减少一个筛选条件，或换个关键词试试。</p><button className="ghost" onClick={reset}>查看全部灵感</button></div>}
 <div className="inspo-existing"><span>也可以从完整成品款开始：玫瑰金线</span><button className="text-button" disabled={!ready} onClick={onAtelier}>保留当前作品并新建 →</button></div>
 </>:<><button className="text-button" onClick={()=>setActive(undefined)}>← 返回灵感库</button><div className="inspo-detail-heading"><h3>{p.name}</h3><p>{p.description}</p></div>
 <div className="inspo-mode segmented" role="group" aria-label="灵感套用范围"><button aria-pressed={mode==='all'} className={mode==='all'?'active':''} onClick={()=>setMode('all')}>整套搭配</button><button aria-pressed={mode==='single'} className={mode==='single'?'active':''} onClick={()=>setMode('single')}>只借用一片</button></div>
 {mode==='single'&&<div className="inspo-source"><p>挑选要借用的甲片，应用到 <strong>{nailName(selected)}</strong></p><div>{p.nails.map((n,i)=><button key={i} aria-label={`借用${nailName(i)}款式`} aria-pressed={source===i} className={source===i?'active':''} onClick={()=>setSource(i)}><NailArt nail={n}/><small>{nailName(i)}</small></button>)}</div></div>}
 <label className="inspo-check"><input type="checkbox" checked={keepShape} onChange={e=>setKeepShape(e.target.checked)}/>保留当前甲型和长度</label>
 <div className="inspo-preview-title"><strong>套用后的实际效果</strong><span>{mode==='all'?'点击甲片可保留这一指':'其余九指保持原样'}</span></div>
 <div className="inspo-preview">{[0,1].map(hand=><div className="inspo-hand" key={hand}><span>{hand?'右手':'左手'}</span>{result!.design.nails.slice(hand*5,hand*5+5).map((n,i)=>{const idx=hand*5+i,locked=hasInspirationLock(design.nails[idx]),retained=locked||keep.includes(idx);return <button key={idx} disabled={mode==='single'||locked} className={retained?'retained':''} aria-label={`${retained?'已保留':'保留'}${nailName(idx)}`} aria-pressed={retained} onClick={()=>setKeep(old=>old.includes(idx)?old.filter(x=>x!==idx):[...old,idx])}><NailArt nail={n}/><small>{nailName(idx).replace(hand?'右手':'左手','')}</small><em>{locked?'已锁定':retained?'已保留':''}</em></button>})}</div>)}</div>
 <p className="inspo-apply-note">将修改 {result!.changed.length} 指{result!.retained.length?`，保留 ${result!.retained.length} 指`:''}。含锁定内容的手指整片保留；套用后可用“撤销”恢复。</p>
 <div className="inspo-apply"><button className="ghost" onClick={()=>setActive(undefined)}>再看看其他搭配</button><button className="primary" disabled={!ready||!result!.changed.length} onClick={()=>onApply(result!.design,mode)}>{mode==='all'?'套用这套搭配':`应用到${nailName(selected)}`}</button></div>
 </>}
 </div>
}

export function InspirationLibrary(props:Parameters<typeof FixedInspirationLibrary>[0]){
 const [tab,setTab]=useState<'generate'|'library'>('generate')
 return <div className="inspo-library"><div className="segmented inspiration-entry" role="group" aria-label="灵感方式"><button className={tab==='generate'?'active':''} aria-pressed={tab==='generate'} onClick={()=>setTab('generate')}>生成新灵感</button><button className={tab==='library'?'active':''} aria-pressed={tab==='library'} onClick={()=>setTab('library')}>参考款式库</button></div><div hidden={tab!=='generate'}><RandomInspiration {...props}/></div><div hidden={tab!=='library'}><FixedInspirationLibrary {...props}/></div></div>
}
