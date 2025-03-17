/**
* @version 10.0.5
*
* @license
* Copyright (C) Alexander Elias
* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/.
*
* @module
*/

var ue=globalThis.XGLOBAL??(globalThis.XGLOBAL=Object.freeze({Bound:new WeakMap,BindersCache:new Set,TemplatesCache:new WeakMap,ContainersCache:new WeakMap,MarkSymbol:Symbol("mark"),ViewSymbol:Symbol("view"),TemplateSymbol:Symbol("template"),VariablesSymbol:Symbol("variables")})),{BindersCache:g,TemplatesCache:W,ContainersCache:C,MarkSymbol:h,ViewSymbol:p,TemplateSymbol:j,VariablesSymbol:F}=ue;var fe=new RegExp(["^[.@$]?(",["src","href","data","action","srcdoc","xlink:href","cite","formaction","ping","poster","background","classid","codebase","longdesc","profile","usemap","icon","manifest","archive"].join("|"),")"].join(""),"i"),me=new RegExp(["^[.@$]?(",["hidden","allowfullscreen","async","autofocus","autoplay","checked","controls","default","defer","disabled","formnovalidate","inert","ismap","itemscope","loop","multiple","muted","nomodule","novalidate","open","playsinline","readonly","required","reversed","selected"].join("|"),")"].join(""),"i");var pe=/^[.@$]?ontimeout$/i,ye=/^[.@$]?ononce$/i,de=/^[.@$]?value$/i,U=/^[.@$]?on/i;var he=/^(?!javascript:)(?:[a-z0-9+.-]+:|[^&:\/?#]*(?:[\/?#]|$))/i,w=function(e){return e&&typeof e=="string"?fe.test(e):!1},k=function(e){return e&&typeof e=="string"?me.test(e):!1},G=function(e){return e&&typeof e!="string"&&typeof e[Symbol.iterator]=="function"};var Z=function(e){return e&&typeof e=="string"?ye.test(e):!1},J=function(e){return e&&typeof e=="string"?pe.test(e):!1},O=function(e){return e&&typeof e=="string"?de.test(e):!1},d=function(e){return e&&typeof e=="string"?U.test(e):!1};var q=function(e,t){return e&&t&&typeof e=="string"&&typeof t=="string"?e.toLowerCase()===t.toLowerCase():!1},Y=function(e,t){return e&&typeof e=="string"?e.indexOf(t)!==-1:!1},R=function(e){return e&&typeof e=="string"?e.replace(U,""):""},K=function(e){return e.nodeType===Node.ATTRIBUTE_NODE?e.parentNode?.isConnected??!1:e.isConnected},Q=function(){return`x-${`${Math.floor(Math.random()*Date.now())}`.slice(0,10)}-x`},$=function(e){return e===""||typeof e!="string"?!1:!he.test(e)},P=function(e,t){let n=t.previousSibling;for(;n&&n!==e;)n.parentNode?.removeChild(n),n=t.previousSibling},z=function(e){e.parentNode.removeChild(e)},T=function(e,t){e instanceof Node||(e=t.ownerDocument.createTextNode(`${e}`)),t.parentNode.insertBefore(e,t)},ee=function(e,t){e instanceof Node||(e=t.ownerDocument.createTextNode(`${e}`)),t.parentNode.insertBefore(e,t.nextSibling)},te=function(e,t){t.parentNode.replaceChild(e,t)},X=function(e,...t){for(;e.lastChild;)e.removeChild(e.lastChild);for(let n of t)e.appendChild(typeof n=="string"?e.ownerDocument.createTextNode(n):n)};var y=function(e){return{data:e instanceof Node?new WeakRef(e):e,get:function(){return this.data instanceof WeakRef?this.data.deref():this.data},set:function(t){return t instanceof Node?(this.data=new WeakRef(t),t):(this.data=t,t)}}};var oe=function(e,t,n,o){n=n?.toLowerCase()??"",o=o?.toLowerCase()??"",n!==o&&(d(n)?typeof t.value=="function"&&e.removeEventListener(R(n),t.value,!0):O(n)?(e.removeAttribute(n),Reflect.set(e,n,null)):k(n)?(e.removeAttribute(n),Reflect.set(e,n,!1)):(w(n)||n)&&(e.removeAttribute(n),Reflect.deleteProperty(e,n)),!d(o)&&(k(o)?(t.value="",e.setAttribute(o,""),Reflect.set(e,o,!0)):o&&(e.setAttribute(o,""),Reflect.set(e,o,null)),t.name=o||""))};var B=function(e){switch(`${e}`){case"NaN":return"";case"null":return"";case"undefined":return""}switch(typeof e){case"string":return e;case"number":return`${e}`;case"bigint":return`${e}`;case"boolean":return`${e}`;case"symbol":return String(e);case"object":return JSON.stringify(e)}throw new Error("XElement - display type not handled")};var A,M,Te=async function(){await M,await new Promise(e=>{queueMicrotask(async()=>{A=void 0,await D(),e(void 0)})})},D=async function(){M?A?await A:(A=Te(),await A):(M=new Promise(e=>{queueMicrotask(async()=>{let t=g.values();for(let n of t)try{await V(n)}catch(o){console.error(o)}M=void 0,e()})}),await M)};var I=function(e){return{get target(){return e?.node},query(t){return e?.node?.getRootNode()?.querySelector(t)}}};var ne=function(e,t,n,o){if(n!==o){if(!t.name){console.warn("attribute binder name required");return}if(O(t.name))if(e.nodeName==="SELECT"){let r=e.options,l=Array.isArray(o);for(let c of r)c.selected=l?o.includes(c.value):`${o}`===c.value}else t.value=B(o),e.setAttribute(t.name,t.value),Reflect.set(e,t.name,t.value);else if(w(t.name)){if(t.value=encodeURI(o),$(t.value)){e.removeAttribute(t.name),console.warn(`XElement - attribute name "${t.name}" and value "${t.value}" not allowed`);return}e.setAttribute(t.name,t.value),Reflect.set(e,t.name,t.value)}else if(k(t.name)){let r=!!o;r?e.setAttribute(t.name,""):e.removeAttribute(t.name),Reflect.set(e,t.name,r)}else if(d(t.name)){e.hasAttribute(t.name)&&e.removeAttribute(t.name),typeof t.value=="function"&&e.removeEventListener(R(t.name),t.value,n?.[1]??!0);let r=typeof o=="function"?o:o?.[0];if(typeof r!="function")return console.warn(`XElement - attribute name "${t.name}" expected a function`);let l;t.value=function(){if(e.nodeName==="INPUT"&&e.type==="radio"){let s=e.ownerDocument.querySelectorAll(`input[name="${e.name}"]`);for(let i of s)i.checked&&(l=i.checked)}let c=r.call(this,I(t));return c!==l&&(l=c,D()),c},Z(t.name)?t.value():J(t.name)?setTimeout(t.value,o?.[1]):e.addEventListener(R(t.name),t.value,o?.[1]??!0)}else t.value=o,e.setAttribute(t.name,t.value),Reflect.set(e,t.name,t.value)}};var se=function(e){return e?.[p]?e():e instanceof Node?e:B(e)},re=function(e,t,n,o){if(o==null)e.textContent!==""&&(e.textContent="");else if(o?.[p])t.start||(t.start=document.createTextNode(""),T(t.start,e)),t.end||(e.textContent="",t.end=e),P(t.start,t.end),T(o(),t.end);else if(o instanceof DocumentFragment)t.start||(t.start=document.createTextNode(""),T(t.start,e)),t.end||(e.textContent="",t.end=e),P(t.start,t.end),T(o,t.end);else if(G(o)){t.length===void 0&&(t.length=0),t.results||(t.results=[]),t.markers||(t.markers=[]),t.start||(t.start=document.createTextNode(""),T(t.start,e)),t.end||(e.textContent="",t.end=e);let r=t.length,l=o.length,c=Math.min(r,l);for(let s=0;s<c;s++){if(o[s]===t.results[s]||o[s]?.[p]&&t.results[s]?.[p]&&o[s]?.[h]===t.results[s]?.[h])continue;let i=t.markers[s],a=t.markers[s+1]??t.end;for(;a.previousSibling&&a.previousSibling!==i;)z(a.previousSibling);let u=se(o[s]);ee(u,i),console.log(t.results[s],o[s],u,i),t.results[s]=o[s]}if(r<l)for(;t.length!==o.length;){let s=document.createTextNode(""),i=se(o[t.length]);t.markers.push(s),t.results.push(o[t.length]),T(s,t.end),T(i,t.end),t.length++}else if(r>l){let s=t.markers[o.length-1],i=t.end;for(;i.previousSibling&&i.previousSibling!==s;)z(i.previousSibling);t.length=o.length,t.results.length=o.length,t.markers.length=o.length}}else if(o instanceof Node)te(o,e);else{if(e.textContent===`${o}`)return;e.textContent=`${o}`}};var Ne=function(e,t,n,o){console.warn("element action not implemented")},V=function(e){let t=e.node;if(!t||!K(t)&&e.isInitialized)return;let n=e.variable,o=typeof n=="function",r=o&&n[p],l=e.type===3&&d(e.name),c=!r&&!l&&o;(l||r||!o)&&e.remove();let s=c?n(I(e)):r?n():n,i=e.source;if(!("source"in e&&(i===s||i?.[p]&&s?.[p]&&i?.[h]===s?.[h]))){if(e.type===1)Ne(t,e,i,s);else if(e.type===2)oe(t,e,i,s);else if(e.type===3)ne(t,e,i,s);else if(e.type===4)re(t,e,i,s);else throw new Error("instruction type not valid");e.source=s,e.isInitialized=!0}};var x=function(e,t,n,o,r,l){let c={type:e,isInitialized:!1,get variable(){return n[t]},set variable(s){n[t]=s},get node(){let s=o.get();if(s)return s;g.delete(this)},get name(){return r.get()},set name(s){r.set(s)},get value(){return l.get()},set value(s){l.set(s)},remove(){g.delete(this)},add(){g.add(this)}};return c.add(),c};var we=5,ie=function(e,t,n,o){if(typeof o=="string"){let a=document.querySelector(o);if(!a)throw new Error("query not found");let u=C.get(a);if(u&&u===e)return a;C.set(a,e)}else if(o instanceof Element||o instanceof ShadowRoot){let a=C.get(o);if(a&&a===e)return o;C.set(o,e)}let r=[],l=e.content.cloneNode(!0),c=document.createTreeWalker(l,we,null),s,i=0;for(;c.nextNode();){s=c.currentNode;let a=s.nodeType;if(a===3){let u=s,N=u.nodeValue?.indexOf(n)??-1;if(N===-1)continue;N!==0&&(u.splitText(N),s=c.nextNode(),u=s);let m=n.length;m!==u.nodeValue?.length&&u.splitText(m);let b=y(u),f=x(4,i++,t,b);r.unshift(f)}else if(a===1){let u=s,N=u.tagName;(N==="STYLE"||N==="SCRIPT")&&c.nextSibling();let m;if(q(N,n)){m=y(s);let f=x(1,i++,t,m);r.unshift(f)}let b=u.getAttributeNames();for(let f of b){let L=u.getAttribute(f)??"",_=q(f,n),H=Y(L,n);if(_||H){if(m=m??y(s),_&&H){let v=y(""),E=y(""),S=x(2,i++,t,m,v,E),ae=x(3,i++,t,m,v,E);u.removeAttribute(f),r.unshift(S),r.unshift(ae)}else if(_){let v=y(""),E=y(L),S=x(2,i++,t,m,v,E);u.removeAttribute(f),r.unshift(S)}else if(H){let v=y(f),E=y(""),S=x(3,i++,t,m,v,E);u.removeAttribute(f),r.unshift(S)}}else w(f)?$(L)&&(u.removeAttribute(f),console.warn(`attribute name "${f}" and value "${L}" not allowed`)):d(f)&&(u.removeAttribute(f),console.warn(`attribute name "${f}" not allowed`))}}else console.warn(`walker node type "${a}" not handled`)}for(let a of r)V(a);if(typeof o=="string"){let a=document.querySelector(o);if(!a)throw new Error("query not found");return X(a,l),a}else return o instanceof Element||o instanceof ShadowRoot?(X(o,l),o):l};var le=function(e){return e=e.replace(/([a-zA-Z])([A-Z])/g,"$1-$2"),e=e.toLowerCase(),e=e.includes("-")?e:`x-${e}`,e};var Se=function(e,t){return function(n){let o=le(e),r=t;customElements.define(o,n,{extends:r})}};var ce=new WeakMap,Ce=function(e){if(e.shadowRoot){let t=document.getRootNode();e.shadowRoot.adoptedStyleSheets.push(...t.adoptedStyleSheets);for(let n of t.styleSheets){let o=ce.get(n);if(!o){o=new CSSStyleSheet;let{cssRules:r}=n;for(let{cssText:l}of r)o.insertRule(l);ce.set(n,o)}e.shadowRoot.adoptedStyleSheets.push(o)}}};var Nt=function(e,...t){let n,o,r=W.get(e);if(r)n=r.marker,o=r.template;else{n=Q();let c="",s=e.length-1;for(let i=0;i<s;i++)c+=`${e[i]}${n}`;c+=e[s],o=document.createElement("template"),o.innerHTML=c,W.set(e,{template:o,marker:n})}let l={[p]:!0,[h]:n,[j]:o,[F]:t};return Object.assign(ie.bind(l,o,t,n),l)};export{Se as define,Nt as html,Ce as style,D as update};
//# sourceMappingURL=x-element.js.map
