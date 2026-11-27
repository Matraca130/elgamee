import { createServer } from 'node:http';
import './build.mjs';

const {default:worker}=await import('../dist/server/index.js');
const port=Number(process.env.PORT??4173);
const server=createServer(async (incoming,outgoing)=>{
 const request=new Request('http://127.0.0.1:'+port+incoming.url,{method:incoming.method});
 const response=await worker.fetch(request,{});
 outgoing.writeHead(response.status,Object.fromEntries(response.headers));
 outgoing.end(Buffer.from(await response.arrayBuffer()));
});
server.listen(port,'0.0.0.0',()=>process.stdout.write('Atlas Viral em http://127.0.0.1:'+port+'/\n'));
