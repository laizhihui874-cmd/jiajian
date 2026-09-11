import type {Nail} from '../shared/design'

const W=400,H=640
const images=new Map<string,Promise<HTMLImageElement>>()
export function loadImage(url:string){
  let pending=images.get(url)
  if(!pending){pending=new Promise<HTMLImageElement>((resolve,reject)=>{const image=new Image();image.onload=()=>resolve(image);image.onerror=()=>{images.delete(url);reject(new Error('甲片素材暂时没有载入'))};image.src=url});images.set(url,pending)}
  return pending
}
function canvas(w=W,h=H){const c=document.createElement('canvas');c.width=w;c.height=h;return c}
const materialCache=new Map<string,Promise<{pixels:ImageData;mid:number}>>()
async function material(shape:Nail['shape'],variant:Nail['variant'],artwork?:Nail['artwork']){
  const key=artwork?`styles/${artwork}`:shape+(variant==='slim'?'_slim':'')
  let pending=materialCache.get(key)
  if(!pending){pending=(async()=>{
    const image=await loadImage(`/assets/nails/${key}.png`)
    const scan=canvas(image.width,image.height),s=scan.getContext('2d',{willReadFrequently:true})!
    s.drawImage(image,0,0);const pixels=s.getImageData(0,0,scan.width,scan.height)
    // Some generated assets use a solid chroma backdrop; derive their mask from those pixels.
    if(pixels.data[0]>180&&pixels.data[1]<100&&pixels.data[2]>180){
      const bg=[pixels.data[0],pixels.data[1],pixels.data[2]],strength=Math.min(bg[0],bg[2])-bg[1]
      for(let i=0;i<pixels.data.length;i+=4){
        const r=pixels.data[i],g=pixels.data[i+1],b=pixels.data[i+2]
        const spill=Math.max(0,Math.min(r,b)-g),alpha=spill<24?1:Math.max(0,1-spill/strength)
        pixels.data[i+3]=alpha<.08?0:Math.round(alpha*255)
        if(alpha>.02){pixels.data[i]=Math.max(0,(r-(1-alpha)*bg[0])/alpha);pixels.data[i+1]=Math.max(0,Math.min(255,(g-(1-alpha)*bg[1])/alpha));pixels.data[i+2]=Math.max(0,(b-(1-alpha)*bg[2])/alpha)}
      }
      s.putImageData(pixels,0,0)
    }

    let x0=scan.width,y0=scan.height,x1=0,y1=0
    for(let y=0;y<scan.height;y++)for(let x=0;x<scan.width;x++){if(pixels.data[(y*scan.width+x)*4+3]>180){x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y)}}
    const c=canvas(),ctx=c.getContext('2d',{willReadFrequently:true})!,sw=x1-x0+1,sh=y1-y0+1
    const scale=Math.min((W-44)/sw,(H-38)/sh),dw=sw*scale,dh=sh*scale
    ctx.drawImage(scan,x0,y0,sw,sh,(W-dw)/2,H-19-dh,dw,dh)
    const data=ctx.getImageData(0,0,W,H),hist=new Array<number>(256).fill(0)
    for(let i=0;i<data.data.length;i+=4){if(data.data[i+3]>240){const l=Math.round((data.data[i]+data.data[i+1]+data.data[i+2])/3);hist[l]++}}
    let mid=128;for(let i=45;i<215;i++)if(hist[i]>hist[mid])mid=i
    return{pixels:data,mid}
  })();materialCache.set(key,pending);pending.catch(()=>materialCache.delete(key))}
  return pending
}
const rgb=(hex:string)=>[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16))
export async function renderPhotoNail(n:Nail,light=0){
  const {pixels,mid}=await material(n.shape,n.variant,n.artwork)
  const c=canvas(),ctx=c.getContext('2d',{willReadFrequently:true})!,paint=canvas(),p=paint.getContext('2d')!
  p.scale(4,4)
  const skin=[237,210,196],base=rgb(n.color).map((v,i)=>Math.round(v*n.opacity+skin[i]*(1-n.opacity)))
  p.fillStyle=`rgb(${base.join(',')})`;p.fillRect(0,0,100,160)
  if(n.pattern==='gradient'){const g=p.createLinearGradient(0,0,0,125);g.addColorStop(0,n.accent);g.addColorStop(1,n.accent+'00');p.fillStyle=g;p.fillRect(0,0,100,160)}
  if(n.pattern==='french'){p.fillStyle=n.accent;p.beginPath();p.moveTo(0,0);p.lineTo(100,0);p.lineTo(100,n.patternSize+8);p.quadraticCurveTo(50,n.patternSize+40,0,n.patternSize+8);p.closePath();p.fill()}
  if(n.pattern==='dots'){p.fillStyle=n.accent;for(let i=0;i<15;i++){p.beginPath();p.arc(24+(i%3)*26+(Math.floor(i/3)%2)*5,24+Math.floor(i/3)*26,n.patternSize/9,0,Math.PI*2);p.fill()}}
  if(n.pattern==='lines'){p.strokeStyle=n.accent;p.lineWidth=n.patternSize/7;p.lineCap='round';for(const y of [65,88]){p.beginPath();p.moveTo(-5,y);p.bezierCurveTo(34,y-40,48,y+50,110,y+10);p.stroke()}}
  const colored=p.getImageData(0,0,W,H),out=ctx.createImageData(W,H)
  for(let i=0;i<out.data.length;i+=4){
    const a=pixels.data[i+3];if(a<100)continue
    if(n.artwork){for(let ch=0;ch<3;ch++)out.data[i+ch]=pixels.data[i+ch];out.data[i+3]=Math.min(255,(a-100)*255/145);continue}
    const lum=(pixels.data[i]+pixels.data[i+1]+pixels.data[i+2])/3
    const shade=Math.max(.35,Math.min(1,lum/mid))
    const spec=Math.max(0,(lum-mid)/(255-mid))*(n.finish==='matte'?.16:1)
    for(let ch=0;ch<3;ch++)out.data[i+ch]=colored.data[i+ch]*shade*(1-spec)+255*spec
    out.data[i+3]=Math.min(255,(a-100)*255/145)
  }
  ctx.putImageData(out,0,0)
  ctx.save();ctx.scale(4,4);ctx.globalCompositeOperation='source-atop'
  if(!n.artwork&&n.finish==='cat'){
    ctx.save();ctx.translate(50+light,80);ctx.rotate(n.catAngle*Math.PI/180)
    const g=ctx.createLinearGradient(-30,0,30,0);g.addColorStop(0,'#fff9cf00');g.addColorStop(.3,'#fff9cf08');g.addColorStop(.48,'#fff7ca9c');g.addColorStop(.53,'#fff8dcbd');g.addColorStop(.7,'#fff4bd18');g.addColorStop(1,'#fff9cf00');ctx.fillStyle=g;ctx.fillRect(-30,-200,60,400);ctx.restore()
  }
  if(!n.artwork&&n.finish==='chrome'){const g=ctx.createLinearGradient(0,0,100,35);g.addColorStop(0,'#15182070');g.addColorStop(.32,'#f1f7ff30');g.addColorStop(.48,'#faffffb0');g.addColorStop(.54,'#10131b70');g.addColorStop(.8,'#eef5ff50');g.addColorStop(1,'#12152360');ctx.fillStyle=g;ctx.fillRect(0,0,100,160)}
  if(!n.artwork&&(n.finish==='glitter'||n.finish==='cat'))for(let i=0;i<360;i++){const x=(i*37.31+13)%100,y=(i*53.27+7)%160;ctx.fillStyle=i%4===0?'#fff6dcaa':'#f9eee95c';ctx.beginPath();ctx.arc(x,y,n.finish==='glitter'?.14+(i%5)*.06:.09,0,Math.PI*2);ctx.fill()}
  paintDecorations(ctx,n)
  ctx.restore()
  return c
}

function paintDecorations(ctx:CanvasRenderingContext2D,n:Nail){
  for(const d of n.decorations){ctx.save();ctx.translate(d.x,d.y);ctx.shadowColor='#45302c55';ctx.shadowBlur=2;ctx.shadowOffsetY=1
    if(d.type==='pearl'){const g=ctx.createRadialGradient(-d.size*.35,-d.size*.35,0,0,0,d.size);g.addColorStop(0,'#fff');g.addColorStop(.45,'#faf3e4');g.addColorStop(.8,'#cfc0aa');g.addColorStop(1,'#8b7e6e');ctx.fillStyle=g;ctx.beginPath();ctx.arc(0,0,d.size,0,Math.PI*2);ctx.fill()}
    else{const g=ctx.createLinearGradient(-d.size,-d.size,d.size,d.size);g.addColorStop(0,'#fff');g.addColorStop(.4,'#a9c1d5');g.addColorStop(.51,'#fff');g.addColorStop(1,'#8fabbc');ctx.fillStyle=g;ctx.beginPath();ctx.moveTo(0,-d.size);ctx.lineTo(d.size,0);ctx.lineTo(0,d.size);ctx.lineTo(-d.size,0);ctx.closePath();ctx.fill();ctx.strokeStyle='#faffff';ctx.lineWidth=.6;ctx.stroke()}
    ctx.restore()
  }
}

let studioRenderer:Promise<ReturnType<typeof import('./materialScene').createMaterialScene>>|undefined
const rendered=new Map<string,HTMLCanvasElement>()
export async function renderNail(n:Nail,light=0,placement?:{rotation:number;mirrored:boolean}){
 if(n.artwork)return renderPhotoNail(n,light)
 const quantized=Math.round(light)
 const key=JSON.stringify({...n,decorations:[],lockedLayers:[],length:'medium',light:quantized,placement})
 let base=rendered.get(key)
 if(!base){
  if(!studioRenderer)studioRenderer=Promise.all([import('./materialScene'),import('./materialLabSettings')]).then(([scene,settings])=>scene.createMaterialScene(document.createElement('div'),settings.defaultMaterialSettings,()=>{rendered.clear();studioRenderer=undefined},true)).catch(e=>{studioRenderer=undefined;throw e})
  const scene=await studioRenderer
  base=scene.snapshot(n,quantized,placement);rendered.set(key,base)
  if(rendered.size>24)rendered.delete(rendered.keys().next().value!)
 }
 const output=canvas(),ctx=output.getContext('2d')!;ctx.drawImage(base,0,0)
 ctx.save();ctx.scale(4,4);ctx.globalCompositeOperation='source-atop';paintDecorations(ctx,n);ctx.restore()
 return output
}

export async function nailPaintPoint(n:Nail,x:number,y:number){
 if(!studioRenderer||n.artwork)return null
 return (await studioRenderer).paintPoint(n,x,y)
}
