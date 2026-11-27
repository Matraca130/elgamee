import { copyFile, mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root=fileURLToPath(new URL('..',import.meta.url));
const dist=join(root,'dist');
const types={
 '.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8',
 '.css':'text/css; charset=utf-8','.webp':'image/webp'
};
const assets={};
const files=await readdir(dist,{withFileTypes:true});
for(const file of files.sort((left,right)=>left.name.localeCompare(right.name))){
 const type=types[extname(file.name)];
 if(!file.isFile()||!type)continue;
 const buffer=await readFile(join(dist,file.name));
 assets['/'+file.name]={type,base64:buffer.toString('base64')};
}
const worker=await readFile(join(root,'worker/index.js'),'utf8');
await mkdir(join(dist,'server'),{recursive:true});
await mkdir(join(dist,'.openai'),{recursive:true});
await Promise.all([
 writeFile(join(dist,'server/index.js'),'const SITE_ASSETS = '+JSON.stringify(assets)+';\n'+worker),
 copyFile(join(root,'.openai/hosting.json'),join(dist,'.openai/hosting.json'))
]);
