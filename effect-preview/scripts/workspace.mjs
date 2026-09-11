import {spawn} from 'node:child_process';
const args=process.argv[2]==='build'?['build']:['--host','127.0.0.1','--port','4321','--strictPort'];
const child=spawn(process.execPath,['node_modules/vite/bin/vite.js',...args],{stdio:'inherit',env:{...process.env,VITE_LOCAL_WORKSPACE:'1'}});
child.on('error',e=>{console.error(e.message);process.exitCode=1});
child.on('exit',code=>{process.exitCode=code??1});
