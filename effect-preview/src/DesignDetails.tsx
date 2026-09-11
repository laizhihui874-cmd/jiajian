import type {Design,Nail} from '../shared/design'
import {atelierStyles,finishNames,patternNames,shapeNames} from '../shared/design'
import {designSummary} from '../shared/designDetails'
import {nailPatterns} from '../shared/patternLayers'

type Actions={n:Nail;hidden:string[];onHide:(id:string)=>void;onLock:(id:string)=>void;onRemove:(id:string)=>void;onMove:(id:string,direction:number)=>void;onCopy?:(id:string)=>void}
export function ContentActions({id,n,hidden,onHide,onLock,onRemove,onMove,onCopy}:Actions&{id:string}){
 const patterns=nailPatterns(n),p=patterns.find(x=>x.id===id),d=n.decorations.find(x=>x.id===id)
 const locked=p?(p.locked||n.lockedLayers.includes('pattern')):d?d.locked:n.lockedLayers.includes(id as Nail['lockedLayers'][number])
 const group=p?patterns:d?n.decorations:[],index=group.findIndex(x=>x.id===id)
 const removable=!!p||!!d||id==='artwork'||(id==='surface'&&n.finish!=='gloss')
 const lockId=p&&n.lockedLayers.includes('pattern')?'pattern':id
 return <div className="content-actions">{locked&&<button className="text-button" onClick={()=>onLock(lockId)}>已锁定 · 解锁</button>}
 <details><summary>更多操作</summary><div className="content-action-buttons">
 {!locked&&<button onClick={()=>onLock(id)}>锁定</button>}
 {id!=='shape'&&<button onClick={()=>onHide(id)}>{hidden.includes(id)?'恢复显示':'暂时隐藏'} · 仅预览</button>}
 {group.length>0&&<><button disabled={locked||index===group.length-1||group[index+1]?.locked} onClick={()=>onMove(id,1)}>向前一层</button><button disabled={locked||index===0||group[index-1]?.locked} onClick={()=>onMove(id,-1)}>向后一层</button></>}
 {(p||d)&&onCopy&&<button onClick={()=>onCopy(id)}>添加到其他手指</button>}
 {removable&&<button className="danger" disabled={locked} onClick={()=>onRemove(id)}>{id==='surface'?'恢复亮面':id==='artwork'?'改为自由设计':'删除这一项'}</button>}
 </div>{group.length>1&&<p className="helper">仅调整{p?'图案':'饰品'}之间的顺序。</p>}</details>
 </div>
}
export function DesignLayers(props:Actions&{onEdit:(tool:string,id?:string)=>void}){
 const {n,hidden,onEdit}=props
 const items=[{id:'shape',name:'甲型与长度',detail:shapeNames[n.shape],tool:'shape'},...(n.artwork?[{id:'artwork',name:atelierStyles.find(s=>s.id===n.artwork)?.name||'完整款式',detail:'内含图案不能拆分',tool:'shape'}]:[{id:'base',name:'底色',detail:n.color.toUpperCase(),tool:'color'},{id:'surface',name:'质感',detail:finishNames[n.finish],tool:'color'},...nailPatterns(n).map((p,i)=>({id:p.id,name:`${p.drawMode==='free'?'手绘':''}${patternNames[p.type]} ${i+1}`,detail:p.accent.toUpperCase(),tool:'pattern'}))]),...n.decorations.map((d,i)=>({id:d.id,name:`${d.type==='pearl'?'珍珠':'水钻'} ${i+1}`,detail:'额外饰品',tool:'decor'}))]
 return <section className="design-layers"><p className="helper">点击内容继续修改。暂时隐藏只用于预览，保存和导出仍包含它。</p>{items.map(item=><article key={item.id} className={`design-layer ${hidden.includes(item.id)?'is-hidden':''}`}><button className="layer-name" onClick={()=>onEdit(item.tool,item.id)}><strong>{item.name}</strong><small>{item.detail}{hidden.includes(item.id)?' · 暂时隐藏':''}</small></button><ContentActions {...props} id={item.id}/></article>)}</section>
}
export function PriceDetails({design}:{design:Design}){
 const result=designSummary(design)
 return <section className="price-details"><div className="price-heading"><span>整套模拟价 · 十片</span><strong>¥{result.total}</strong></div><p className="price-disclaimer">演示价格，非实际报价。没有购买或付款。</p><div className="price-lines">{result.lines.map(line=><div className="price-line" key={line.label}><div><strong>{line.label}</strong><small>{line.quantity} {line.label.startsWith('另加')?'颗':line.fingers.length?'片':'套'} × ¥{line.unit}{line.fingers.length?` · ${line.fingers.join('、')}`:''}</small></div><b>¥{line.amount}</b></div>)}</div><p className="helper">模拟金额按最终设计组成汇总。同一指的同类图案只计一次，空白手绘层不计费。调色、移动光带、切换观看方式不加价；完整成品款的内含装饰不重复计费。</p><details className="price-rules"><summary>查看演示计价规则</summary><p>基础十片 ¥30；果冻每片 +¥2，哑光 +¥1，细闪 +¥3，镜面或猫眼 +¥4；法式或渐变每片 +¥3，波点或线条 +¥2；额外珍珠每颗 +¥2、水钻 +¥3；完整款每片 +¥8，代替该片的色胶、图案加价。所有数字仅用于功能演示。</p></details></section>
}
