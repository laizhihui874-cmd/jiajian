import {atelierNail,atelierStyles} from '../shared/design'
import type {Nail} from '../shared/design'
import {NailArt} from './NailArt'

export function AtelierLibrary({n,patch}:{n:Nail;patch:(p:Partial<Nail>)=>void}){
 return <section className="atelier-library"><div className="section-title"><h3>玫瑰金线系列</h3><span>5 款成品甲片</span></div><div className="atelier-style-grid">{atelierStyles.map(style=><button key={style.id} aria-label={`选用款式：${style.name}`} aria-pressed={n.artwork===style.id} className={n.artwork===style.id?'active':''} onClick={()=>patch(atelierNail(style.id,n.length))}><NailArt nail={atelierNail(style.id)}/><span>{style.name}</span></button>)}</div><p className="helper">按上方范围选用这一指、左右对应或全部十指。</p></section>
}
export function FinishedStyleControls({n,patch}:{n:Nail;patch:(p:Partial<Nail>)=>void}){
 return <section className="finished-style"><h3>{atelierStyles.find(s=>s.id===n.artwork)?.name}</h3><p>花朵、金线与光泽作为完整款式保留。可以调整长度、搭配其他甲片，也可以在“饰品”里继续添加。</p><h3>长度</h3><div className="choice-grid three">{([{id:'short',name:'短款'},{id:'medium',name:'中长'},{id:'long',name:'长款'}] as const).map(l=><button key={l.id} aria-pressed={n.length===l.id} className={n.length===l.id?'active':''} onClick={()=>patch({length:l.id})}>{l.name}</button>)}</div><button className="ghost free-design-button" onClick={()=>patch({artwork:undefined})}>改为自由设计</button><p className="helper">换为基础甲片后，可自行调整甲型、底色和图案；原成品图案会移除，可以撤销找回。</p></section>
}
