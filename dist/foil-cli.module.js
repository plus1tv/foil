#!/usr/bin/env node
import{gray as e,cyan as t,yellow as o,green as n,red as r}from"chalk";import{argv as i}from"process";import{resolve as l,join as a,isAbsolute as s,relative as c,dirname as d,basename as m}from"path";import{existsSync as f,statSync as u,stat as p,readFileSync as h,writeFileSync as g}from"fs";import{fileSync as w}from"find";import y from"glob-to-regexp";import{toList as b}from"dependency-tree";import{MongoClient as k}from"mongodb";import{DefinePlugin as v,webpack as x}from"webpack";import{exec as D}from"child_process";import{markademic as P}from"markademic";import*as $ from"rss";let j=process.env.NODE_ENV,_=j&&j.match(/production/)||i.reduce((e,t)=>e||"--production"===t,!1),O=i.reduce((e,t)=>e||"--watch"===t,!1);function S(){return(S=Object.assign||function(e){for(var t=1;t<arguments.length;t++){var o=arguments[t];for(var n in o)Object.prototype.hasOwnProperty.call(o,n)&&(e[n]=o[n])}return e}).apply(this,arguments)}let T={author:{name:"Alain Galvan",email:"hi@alain.xyz",url:"https://alain.xyz/libraries/foil"},tags:["programming"],cover:"",description:"",files:["assets/*"],redirects:[],currentDir:l("."),foilCliRoot:l(a(__dirname))},C=a(l("."),"foil.json");if(f(C)){console.log("⚙️ Found foil.json file.");let e=require(C);T=S({},T,e),s(T.currentDir)||(T.currentDir=a(l("."),T.currentDir))}console.log("🍃 Opening MongoDB Connection.");const A=k.connect("mongodb://localhost:27017").catch(e=>console.error(e));function E(){A.then(async e=>{console.log("🍃 Closing MongoDB Connection."),e.close(),process.exit()})}function R(e,t,o="cover"){let n=d(e),r=w(new RegExp(o+".(png|jpg|jpeg|gif)$","mg"),n);return r.length>0?a(t,c(n,r[0])).replace(/\\/g,"/"):""}async function F(e){var t=await new Promise((t,o)=>{A.then(async n=>{n.db("db").collection("portfolio").find({"meta.rootPath":e}).toArray().then(e=>t(e)).catch(e=>o(e))}).catch(e=>console.error(e))});return t.length<1?[]:t[0].meta.files}async function M(o){await A.then(async n=>{let r=n.db("db");var i=r.collection("redirect");let l=["tsx","ts","scss","md","json","lock","db"];var s=w(o.meta.rootPath).filter(e=>!(l.reduce((t,o)=>t||e.endsWith(o),!1)||e.match(/node_modules|diary/)));for(var d of s){let e={to:d},t={from:a(o.rootPermalink,c(o.meta.rootPath,d)).replace(/\\/g,"/"),to:d,dateModified:u(d).mtime},n={upsert:!0};await i.updateOne(e,{$set:t},n).then(e=>{}).catch(e=>console.log(e))}s.length>0&&console.log(e(`📒 Indexed ${s.length} static file${1==s.length?"":"s"}.`));var m=r.collection("portfolio");await m.updateOne({permalink:o.permalink},{$set:o},{upsert:!0}).then(e=>console.log(`Added ${t(o.title)} to the Database.`)).catch(e=>console.log(e))})}function I(e){let{description:t,author:o=T.author,contributors:n=[],keywords:r=[],main:i,files:l=[],foil:c}=require(e);if(!c)return null;let d=[],m=e=>{let t={name:"",email:"",url:""};if("string"==typeof e){let o=/[\w\s]*(?![\<\(])/.exec(e);o&&(t.name=o[0]);let n=/(?!\<)\w*(?=\>)/.exec(e);n&&(t.email=n[0]);let r=/(?!\()\w*(?=\))/.exec(e);r&&(t.url=r[0])}return t.name=e.name,t.email=e.email,t.url=e.url,t};if(n.length<=0)d.push(m(o));else for(let e of n)d.push(m(e));let p=a(e,".."),{permalink:h}=c;if(!h)return console.warn("Foil package has no permalink! Foilfolio needs a permalink to resolve routes!"),null;if("/"==h.charAt(0))return console.warn("Foil package has an invalid permalink. Permalinks cannot start with /"),null;h="/"+h;let g=h;/\*$/.exec(h)&&(g=h.replace(/\*$/,""));let{datePublished:k=(new Date).toISOString(),cover:v=R(e,g),icon:x=R(e,g,"icon")}=c,D=new Set;if(D.add(e),i&&(D.add(i),i.match(/\.(t|j)sx?$/))){let e=i;s(e)||(e=a(p,e)),f(e)&&b({filename:e,directory:p,filter:e=>-1===e.indexOf("node_modules"),nodeModulesConfig:{entry:"module"},tsConfig:{compilerOptions:{target:"es2016",module:"CommonJS",isolatedModules:!0,allowSyntheticDefaultImports:!0,noImplicitAny:!1,suppressImplicitAnyIndexErrors:!0,removeComments:!0,jsx:"react"},transpileOnly:!0}}).forEach(e=>D.add(e))}for(let e of l)if(null===/\*/.exec(e))D.add(e);else{let t=w(y(e),T.currentDir);for(let e of t)D.add(e)}let P=function(e,t,o=[]){for(let n of t){s(n)||(n=a(e,n)),n.replace(/\\/g,"/");let t={path:n,modified:new Date};f(n)&&(t.modified=u(n).mtime,u(n).isDirectory()||o.push(t))}return[...o]}(p,Array.from(D)),$=P.reduce((e,t)=>e.modified>t.modified?e:t,{modified:new Date("1970-01-01Z00:00:00:000")}).modified,{publicDateModifiedFiles:j=[".md$"]}=c,_=new Date("1970-01-01Z00:00:00:000");if(j.length>0)for(let e of P)j.reduce((t,o)=>t||new RegExp(o).test(e.path),!1)&&_<e.modified&&(_=e.modified);_<=new Date("1970-01-02Z00:00:00:000")&&(_=$);let O=new Date(k);return NaN===O.getDate()&&(console.warn("📅 Provided publish date is invalid, replacing with today: "+k),O=new Date),S({},c,{description:t,authors:d,keywords:r,permalink:h,rootPermalink:g,datePublished:O,dateModified:_,cover:v,icon:x,main:i,meta:{files:P,dateModified:$,rootPath:p}})}async function N(){let e=[],t=w(/\package.json$/,T.currentDir);for(var o of(t=t.filter(e=>!e.match(/node_modules/)),t)){let t=I(o);if(t){let o=!1;var n=await F(t.meta.rootPath);if(o=o||n.length<=0||n.length!==t.meta.files.length,!o){for(let e of n)if(f(e.path)&&(o=o||u(e.path).mtime.getTime()!==e.modified.getTime(),o))break;if(!o)for(let e of t.meta.files){let t=!1;for(let o of n)if(t=t||e.path==o.path,t)break;o=o||!t}}o&&e.push(t)}}return e}async function q(e){return!f(e)||await A.then(async t=>{let o=t.db("db"),n=o.collection("portfolio"),r=await n.find({"meta.files.path":e}).project({"meta.files":1}).limit(1).toArray();if("object"==typeof r&&r.length>=1){var{mtime:i}=u(e);for(let t of r[0].meta.files)if(t.path===e)return i.getDate()===new Date(t.modified).getDate()}let l=o.collection("redirect"),a=await l.find({to:e}).limit(1).toArray();if("object"==typeof a&&a.length>=1){var{mtime:i}=u(e);return i.getDate()===new Date(a[0].dateModified).getDate()}return!0})}process.on("SIGTERM",E).on("SIGINT",E);const W=_?"production":"development",z=["react","react/jsx-runtime","react-dom","react-router-dom","redux","react-redux","main"];let B=[{test:{main:/\.tsx?$/},transform:async n=>{let r=n.main;s(n.main)||(r=a(n.meta.rootPath,n.main)),r.replace(/\\/g,"/");let i=r.replace(/\.tsx?$/,".js").replace(/\\/g,"/"),c=a(n.rootPermalink,n.main).replace(/\.tsx?$/,".js").replace(/\\/g,"/");if(await q(r)){console.log("🟦 TypeScript Transformer:");let{dependencies:s,devDependencies:m}=require(a(n.meta.rootPath,"package.json"));return(s||m)&&await(d=n.meta.rootPath,new Promise((e,t)=>{D("npm i",{cwd:d},(o,n,r)=>{console.log("📦 Installing dependencies via NPM.",d),o?t(o):e(n)})})),await function(e,n,r,i){let s={mode:W,context:l(e),entry:{main:"./main"},output:{path:l(e),filename:"main.js",libraryTarget:"system",library:{type:"system"}},resolve:{extensions:[".ts",".tsx",".js"],modules:[e,a(e,"node_modules"),a(T.currentDir,"node_modules"),a(T.foilCliRoot,"..","node_modules"),"node_modules"],fallback:{crypto:!1,fs:!1,path:require.resolve("path-browserify")}},resolveLoader:{modules:[e,a(e,"node_modules"),a(T.currentDir,"node_modules"),a(T.foilCliRoot,"..","node_modules"),"node_modules"]},module:{rules:[{test:/\.tsx?$/,exclude:/node_modules/,loader:"ts-loader",options:{transpileOnly:!0,compilerOptions:{module:"esnext",sourceMap:!_}}},{test:/\.wasm$/,loader:"file-loader",options:{name:"[name].[ext]",publicPath:i}},{test:/\.(wgsl|glsl)$/,type:"asset/source"}]},node:!1,externalsType:"system",externals:z,externalsPresets:{web:!0},plugins:[new v({"process.env":{NODE_ENV:JSON.stringify(W)}})],devtool:_?void 0:"inline-source-map",optimization:{minimize:!!_}};console.log(`🔨 Building Module '${t(r)}'`);var c=x(s);return new Promise((e,t)=>c.run((o,n)=>{o?t(o):e(n)})).then(e=>{e.compilation.errors.length>0&&console.log(o(`Build Succeeded with ${e.compilation.errors.length} errors.\n`+e.compilation.errors.reduce((e,t)=>"object"==typeof t?e+t.message+"\n":e+t+"\n","\n"))),console.log("🟨 Done in %s ms!\n",+e.endTime-+e.startTime)}).catch(e=>console.error(e))}(a(i,".."),0,c,n.rootPermalink),await function(t,n,r){return A.then(i=>{var l=i.db("db").collection("redirect");let a={from:n},s={from:n,to:t,dateModified:u(r).mtime};l.updateOne(a,{$set:s},{upsert:!0}),console.log(e(`📒 Indexed ${o(n)}`))})}(i,c,r),S({},n,{main:c})}var d;return n}},{test:{permalink:/^\/(blog|research|libraries|notes)/},transform:async e=>{let t=null;for(let o of e.meta.files)/\.md$/.exec(o.path)&&(t=o);if(!t)return e;if(q(t)){console.log("📝 Blog Transformer:");var n={input:h(t.path).toString(),rerouteLinks:t=>a(e.rootPermalink,t)};let d=a(e.meta.rootPath,"bib.json");f(d)&&(n.citations=require(d));var r=P(n);console.log("🏫 Built "+o(m(t.path))+" with Markademic.");var i=null;for(let t of e.meta.files)/\.mp3$/.exec(t.path)&&(i=t.path.substr(e.meta.rootPath.length).replace(/\\/g,"/"));var l=[],s=a(e.meta.rootPath,"captions.json");f(s)&&(l=require(s).captions,Array.isArray(l)&&(l=[]));var c={article:r,audio:{file:i,captions:l}};return"object"==typeof e.data&&(c=S({},e.data,{article:r})),S({},e,{data:c})}return e}},{test:{permalink:/^\/books\/|docs/},transform:async e=>{console.log("📚 Book Transformer: \n");let t=[],o=[],n=null;for(let t of e.meta.files)if(null!=/(summary)|(toc)|(table-of-contents)/i.exec(t.path)){n=t;break}if(!n)throw new Error("Foil book is missing a Table of Contents! Create a file called `toc.md` in the root directory of this entry.");let r=h(n.path).toString(),i=/(\n\s*(\-|\+|\*)\s.*)+/g.exec(r);if(!i)throw new Error("Table of contents is missing an unordered list of links. This is needed to build navigation data structures and traverse the book.");r=r.substr(i.index,r.length);let l=t,s=/\[([^\[]+)\]\(([^\)]+)\)/g,c=s.exec(r);for(;null!=c;)l.push({text:c[1],link:c[2],children:[]}),c=s.exec(r);for(let n of t){let t=/\.[^/.]+$/.exec(n.link),r=/(\/|\\)$/.exec(n.link),i=a(e.meta.rootPath,n.link);t&&(n.link=n.link.replace(/\.[^/.]+$/,"")),r&&(n.link=n.link.substr(0,n.link.length-1),i+="index.md"),n.link=a("/",e.rootPermalink,n.link).replace(/\\/gi,"/"),console.log(n.link),console.log(i),t||r||(i+=".md");let l=null,s=a(e.meta.rootPath,"bib.json"),c=a(i,t?"..":"","bib.json");if(f(s)&&(l=require(s)),f(c)){let e=require(c);l=l?S({},l,e):e}if(f(i)){var d={input:h(i).toString(),rerouteLinks:t=>a(e.rootPermalink,t)};l&&(d.citations=l);var m=P(d);o.push(m)}}return S({},e,{data:{toc:t,chapters:o}})}}];function G(e,t){return Object.keys(e.test).reduce((o,n)=>{let r=new RegExp(e.test[n]);return o||r.test(t[n])},!1)}async function L(e,t){for(let o of e)if(G(o,t))try{t=await o.transform(t)}catch(e){console.error(e)}return t}var Z,J=[async function(e){console.log("🌊 Foil Database Cleaner:"),await A.then(async e=>{let o=e.db("db");var n=o.collection("redirect"),r=o.collection("portfolio"),i=e=>e.find({}).toArray().catch(e=>console.error(e)).then(t=>{if(t)for(var o of t){let{_id:t,permalink:n=null}=o,r=o.to?[{path:o.to}]:o.meta.files;for(let o of r){let r=()=>{e.deleteOne({_id:t}).catch(e=>console.error(e)).then(()=>console.log("❌ Removed "+o.path))};/\.([A-z])*$/.test(o.path)&&p(o.path,e=>{if("ENOENT"===(null==e?void 0:e.code)&&r(),e&&"package.json"==m(o.path)&&n){let e=require(o.path);e.foil&&"/"+e.foil.permalink!==n&&(console.log("Permalink "+n+" does not match "+e.foil.permalink+", deleting."),r())}})}}});await i(n),console.log(`🧼 Cleaned ${t("'files'")} collection.`),await i(r),console.log(`🧼 Cleaned ${t("'portfolio'")} collection.`)})},async function(e){for(var t of(console.log("📦 Foil Database Builder:"),e))if(t){console.log("⚪ Processing "+o(`'${t.permalink}'`)+":");let e=await L(B,t);await M(e)}},async function(e){console.log("📻 Foil RSS Feeds \n");let t={title:"Alain.xyz",description:T.description,feed_url:T.author.url+"/rss",site_url:T.author.url,image_url:T.cover,managingEditor:T.author.name,webMaster:T.author.name,copyright:"Copyright "+T.author.name+" All Rights Reserved.",language:"English",categories:T.tags,pubDate:new Date,ttl:1200},o=new $(t),n=await new Promise((e,t)=>A.then(t=>{t.db("db").collection("portfolio").find({datePublished:{$lte:new Date},permalink:new RegExp("/blog/w*")}).limit(30).sort({datePublished:-1}).toArray((t,o)=>{if(t||0===o.length)return e([]);e(o)})}));for(var r of n){let e=await new Promise((e,t)=>A.then(t=>{t.db("db").collection("redirect").find({from:r.cover}).limit(1).toArray((t,o)=>{if(t||0===o.length)return e(null);e(o)})}));var i=0;e&&(i=u(e[0].to).size),o.item({title:r.title,description:r.description,url:T.author.url+r.permalink,date:r.datePublished,enclosure:{url:T.author.url+r.cover,size:i}})}let l=o.xml(),s=a(T.currentDir,"rss.xml");try{g(s,l),console.log("RSS feed successfully generated. \n Written to "+s+"\n")}catch(e){console.error("Could not generate RSS Feeds! \n")}},async function(e){console.log("🏹 Foil Database Redirects\n"),await A.then(async e=>{var t=e.db("db").collection("redirect"),o=T.redirects;for(var n of o)if(n.to&&n.from){let e={from:n.from},o={upsert:!0};await t.updateOne(e,{$set:{to:n.to,from:n.from}},o).then(e=>console.log(`Redirecting ${n.from} to ${n.to}.`)).catch(e=>console.log(e))}console.log("✨ Cleaned portfolio collection.")})}];class V{async run(t){for(var o=Object.values(J),i=0;i<o.length;i++){let l=`(${i+1}/${o.length})`;console.log(`\n👟 ${e(` Running Task ${l}...`)}`),await o[i](t).then(e=>{console.log(`✔️️ ${n(` Finished Task ${l}!`)}`)}).catch(e=>{console.log(`\n❌ ${r(` Failed Task ${l}!`)}`),console.error(e)})}console.log("\n💮 "+e(` Finished processing ${o.length} tasks!\n`))}}!function(e){e[e.Initial=0]="Initial",e[e.Watching=1]="Watching",e[e.Processing=2]="Processing",e[e.Done=3]="Done"}(Z||(Z={}));class H{constructor(){this.watch=async t=>{let o=Z.Initial;const n=new V;let r=[];const i=async()=>{switch(+o){case Z.Initial:t.length>0&&await n.run(t),console.log(e("\n👀  · Watching for changes... · \n")),o=Z.Watching;break;case Z.Watching:r=await N(),r.length>0&&(o=Z.Processing);break;case Z.Processing:r.length>0&&await n.run(r),o=Z.Done;break;case Z.Done:console.log(e("\n👀  · Watching for changes... · \n")),o=Z.Watching}await i()};await i()}}}async function K(){console.log("👋 Hi "+T.author.name+"!");let t=await N();if(t.length>0&&console.log(e("🎡 Processing "+t.length+" files.")),O){const e=new H;await e.watch(t)}else if(t.length>0){const e=new V;await e.run(t)}else console.log(e("👍 No changes found, exiting."));return process.exit()}console.log(t("✨ Foil v1.0.0-alpha.0")+e(_?" (production)":" (development)")),K();export{K as foil};
//# sourceMappingURL=foil-cli.module.js.map
