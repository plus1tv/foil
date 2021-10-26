#!/usr/bin/env node
import{gray as e,cyan as t,yellow as o,green as n,red as r}from"chalk";import{argv as i}from"process";import{resolve as a,join as l,isAbsolute as s,relative as c,dirname as d,basename as m}from"path";import{existsSync as f,statSync as u,stat as h,readFileSync as p,writeFileSync as g}from"fs";import{fileSync as w}from"find";import y from"glob-to-regexp";import{toList as b}from"dependency-tree";import{MongoClient as k}from"mongodb";import{DefinePlugin as v,webpack as x}from"webpack";import{exec as P}from"child_process";import{markademic as $}from"markademic";import{Feed as D}from"feed";let j=process.env.NODE_ENV,O=j&&j.match(/production/)||i.reduce((e,t)=>e||"--production"===t,!1),C=i.reduce((e,t)=>e||"--watch"===t,!1);function F(){return(F=Object.assign||function(e){for(var t=1;t<arguments.length;t++){var o=arguments[t];for(var n in o)Object.prototype.hasOwnProperty.call(o,n)&&(e[n]=o[n])}return e}).apply(this,arguments)}let S={title:"Alain.xyz",author:{name:"Alain Galvan",email:"hi@alain.xyz",url:"https://alain.xyz/libraries/foil"},tags:["programming"],cover:"",description:"",files:["assets/*"],redirects:[],currentDir:a("."),foilCliRoot:a(l(__dirname)),mongoUrl:"mongodb://127.0.0.1:27017"},T=l(a("."),"foil.json");if(f(T)){console.log("⚙️ Found foil.json file.");let e=require(T);S=F({},S,e),s(S.currentDir)||(S.currentDir=l(a("."),S.currentDir))}console.log("🍃 Opening MongoDB Connection. "+e("("+S.mongoUrl+")"));const _=k.connect(S.mongoUrl,{appName:"Foil Backend"}).catch(e=>console.error(e));function A(){_.then(async e=>{console.log("🍃 Closing MongoDB Connection."),e.close(),process.exit()})}function R(e,t,o="cover"){let n=d(e),r=w(new RegExp(o+".(png|jpg|jpeg|gif)$","mg"),n);return r.length>0?l(t,c(n,r[0])).replace(/\\/g,"/"):""}async function I(e){var t=await new Promise((t,o)=>{_.then(async n=>{n.db("db").collection("portfolio").find({"meta.rootPath":e}).toArray().then(e=>t(e)).catch(e=>o(e))}).catch(e=>console.error(e))});return t.length<1?[]:t[0].meta.files}async function E(o){await _.then(async n=>{let r=n.db("db");var i=r.collection("redirect");let a=["tsx","ts","scss","md","json","lock","db"];var s=w(o.meta.rootPath).filter(e=>!(a.reduce((t,o)=>t||e.endsWith(o),!1)||e.match(/node_modules|diary/)));for(var d of s){let e={to:d},t={from:l(o.rootPermalink,c(o.meta.rootPath,d)).replace(/\\/g,"/"),to:d,dateModified:u(d).mtime},n={upsert:!0};await i.updateOne(e,{$set:t},n).then(e=>{}).catch(e=>console.log(e))}s.length>0&&console.log(e(`📒 Indexed ${s.length} static file${1==s.length?"":"s"}.`));var m=r.collection("portfolio");await m.updateOne({permalink:o.permalink},{$set:o},{upsert:!0}).then(e=>console.log(`Added ${t(o.title)} to the Database.`)).catch(e=>console.log(e))})}function M(e){let{description:t,author:o=S.author,contributors:n=[],keywords:r=[],main:i,files:a=[],foil:c}=require(e);if(!c)return null;let d=[],m=e=>{let t={name:"",email:"",url:""};if("string"==typeof e){let o=/[\w\s]*(?![\<\(])/.exec(e);o&&(t.name=o[0]);let n=/(?!\<)\w*(?=\>)/.exec(e);n&&(t.email=n[0]);let r=/(?!\()\w*(?=\))/.exec(e);r&&(t.url=r[0])}return t.name=e.name,t.email=e.email,t.url=e.url,t};if(n.length<=0)d.push(m(o));else for(let e of n)d.push(m(e));let h=l(e,".."),{permalink:p}=c;if(!p)return console.warn("Foil package has no permalink! Foilfolio needs a permalink to resolve routes!"),null;if("/"==p.charAt(0))return console.warn("Foil package has an invalid permalink. Permalinks cannot start with /"),null;p="/"+p;let g=p;/\*$/.exec(p)&&(g=p.replace(/\*$/,""));let{datePublished:k=(new Date).toISOString(),cover:v=R(e,g),icon:x=R(e,g,"icon")}=c,P=new Set;if(P.add(e),i&&(P.add(i),i.match(/\.(t|j)sx?$/))){let e=i;s(e)||(e=l(h,e)),f(e)&&b({filename:e,directory:h,filter:e=>-1===e.indexOf("node_modules"),nodeModulesConfig:{entry:"module"},tsConfig:{compilerOptions:{target:"es2016",module:"CommonJS",isolatedModules:!0,allowSyntheticDefaultImports:!0,noImplicitAny:!1,suppressImplicitAnyIndexErrors:!0,removeComments:!0,jsx:"react"},transpileOnly:!0}}).forEach(e=>P.add(e))}for(let e of a)if(null===/\*/.exec(e))P.add(e);else{let t=w(y(e),S.currentDir);for(let e of t)P.add(e)}let $=function(e,t,o=[]){for(let n of t){s(n)||(n=l(e,n)),n.replace(/\\/g,"/");let t={path:n,modified:new Date};f(n)&&(t.modified=u(n).mtime,u(n).isDirectory()||o.push(t))}return[...o]}(h,Array.from(P)),D=$.reduce((e,t)=>e.modified>t.modified?e:t,{modified:new Date("1970-01-01Z00:00:00:000")}).modified,{publicDateModifiedFiles:j=[".md$"]}=c,O=new Date("1970-01-01Z00:00:00:000");if(j.length>0)for(let e of $)j.reduce((t,o)=>t||new RegExp(o).test(e.path),!1)&&O<e.modified&&(O=e.modified);O<=new Date("1970-01-02Z00:00:00:000")&&(O=D);let C=new Date(k);return NaN===C.getDate()&&(console.warn("📅 Provided publish date is invalid, replacing with today: "+k),C=new Date),F({},c,{description:t,authors:d,keywords:r,permalink:p,rootPermalink:g,datePublished:C,dateModified:O,cover:v,icon:x,main:i,meta:{files:$,dateModified:D,rootPath:h}})}async function N(){let e=[],t=w(/\package.json$/,S.currentDir);for(var o of(t=t.filter(e=>!e.match(/node_modules/)),t)){let t=M(o);if(t){let o=!1;var n=await I(t.meta.rootPath);if(o=o||n.length<=0||n.length!==t.meta.files.length,!o){for(let e of n)if(f(e.path)&&(o=o||u(e.path).mtime.getTime()!==e.modified.getTime(),o))break;if(!o)for(let e of t.meta.files){let t=!1;for(let o of n)if(t=t||e.path==o.path,t)break;o=o||!t}}o&&e.push(t)}}return e}async function q(e){return!f(e)||await _.then(async t=>{let o=t.db("db"),n=o.collection("portfolio"),r=await n.find({"meta.files.path":e}).project({"meta.files":1}).limit(1).toArray();if("object"==typeof r&&r.length>=1){var{mtime:i}=u(e);for(let t of r[0].meta.files)if(t.path===e)return i.getDate()===new Date(t.modified).getDate()}let a=o.collection("redirect"),l=await a.find({to:e}).limit(1).toArray();if("object"==typeof l&&l.length>=1){var{mtime:i}=u(e);return i.getDate()===new Date(l[0].dateModified).getDate()}return!0})}process.on("SIGTERM",A).on("SIGINT",A);const B=O?"production":"development",W=["react","react/jsx-runtime","react-dom","react-router-dom","redux","react-redux","main"];let z=[{test:{main:/\.tsx?$/},transform:async n=>{let r=n.main;s(n.main)||(r=l(n.meta.rootPath,n.main)),r.replace(/\\/g,"/");let i=r.replace(/\.tsx?$/,".js").replace(/\\/g,"/"),c=l(n.rootPermalink,n.main).replace(/\.tsx?$/,".js").replace(/\\/g,"/");if(await q(r)){console.log("🟦 TypeScript Transformer:");let{dependencies:s,devDependencies:m}=require(l(n.meta.rootPath,"package.json"));return(s||m)&&await(d=n.meta.rootPath,new Promise((e,t)=>{P("npm i",{cwd:d},(o,n,r)=>{console.log("📦 Installing dependencies via NPM.",d),o?t(o):e(n)})})),await function(e,n,r,i){let s={mode:B,context:a(e),entry:{main:"./main"},output:{path:a(e),filename:"main.js",libraryTarget:"system",library:{type:"system"}},resolve:{extensions:[".ts",".tsx",".js"],modules:[e,l(e,"node_modules"),l(S.currentDir,"node_modules"),l(S.foilCliRoot,"..","node_modules"),"node_modules"],fallback:{crypto:!1,fs:!1,path:require.resolve("path-browserify")}},resolveLoader:{modules:[e,l(e,"node_modules"),l(S.currentDir,"node_modules"),l(S.foilCliRoot,"..","node_modules"),"node_modules"]},module:{rules:[{test:/\.tsx?$/,exclude:/node_modules/,loader:"ts-loader",options:{transpileOnly:!0,compilerOptions:{module:"esnext",sourceMap:!O}}},{test:/\.wasm$/,loader:"file-loader",options:{name:"[name].[ext]",publicPath:i}},{test:/\.(wgsl|glsl)$/,type:"asset/source"}]},node:!1,externalsType:"system",externals:W,externalsPresets:{web:!0},plugins:[new v({"process.env":{NODE_ENV:JSON.stringify(B)}})],devtool:O?void 0:"inline-source-map",optimization:{minimize:!!O}};console.log(`🔨 Building Module '${t(r)}'`);var c=x(s);return new Promise((e,t)=>c.run((o,n)=>{o?t(o):e(n)})).then(e=>{e.compilation.errors.length>0&&console.log(o(`Build Succeeded with ${e.compilation.errors.length} errors.\n`+e.compilation.errors.reduce((e,t)=>"object"==typeof t?e+t.message+"\n":e+t+"\n","\n"))),console.log("🟨 Done in %s ms!\n",+e.endTime-+e.startTime)}).catch(e=>console.error(e))}(l(i,".."),0,c,n.rootPermalink),await function(t,n,r){return _.then(i=>{var a=i.db("db").collection("redirect");let l={from:n},s={from:n,to:t,dateModified:u(r).mtime};a.updateOne(l,{$set:s},{upsert:!0}),console.log(e(`📒 Indexed ${o(n)}`))})}(i,c,r),F({},n,{main:c})}var d;return n}},{test:{permalink:/^\/(blog|research|libraries|notes)/},transform:async e=>{let t=null;for(let o of e.meta.files)/\.md$/.exec(o.path)&&(t=o);if(!t)return e;if(q(t)){console.log("📝 Blog Transformer:");var n={input:p(t.path).toString(),rerouteLinks:t=>l(e.rootPermalink,t)};let d=l(e.meta.rootPath,"bib.json");f(d)&&(n.citations=require(d));var r=$(n);console.log("🏫 Built "+o(m(t.path))+" with Markademic.");var i=null;for(let t of e.meta.files)/\.mp3$/.exec(t.path)&&(i=t.path.substr(e.meta.rootPath.length).replace(/\\/g,"/"));var a=[],s=l(e.meta.rootPath,"captions.json");f(s)&&(a=require(s).captions,Array.isArray(a)&&(a=[]));var c={article:r,audio:{file:i,captions:a}};return"object"==typeof e.data&&(c=F({},e.data,{article:r})),F({},e,{data:c})}return e}},{test:{permalink:/^\/books\/|docs/},transform:async e=>{console.log("📚 Book Transformer: \n");let t=[],o=[],n=null;for(let t of e.meta.files)if(null!=/(summary)|(toc)|(table-of-contents)/i.exec(t.path)){n=t;break}if(!n)throw new Error("Foil book is missing a Table of Contents! Create a file called `toc.md` in the root directory of this entry.");let r=p(n.path).toString(),i=/(\n\s*(\-|\+|\*)\s.*)+/g.exec(r);if(!i)throw new Error("Table of contents is missing an unordered list of links. This is needed to build navigation data structures and traverse the book.");r=r.substr(i.index,r.length);let a=t,s=/\[([^\[]+)\]\(([^\)]+)\)/g,c=s.exec(r);for(;null!=c;)a.push({text:c[1],link:c[2],children:[]}),c=s.exec(r);for(let n of t){let t=/\.[^/.]+$/.exec(n.link),r=/(\/|\\)$/.exec(n.link),i=l(e.meta.rootPath,n.link);t&&(n.link=n.link.replace(/\.[^/.]+$/,"")),r&&(n.link=n.link.substr(0,n.link.length-1),i+="index.md"),n.link=l("/",e.rootPermalink,n.link).replace(/\\/gi,"/"),console.log(n.link),console.log(i),t||r||(i+=".md");let a=null,s=l(e.meta.rootPath,"bib.json"),c=l(i,t?"..":"","bib.json");if(f(s)&&(a=require(s)),f(c)){let e=require(c);a=a?F({},a,e):e}if(f(i)){var d={input:p(i).toString(),rerouteLinks:t=>l(e.rootPermalink,t)};a&&(d.citations=a);var m=$(d);o.push(m)}}return F({},e,{data:{toc:t,chapters:o}})}}];function L(e,t){return Object.keys(e.test).reduce((o,n)=>{let r=new RegExp(e.test[n]);return o||r.test(t[n])},!1)}async function G(e,t){for(let o of e)if(L(o,t))try{t=await o.transform(t)}catch(e){console.error(e)}return t}var J,U=[async function(e){console.log("🌊 Foil Database Cleaner:"),await _.then(async e=>{let o=e.db("db");var n=o.collection("redirect"),r=o.collection("portfolio"),i=e=>e.find({}).toArray().catch(e=>console.error(e)).then(t=>{if(t)for(var o of t){let{_id:t,permalink:n=null}=o,r=o.to?[{path:o.to}]:o.meta.files;for(let o of r){let r=()=>{e.deleteOne({_id:t}).catch(e=>console.error(e)).then(()=>console.log("❌ Removed "+o.path))};/\.([A-z])*$/.test(o.path)&&h(o.path,e=>{if("ENOENT"===(null==e?void 0:e.code)&&r(),e&&"package.json"==m(o.path)&&n){let e=require(o.path);e.foil&&"/"+e.foil.permalink!==n&&(console.log("Permalink "+n+" does not match "+e.foil.permalink+", deleting."),r())}})}}});await i(n),console.log(`🧼 Cleaned ${t("'files'")} collection.`),await i(r),console.log(`🧼 Cleaned ${t("'portfolio'")} collection.`)})},async function(e){for(var t of(console.log("📦 Foil Database Builder:"),e))if(t){console.log("⚪ Processing "+o(`'${t.permalink}'`)+":");let e=await G(z,t);await E(e)}},async function(e){console.log("📻 Foil RSS Feeds \n");const t=new D({title:S.title,description:S.description,id:S.author.url,link:S.author.url,language:"en",image:S.cover,favicon:S.author.url+"/assets/brand/favicon/favicon.ico",copyright:"Copyright "+S.author.name+" All Rights Reserved.",updated:new Date,generator:"Feed in Foil",feedLinks:{rss:S.author.url+"/rss",json:S.author.url+"/feedJson",atom:S.author.url+"/feedAtom"},author:{name:S.author.name,email:S.author.email,link:S.author.url},ttl:1200});for(let e of S.tags)t.addCategory(e);let o=await new Promise((e,t)=>_.then(t=>{t.db("db").collection("portfolio").find({datePublished:{$lte:new Date},permalink:new RegExp("/blog/w*")}).limit(30).sort({datePublished:-1}).toArray((t,o)=>{if(t||0===o.length)return e([]);e(o)})}));for(var n of o){let e=await new Promise((e,t)=>_.then(t=>{t.db("db").collection("redirect").find({from:n.cover}).limit(1).toArray((t,o)=>{if(t||0===o.length)return e(null);e(o)})}));var r=0;e&&(r=u(e[0].to).size),t.addItem({title:n.title,id:S.author.url+n.permalink,link:S.author.url+n.permalink,description:n.description,author:[{name:S.author.name,email:S.author.email,link:S.author.url}],date:n.datePublished,image:{url:S.author.url+n.cover,length:r}})}let i=t.rss2(),a=l(S.currentDir,"rss.xml");try{g(a,i),console.log("RSS feed successfully generated. \n Written to "+a+"\n")}catch(e){console.error("Could not generate RSS Feeds! \n")}},async function(e){console.log("🏹 Foil Database Redirects\n"),await _.then(async e=>{var t=e.db("db").collection("redirect"),o=S.redirects;for(var n of o)if(n.to&&n.from){let e={from:n.from},o={upsert:!0};await t.updateOne(e,{$set:{to:n.to,from:n.from}},o).then(e=>console.log(`Redirecting ${n.from} to ${n.to}.`)).catch(e=>console.log(e))}console.log("✨ Cleaned portfolio collection.")})}];class Z{async run(t){for(var o=Object.values(U),i=0;i<o.length;i++){let a=`(${i+1}/${o.length})`;console.log(`\n👟 ${e(` Running Task ${a}...`)}`),await o[i](t).then(e=>{console.log(`✔️️ ${n(` Finished Task ${a}!`)}`)}).catch(e=>{console.log(`\n❌ ${r(` Failed Task ${a}!`)}`),console.error(e)})}console.log("\n💮 "+e(` Finished processing ${o.length} tasks!\n`))}}!function(e){e[e.Initial=0]="Initial",e[e.Watching=1]="Watching",e[e.Processing=2]="Processing",e[e.Done=3]="Done"}(J||(J={}));class V{constructor(){this.watch=async function(t){let o=J.Initial;const n=new Z;let r=[];await async function i(){switch(+o){case J.Initial:t.length>0&&await n.run(t),console.log(e("\n👀  · Watching for changes... · \n")),o=J.Watching;break;case J.Watching:r=await N(),r.length>0&&(o=J.Processing);break;case J.Processing:r.length>0&&await n.run(r),o=J.Done;break;case J.Done:console.log(e("\n👀  · Watching for changes... · \n")),o=J.Watching}await i()}()}}}async function H(){console.log("👋 Hi "+S.author.name+"!");let t=await N();if(t.length>0&&console.log(e("🎡 Processing "+t.length+" files.")),C){const e=new V;await e.watch(t)}else if(t.length>0){const e=new Z;await e.run(t)}else console.log(e("👍 No changes found, exiting."));return process.exit()}console.log(t("✨ Foil v1.0.0-alpha.0")+e(O?" (production)":" (development)")),H();export{H as foil};
//# sourceMappingURL=foil-cli.modern.js.map
