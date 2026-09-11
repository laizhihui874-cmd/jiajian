import {useEffect,useMemo,useRef,useState} from 'react'
import type {PointerEvent} from 'react'
import type {Nail,Decoration} from '../shared/design'
import {nailPatterns,patternPatch} from '../shared/patternLayers'
import {renderNail,renderPhotoNail,nailPaintPoint} from './nailRenderer'

type PaintPoint={x:number;y:number}
type ArtProps={drawing?:{layerId:string;onStroke:(points:PaintPoint[])=>void};nail:Nail;photo?:boolean;selectedDecor?:string;onDecorSelect?:(id:string)=>void;onDecorMove?:(id:string,x:number,y:number)=>void;light?:number;className?:string}
export function NailArt({nail,selectedDecor,onDecorSelect,onDecorMove,light=0,className='',photo=false,drawing}:ArtProps){
  const ref=useRef<HTMLCanvasElement>(null),dragRef=useRef<{id:string;x:number;y:number}|null>(null)
  const [drag,setDrag]=useState<typeof dragRef.current>(null),[failed,setFailed]=useState(false)
  const paintRef=useRef<{points:PaintPoint[];queue:Promise<void>;cancelled:boolean;done:boolean}|null>(null)
  const [painting,setPainting]=useState<PaintPoint[]>([])
  useEffect(()=>()=>{if(paintRef.current)paintRef.current.cancelled=true},[])
  const display=useMemo(()=>{
   const base=drag?{...nail,decorations:nail.decorations.map(d=>d.id===drag.id?{...d,x:drag.x,y:drag.y}:d)}:nail
   return drawing&&painting.length?{...base,...patternPatch(nailPatterns(base).map(l=>l.id===drawing.layerId?{...l,strokes:[...l.strokes,{points:painting}]}:l))}:base
  },[drag,nail,drawing,painting])
  function sample(e:PointerEvent){
   const stroke=paintRef.current;if(!stroke||stroke.done)return
   const box=e.currentTarget.getBoundingClientRect(),x=(e.clientX-box.left)/box.width,y=(e.clientY-box.top)/box.height
   stroke.queue=stroke.queue.then(async()=>{if(stroke.cancelled||stroke.points.length>=256)return;const point=await nailPaintPoint(nail,x,y);if(!point||stroke.cancelled)return
    const last=stroke.points.at(-1);if(last&&Math.hypot(last.x-point.x,last.y-point.y)<0.5)return
    stroke.points.push(point);setPainting([...stroke.points])
   }).catch(()=>{stroke.cancelled=true;setPainting([])})
  }
  function finishPaint(cancel=false){const stroke=paintRef.current;if(!stroke)return;stroke.done=true;if(cancel)stroke.cancelled=true
   void stroke.queue.then(()=>{if(!stroke.cancelled&&stroke.points.length)drawing?.onStroke(stroke.points);if(paintRef.current===stroke){paintRef.current=null;setPainting([])}})
  }
  useEffect(()=>{let active=true;(photo?renderPhotoNail:renderNail)(display,light).then(c=>{if(!active||!ref.current)return;const ctx=ref.current.getContext('2d')!;ctx.clearRect(0,0,400,640);ctx.drawImage(c,0,0);if(selectedDecor){const d=display.decorations.find(d=>d.id===selectedDecor);if(d){ctx.strokeStyle='#865763';ctx.lineWidth=3;ctx.setLineDash([7,6]);ctx.beginPath();ctx.arc(d.x*4,d.y*4,(d.size+4)*4,0,Math.PI*2);ctx.stroke();ctx.setLineDash([])}}setFailed(false)}).catch(()=>{if(active)setFailed(true)});return()=>{active=false}},[display,selectedDecor,light,photo])
  function pos(e:PointerEvent){const r=e.currentTarget.getBoundingClientRect();return{x:Math.max(12,Math.min(88,(e.clientX-r.left)/r.width*100)),y:Math.max(20,Math.min(140,(e.clientY-r.top)/r.height*160))}}
  return <canvas ref={ref} width={400} height={640} role="img" aria-label={failed?'甲片素材加载失败':'写实甲片预览'} className={`nail-art ${className}`} style={{touchAction:onDecorMove||drawing?'none':undefined,cursor:drawing?'crosshair':undefined}}
    onPointerDown={e=>{if(drawing){if(e.button!==0)return;e.stopPropagation();if(paintRef.current)return;paintRef.current={points:[],queue:Promise.resolve(),cancelled:false,done:false};e.currentTarget.setPointerCapture(e.pointerId);sample(e);return}if(!onDecorMove)return;const {x,y}=pos(e),d=[...nail.decorations].reverse().find(d=>!d.locked&&Math.hypot(d.x-x,d.y-y)<=d.size+6);if(!d)return;onDecorSelect?.(d.id);dragRef.current={id:d.id,x:d.x,y:d.y};setDrag(dragRef.current);e.currentTarget.setPointerCapture(e.pointerId)}}
    onPointerMove={e=>{if(drawing){e.stopPropagation();if(nailPatterns(nail).find(l=>l.id===drawing.layerId)?.type==='lines')sample(e);return}if(!dragRef.current)return;dragRef.current={id:dragRef.current.id,...pos(e)};setDrag(dragRef.current)}}
    onPointerUp={()=>{if(drawing){finishPaint();return}const d=dragRef.current;if(d)onDecorMove?.(d.id,d.x,d.y);dragRef.current=null;setDrag(null)}}
    onPointerCancel={()=>{finishPaint(true);dragRef.current=null;setDrag(null)}}/>
}
export function updateDecoration(nail:Nail,id:string,patch:Partial<Decoration>):Decoration[]{return nail.decorations.map(d=>d.id===id&&!d.locked?{...d,...patch}:d)}
