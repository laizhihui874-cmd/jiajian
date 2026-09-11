import {ArrowDown,ArrowUp,Eye,EyeOff,LockKeyhole,Trash2,UnlockKeyhole} from 'lucide-react'
import type {Design,Nail} from '../shared/design'
import {atelierStyles,finishNames,patternNames,shapeNames} from '../shared/design'
import {designSummary} from '../shared/designDetails'
import {nailPatterns} from '../shared/patternLayers'

type LayerRow={id:string;name:string;detail:string;tool:string;locked:boolean;removable:boolean;group?:'decor'|'pattern'}
export function DesignLayers({n,hidden,onHide,onLock,onRemove,onEdit,onMove}:{n:Nail;hidden:string[];onHide:(id:string)=>void;onLock:(id:string)=>void;onRemove:(id:string)=>void;onEdit:(tool:string,id?:string)=>void;onMove:(id:string,direction:number)=>void}){
 const patterns=nailPatterns(n)
 const layers:LayerRow[]=[...n.decorations.map((d,i)=>({id:d.id,name:`${d.type==='pearl'?'珍珠':'水钻'} ${i+1}`,detail:'额外饰品',tool:'decor',locked:d.locked,removable:true,group:'decor' as const})).reverse(),...(n.artwork?[{id:'artwork',name:atelierStyles.find(x=>x.id===n.artwork)!.name,detail:'完整款式 · 内含图案不拆分',tool:'pattern',locked:n.lockedLayers.includes('artwork'),removable:true}]:[
 ...patterns.map((p,i)=>({id:p.id,name:`${p.drawMode==='free'?'手绘':''}${patternNames[p.type]} ${i+1}`,detail:`图案 · ${p.accent.toUpperCase()}`,tool:'pattern',locked:p.locked||n.lockedLayers.includes('pattern'),removable:true,group:'pattern' as const})).reverse(),
 {id:'surface',name:finishNames[n.finish],detail:'色胶光感',tool:'color',locked:n.lockedLayers.includes('surface'),removable:n.finish!=='gloss'},
 {id:'base',name:'底色',detail:n.color.toUpperCase(),tool:'color',locked:n.lockedLayers.includes('base'),removable:false},
 ]),{id:'shape',name:shapeNames[n.shape],detail:'甲型与长度',tool:'shape',locked:n.lockedLayers.includes('shape'),removable:false}]
 return <section className="design-layers"><div className="section-title"><h3>这一指的设计清单</h3><span>{layers.length} 项</span></div><p className="helper">图案可以逐层叠加和调整顺序。隐藏仅用于预览对照，不影响保存、导出和模拟价。</p>{n.lockedLayers.includes('pattern')&&<button className="lock-notice" onClick={()=>onLock('pattern')}>整组图案已锁定 · 点击解锁</button>}{layers.map(l=>{
 const items=l.group==='decor'?n.decorations:patterns,index=items.findIndex(x=>x.id===l.id)
 return <article key={l.id} className={`design-layer ${hidden.includes(l.id)?'is-hidden':''}`}><button className="layer-name" onClick={()=>onEdit(l.tool,l.group?l.id:undefined)}><strong>{l.name}</strong><small>{l.detail}</small></button><div className="layer-actions">{l.id!=='shape'&&!(l.id==='surface'&&n.finish==='gloss')&&<button aria-label={`${hidden.includes(l.id)?'显示':'隐藏'}${l.name}`} title="仅预览对照" onClick={()=>onHide(l.id)}>{hidden.includes(l.id)?<EyeOff size={15}/>:<Eye size={15}/>}</button>}<button aria-label={`${l.locked?'解锁':'锁定'}${l.name}`} onClick={()=>onLock(l.id)}>{l.locked?<LockKeyhole size={14}/>:<UnlockKeyhole size={14}/>}</button>{l.removable&&<button disabled={l.locked} aria-label={`删除${l.name}`} onClick={()=>onRemove(l.id)}><Trash2 size={14}/></button>}</div>{l.group&&<div className="layer-order"><button disabled={l.locked||index===items.length-1||items[index+1]?.locked} onClick={()=>onMove(l.id,1)} aria-label={`前移${l.name}`}><ArrowUp size={12}/>前移</button><button disabled={l.locked||index===0||items[index-1]?.locked} onClick={()=>onMove(l.id,-1)} aria-label={`后移${l.name}`}><ArrowDown size={12}/>后移</button></div>}</article>
 })}<p className="helper">锁定后不会被误改。图案之间、饰品之间分别可以调前后顺序。</p></section>
}
export function PriceDetails({design}:{design:Design}){
 const result=designSummary(design)
 return <section className="price-details"><div className="price-heading"><span>整套模拟价 · 十片</span><strong>¥{result.total}</strong></div><p className="price-disclaimer">演示价格，非实际报价。没有购买或付款。</p><div className="price-lines">{result.lines.map(line=><div className="price-line" key={line.label}><div><strong>{line.label}</strong><small>{line.quantity} {line.label.startsWith('另加')?'颗':line.fingers.length?'片':'套'} × ¥{line.unit}{line.fingers.length?` · ${line.fingers.join('、')}`:''}</small></div><b>¥{line.amount}</b></div>)}</div><p className="helper">模拟金额按最终设计组成汇总。同一指的同类图案只计一次，空白手绘层不计费。调色、移动光带、切换观看方式不加价；完整成品款的内含装饰不重复计费。</p><details className="price-rules"><summary>查看演示计价规则</summary><p>基础十片 ¥30；果冻每片 +¥2，哑光 +¥1，细闪 +¥3，镜面或猫眼 +¥4；法式或渐变每片 +¥3，波点或线条 +¥2；额外珍珠每颗 +¥2、水钻 +¥3；完整款每片 +¥8，代替该片的色胶、图案加价。所有数字仅用于功能演示。</p></details></section>
}
