import{j as R,f as c,M as X,O as D,d as o,r as H,Z as q,G,n as O,x as V,k as _,q as j,B as U,u as Z}from"./@vue-fUFGGjjm.js";var I=R({name:"vue3-danmaku",components:{},props:{danmus:{type:Array,required:!0,default:()=>[]},channels:{type:Number,default:0},autoplay:{type:Boolean,default:!0},loop:{type:Boolean,default:!1},useSlot:{type:Boolean,default:!1},debounce:{type:Number,default:100},speeds:{type:Number,default:200},randomChannel:{type:Boolean,default:!1},fontSize:{type:Number,default:18},top:{type:Number,default:4},right:{type:Number,default:0},isSuspend:{type:Boolean,default:!1},extraStyle:{type:String,default:""}},emits:["list-end","play-end","dm-over","dm-out","update:danmus"],setup(a,{emit:i,slots:w}){let f=c(document.createElement("div")),l=c(document.createElement("div"));const p=c(0),E=c(0);let S=0;const $=c(0),B=c(0),v=c(0),N=c(!1),g=c(!1),k=c({}),u=(function(n,s,e="modelValue",t){return o({get:()=>n[e],set:h=>{s(`update:${e}`,h)}})})(a,i,"danmus"),d=H({channels:o((()=>a.channels||$.value)),autoplay:o((()=>a.autoplay)),loop:o((()=>a.loop)),useSlot:o((()=>a.useSlot)),debounce:o((()=>a.debounce)),randomChannel:o((()=>a.randomChannel))}),r=H({height:o((()=>B.value)),fontSize:o((()=>a.fontSize)),speeds:o((()=>a.speeds)),top:o((()=>a.top)),right:o((()=>a.right))});function z(){T(),a.isSuspend&&(function(){let n=[];l.value.addEventListener("mouseover",(s=>{let e=s.target;e.className.includes("dm")||(e=e.closest(".dm")||e),e.className.includes("dm")&&(n.includes(e)||(i("dm-over",{el:e}),e.classList.add("pause"),n.push(e)))})),l.value.addEventListener("mouseout",(s=>{let e=s.target;e.className.includes("dm")||(e=e.closest(".dm")||e),e.className.includes("dm")&&(i("dm-out",{el:e}),e.classList.remove("pause"),n.forEach((t=>{t.classList.remove("pause")})),n=[])}))})(),d.autoplay&&A()}function T(){if(p.value=f.value.offsetWidth,E.value=f.value.offsetHeight,p.value===0||E.value===0)throw new Error("获取不到容器宽高")}function A(){g.value=!1,S||(S=window.setInterval((()=>(function(){if(!g.value&&u.value.length)if(v.value>u.value.length-1){const n=l.value.children.length;d.loop&&(n<v.value&&(i("list-end"),v.value=0),L())}else L()})()),d.debounce))}function L(n){const s=d.loop?v.value%u.value.length:v.value,e=n||u.value[s];let t=document.createElement("div");d.useSlot?t=(function(h,m){return q({render:()=>G("div",{},[w.dm&&w.dm({danmu:h,index:m})])}).mount(document.createElement("div"))})(e,s).$el:(t.innerHTML=e,t.setAttribute("style",a.extraStyle),t.style.fontSize=`${r.fontSize}px`,t.style.lineHeight=`${r.fontSize}px`),t.classList.add("dm"),l.value.appendChild(t),t.style.opacity="0",O((()=>{r.height||(B.value=t.offsetHeight),d.channels||($.value=Math.floor(E.value/(r.height+r.top)));let h=(function(m){let x=[...Array(d.channels).keys()];d.randomChannel&&(x=x.sort((()=>.5-Math.random())));for(let y of x){const b=k.value[y];if(!b||!b.length)return k.value[y]=[m],m.addEventListener("animationend",(()=>k.value[y].splice(0,1))),y%d.channels;for(let C=0;C<b.length;C++){const M=P(b[C])-10;if(M<=.88*(m.offsetWidth-b[C].offsetWidth)||M<=0)break;if(C===b.length-1)return k.value[y].push(m),m.addEventListener("animationend",(()=>k.value[y].splice(0,1))),y%d.channels}}return-1})(t);if(h>=0){const m=t.offsetWidth,x=r.height;t.classList.add("move"),t.dataset.index=`${s}`,t.dataset.channel=h.toString(),t.style.opacity="1",t.style.top=h*(x+r.top)+"px",t.style.width=m+r.right+"px",t.style.setProperty("--dm-scroll-width",`-${p.value+m}px`),t.style.left=`${p.value}px`,t.style.animationDuration=p.value/r.speeds+"s",t.addEventListener("animationend",(()=>{Number(t.dataset.index)!==u.value.length-1||d.loop||i("play-end",t.dataset.index),l.value&&l.value.removeChild(t)})),v.value++}else l.value.removeChild(t)}))}function P(n){const s=n.offsetWidth||parseInt(n.style.width),e=n.getBoundingClientRect().right||l.value.getBoundingClientRect().right+s;return l.value.getBoundingClientRect().right-e}function W(){clearInterval(S),S=0,v.value=0}return X((()=>{console.error("%c [vue3-danmaku] ⚠️ DEPRECATION WARNING","background: #ffcc00; color: #000; padding: 2px 4px; border-radius: 3px; font-weight: bold;",`
该包已停止维护，请迁移至新版官方库: "vue-danmaku"。
This package is deprecated. Please migrate to "vue-danmaku".`),z()})),D((()=>{W()})),{container:f,dmContainer:l,hidden:N,paused:g,danmuList:u,getPlayState:function(){return!g.value},resize:function(){T();const n=l.value.getElementsByClassName("dm");for(let s=0;s<n.length;s++){const e=n[s];e.style.setProperty("--dm-scroll-width",`-${p.value+e.offsetWidth}px`),e.style.left=`${p.value}px`,e.style.animationDuration=p.value/r.speeds+"s"}},play:A,pause:function(){g.value=!0},stop:function(){k.value={},l.value.innerHTML="",g.value=!0,N.value=!1,W()},show:function(){N.value=!1},hide:function(){N.value=!0},reset:function(){B.value=0,z()},add:function(n){if(v.value===u.value.length)return u.value.push(n),u.value.length-1;{const s=v.value%u.value.length;return u.value.splice(s,0,n),s+1}},push:function(n){return u.value.push(n),u.value.length-1},insert:L}}});const F={ref:"container",class:"vue-danmaku"};(function(a,i){i===void 0&&(i={});var w=i.insertAt;if(typeof document<"u"){var f=document.head||document.getElementsByTagName("head")[0],l=document.createElement("style");l.type="text/css",w==="top"&&f.firstChild?f.insertBefore(l,f.firstChild):f.appendChild(l),l.styleSheet?l.styleSheet.cssText=a:l.appendChild(document.createTextNode(a))}})(`.vue-danmaku {
  position: relative;
  overflow: hidden;
}
.vue-danmaku .danmus {
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  -webkit-transition: all 0.3s;
  transition: all 0.3s;
}
.vue-danmaku .danmus.show {
  opacity: 1;
}
.vue-danmaku .danmus.paused .dm.move {
  animation-play-state: paused;
}
.vue-danmaku .danmus .dm {
  position: absolute;
  font-size: 20px;
  color: #ddd;
  white-space: pre;
  transform: translateX(0);
  transform-style: preserve-3d;
}
.vue-danmaku .danmus .dm.move {
  will-change: transform;
  animation-name: moveLeft;
  animation-timing-function: linear;
  animation-play-state: running;
}
.vue-danmaku .danmus .dm.pause {
  animation-play-state: paused;
  z-index: 100;
}
@keyframes moveLeft {
  from {
    transform: translateX(0);
  }
  to {
    transform: translateX(var(--dm-scroll-width));
  }
}
@-webkit-keyframes moveLeft {
  from {
    -webkit-transform: translateX(0);
  }
  to {
    -webkit-transform: translateX(var(--dm-scroll-width));
  }
}`),I.render=function(a,i,w,f,l,p){return V(),_("div",F,[j("div",{ref:"dmContainer",class:U(["danmus",{show:!a.hidden},{paused:a.paused}])},null,2),Z(a.$slots,"default")],512)},I.__file="src/lib/Danmaku.vue";export{I as p};
