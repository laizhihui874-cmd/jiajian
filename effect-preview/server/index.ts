import express from 'express'
import {createServer} from 'vite'
import {fileURLToPath} from 'node:url'
import path from 'node:path'
import {z} from 'zod'
import {pool,migrate} from './db.ts'
import {designSchema} from '../shared/design.ts'

await migrate()
const app=express()
const port=Number(process.env.PORT||4320)
const allowed=new Set([`127.0.0.1:${port}`,`localhost:${port}`])
app.disable('x-powered-by')
app.use((req,res,next)=>{
  if(!allowed.has(req.headers.host||'')) return res.status(403).json({error:'只允许本机访问'})
  const origin=req.headers.origin
  if(origin&&!new Set([`http://127.0.0.1:${port}`,`http://localhost:${port}`]).has(origin)) return res.status(403).json({error:'不接受其他网站的操作'})
  next()
})
app.use(express.json({limit:'4mb'}))
app.get('/api/health',async(_req,res)=>{await pool.query('SELECT 1');res.json({ok:true,storage:'postgresql',local:true})})
app.get('/api/draft',async(_req,res)=>{
  const r=await pool.query('SELECT document,revision FROM drafts WHERE id=$1',['local'])
  res.json(r.rows[0]||{document:null,revision:0})
})
app.put('/api/draft',async(req,res)=>{
  const {document,revision}=z.object({document:designSchema,revision:z.number().int().nonnegative()}).parse(req.body)
  const r=revision===0?await pool.query(`INSERT INTO drafts(id,document,revision) VALUES('local',$1,1) ON CONFLICT DO NOTHING RETURNING revision`,[JSON.stringify(document)]):await pool.query(`UPDATE drafts SET document=$1,revision=revision+1,updated_at=now() WHERE id='local' AND revision=$2 RETURNING revision`,[JSON.stringify(document),revision])
  if(!r.rowCount)return res.status(409).json({error:'草稿已在另一个窗口更新，请刷新后继续。'})
  res.json(r.rows[0])
})
app.get('/api/designs',async(_req,res)=>{
  const r=await pool.query('SELECT document,created_at,updated_at FROM designs ORDER BY updated_at DESC LIMIT 200')
  res.json(r.rows)
})
app.put('/api/designs/:id',async(req,res)=>{
  const id=z.string().uuid().parse(req.params.id)
  const doc=designSchema.parse(req.body)
  if(doc.id!==id)return res.status(400).json({error:'作品编号不一致'})
  const r=await pool.query(`INSERT INTO designs(id,name,document) VALUES($1,$2,$3) ON CONFLICT(id) DO UPDATE SET name=excluded.name,document=excluded.document,updated_at=now() RETURNING updated_at`,[id,doc.name,JSON.stringify(doc)])
  res.json(r.rows[0])
})
app.use('/api',(_req,res)=>res.status(404).json({error:'未找到这个功能'}))
app.use((err:unknown,_req:express.Request,res:express.Response,_next:express.NextFunction)=>{
  if(err instanceof z.ZodError)return res.status(400).json({error:'设计内容不完整或选项超出范围'})
  if(err instanceof SyntaxError)return res.status(400).json({error:'无法读取设计内容'})
  console.error(err instanceof Error?err.message:'Request failed')
  res.status(503).json({error:'暂时无法读取或保存作品，请确认本地工作台已启动后重试'})
})
if(process.env.NODE_ENV==='production'){
  const dist=fileURLToPath(new URL('../dist',import.meta.url))
  app.use(express.static(dist))
  app.get('/{*path}',(_req,res)=>res.sendFile(path.join(dist,'index.html')))
}else{
  const vite=await createServer({server:{middlewareMode:true,host:'127.0.0.1',hmr:{host:'127.0.0.1'},watch:{usePolling:true,interval:500}},appType:'spa'})
  app.use(vite.middlewares)
}
const server=app.listen(port,'127.0.0.1',()=>console.log(`Nail Studio ready: http://127.0.0.1:${port}`))
server.on('error',(err)=>{console.error(err.message);process.exit(1)})
for(const signal of ['SIGINT','SIGTERM'] as const)process.on(signal,()=>{server.close();void pool.end().then(()=>process.exit(0))})
