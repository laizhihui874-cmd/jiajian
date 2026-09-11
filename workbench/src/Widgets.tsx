import {useEffect,useRef} from 'react'
import type {ReactNode} from 'react'
import {X} from 'lucide-react'
import type {Design} from '../shared/design'
import {renderNail} from './nailRenderer'
import {gestureLayout,gestureNailSize} from './gestureLayout'
import type {Arrangement} from './gestureLayout'
export function Dialog({open,title,children,onClose,wide=false}:{open:boolean;title:string;children:ReactNode;onClose:()=>void;wide?:boolean}){
 const ref=useRef<HTMLDialogElement>(null)
 useEffect(()=>{const el=ref.current;if(open&&!el?.open)el?.showModal();if(!open&&el?.open)el.close()},[open])
 return <dialog ref={ref} className={`dialog ${wide?'wide':''}`} onCancel={onClose} onClick={e=>{if(e.target===e.currentTarget)onClose()}}><header><div><span className="eyebrow">YOUR LITTLE COLLECTION</span><h2>{title}</h2></div><button className="icon-button" aria-label="关闭弹窗" onClick={onClose}><X size={20}/></button></header>{children}</dialog>
}
export function Range({label,value,min,max,onChange,suffix=''}:{label:string;value:number;min:number;max:number;onChange:(n:number)=>void;suffix?:string}){
 return <label className="range-field"><span>{label}<b>{Math.round(value)}{suffix}</b></span><input type="range" min={min} max={max} value={value} onChange={e=>onChange(Number(e.target.value))}/></label>
}
export async function exportDesign(design:Design,arrangement:Arrangement='original'){
 const nails=await Promise.all(design.nails.map(n=>renderNail(n)))
 const canvas=document.createElement('canvas');canvas.width=1600;canvas.height=1600;const ctx=canvas.getContext('2d')!
 ctx.fillStyle='#F5F0E9';ctx.fillRect(0,0,1600,1600);ctx.fillStyle='#513E46';ctx.font='38px Georgia';ctx.fillText('JIA JIAN / 甲间',120,145);ctx.strokeStyle='#D6C8BE';ctx.beginPath();ctx.moveTo(120,200);ctx.lineTo(1480,200);ctx.stroke()
 if(arrangement==='cupped'){
  const layout=gestureLayout(),scale=1360/layout.width
  for(const p of layout.nails){const size=gestureNailSize(p.h,design.nails[p.index].length);ctx.save();ctx.translate(120+p.x*scale,280+p.y*scale);ctx.rotate(p.angle*Math.PI/180);ctx.shadowColor='#51332625';ctx.shadowBlur=15;ctx.shadowOffsetY=10;ctx.drawImage(nails[p.index],-size.width*scale/2,-size.height*scale/2,size.width*scale,size.height*scale);ctx.restore()}
 }else if(arrangement==='jewel'){
  ctx.fillStyle='#8B7B7E';ctx.font='22px sans-serif'
  ctx.fillText('左手',100,460);ctx.fillText('右手',100,1020)
  nails.forEach((c,i)=>{const h=({short:285,medium:335,long:380}[design.nails[i].length])*[.94,1,1.03,.99,.86][i%5],x=310+(i%5)*255,y=280+Math.floor(i/5)*555;ctx.save();ctx.shadowColor='#51332625';ctx.shadowBlur=18;ctx.shadowOffsetY=12;ctx.drawImage(c,x-105,y+(390-h)/2,210,h);ctx.restore()})
 }else nails.forEach((c,i)=>{const h=design.nails[i].length==='short'?285:design.nails[i].length==='long'?400:350;ctx.save();ctx.translate(260+(i%5)*270,360+Math.floor(i/5)*495);ctx.rotate((i%5-2)*.065);ctx.shadowColor='#51332625';ctx.shadowBlur=22;ctx.shadowOffsetY=15;ctx.drawImage(c,-110,0,220,h);ctx.restore()})
 ctx.textAlign='center';ctx.fillStyle='#513E46';ctx.font='46px "Songti SC",serif';ctx.fillText(design.name,800,1440,1350);ctx.fillStyle='#8B7B7E';ctx.font='23px sans-serif';ctx.fillText('十个指尖，一点自己的灵感',800,1510)
 const blob=await new Promise<Blob>((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(new Error('导出未完成')),'image/png'))
 const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`${design.name.replace(/[\\/:*?"<>|]/g,'-')}.png`;a.click();setTimeout(()=>URL.revokeObjectURL(url),10000)
}
