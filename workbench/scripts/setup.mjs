import {writeFileSync,existsSync} from 'node:fs';
import {randomBytes} from 'node:crypto';
if(existsSync('.env')){console.log('已有本地设置，保持不变。')}else{const p=randomBytes(24).toString('hex');writeFileSync('.env',`POSTGRES_PASSWORD=${p}\nDATABASE_URL=postgresql://nail_studio:${p}@127.0.0.1:5438/nail_studio\nPORT=4320\n`,{flag:'wx',mode:0o600});console.log('本地设置已创建。接着运行 npm run db:up 和 npm run dev。')}
