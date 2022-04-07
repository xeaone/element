// deno-fmt-ignore-file
// deno-lint-ignore-file
// This code was bundled using `deno bundle` and it's not recommended to edit it manually

const S_EXPORT = `

    ^export\\b
    (?:
        \\s*(default)\\s*
    )?
    (?:
        \\s*(var|let|const|function|class)\\s*
    )?
    (\\s*?:{\\s*)?
    (
        (?:\\w+\\s*,?\\s*)*
    )?
    (\\s*?:}\\s*)?

`.replace(/\s+/g, '');
const S_IMPORT = `

    import
    (?:
        (?:
            \\s+(\\w+)(?:\\s+|\\s*,\\s*)
        )
        ?
        (?:
            (?:\\s+(\\*\\s+as\\s+\\w+)\\s+)
            |
            (?:
                \\s*{\\s*
                (
                    (?:
                        (?:
                            (?:\\w+)
                            |
                            (?:\\w+\\s+as\\s+\\w+)
                        )
                        \\s*,?\\s*
                    )
                    *
                )
                \\s*}\\s*
            )
        )
        ?
        from
    )
    ?
    \\s*
    (?:"|')
    (.*?)
    (?:'|")
    (?:\\s*;)?

`.replace(/\s+/g, '');
const R_IMPORT = new RegExp(S_IMPORT);
const R_EXPORT = new RegExp(S_EXPORT);
const R_IMPORTS = new RegExp(S_IMPORT, 'g');
const R_EXPORTS = new RegExp(S_EXPORT, 'gm');
const R_TEMPLATES = /[^\\]`(.|[\r\n])*?[^\\]`/g;
const isAbsolute = function(path) {
    if (path.startsWith('/') || path.startsWith('//') || path.startsWith('://') || path.startsWith('ftp://') || path.startsWith('file://') || path.startsWith('http://') || path.startsWith('https://')) {
        return true;
    } else {
        return false;
    }
};
const resolve = function(...paths) {
    let path = (paths[0] || '').trim();
    for(let i = 1; i < paths.length; i++){
        const part = paths[i].trim();
        if (path[path.length - 1] !== '/' && part[0] !== '/') {
            path += '/';
        }
        path += part;
    }
    const a = window.document.createElement('a');
    a.href = path;
    return a.href;
};
const fetch = function(url) {
    return new Promise((resolve1, reject)=>{
        const xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function() {
            if (xhr.readyState === 4) {
                if (xhr.status === 200 || xhr.status === 0) {
                    resolve1(xhr.responseText);
                } else {
                    reject(new Error(`failed to import: ${url}`));
                }
            }
        };
        try {
            xhr.open('GET', url, true);
            xhr.send();
        } catch  {
            reject(new Error(`failed to import: ${url}`));
        }
    });
};
const run = function(code) {
    return new Promise(function(resolve2, reject) {
        const blob = new Blob([
            code
        ], {
            type: 'text/javascript'
        });
        const script = document.createElement('script');
        if ('noModule' in script) {
            script.type = 'module';
        }
        script.onerror = function(error) {
            reject(error);
            script.remove();
            URL.revokeObjectURL(script.src);
        };
        script.onload = function() {
            resolve2();
            script.remove();
            URL.revokeObjectURL(script.src);
        };
        script.src = URL.createObjectURL(blob);
        document.head.appendChild(script);
    });
};
const transform = function(code, url) {
    let before = `window.MODULES["${url}"] = Promise.all([\n`;
    let after = ']).then(function ($MODULES) {\n';
    const templateMatches = code.match(R_TEMPLATES) || [];
    for(let i = 0; i < templateMatches.length; i++){
        const templateMatch = templateMatches[i];
        code = code.replace(templateMatch, templateMatch.replace(/'/g, '\\' + '\'').replace(/^([^\\])?`/, '$1\'').replace(/([^\\])?`$/, '$1\'').replace(/\${(.*)?}/g, '\'+$1+\'').replace(/\n/g, '\\n'));
    }
    const parentImport = url.slice(0, url.lastIndexOf('/') + 1);
    const importMatches = code.match(R_IMPORTS) || [];
    for(let i1 = 0, l = importMatches.length; i1 < l; i1++){
        const importMatch = importMatches[i1].match(R_IMPORT);
        if (!importMatch) continue;
        const rawImport = importMatch[0];
        const nameImport = importMatch[1];
        let pathImport = importMatch[4] || importMatch[5];
        if (isAbsolute(pathImport)) {
            pathImport = resolve(pathImport);
        } else {
            pathImport = resolve(parentImport, pathImport);
        }
        before = `${before} \twindow.LOAD("${pathImport}"),\n`;
        after = `${after}var ${nameImport} = $MODULES[${i1}].default;\n`;
        code = code.replace(rawImport, '');
    }
    let hasDefault = false;
    const exportMatches = code.match(R_EXPORTS) || [];
    for(let i2 = 0, l1 = exportMatches.length; i2 < l1; i2++){
        const exportMatch = exportMatches[i2].match(R_EXPORT) || [];
        const rawExport = exportMatch[0];
        const defaultExport = exportMatch[1] || '';
        const typeExport = exportMatch[2] || '';
        const nameExport = exportMatch[3] || '';
        if (defaultExport) {
            if (hasDefault) {
                code = code.replace(rawExport, `$DEFAULT = ${typeExport} ${nameExport}`);
            } else {
                hasDefault = true;
                code = code.replace(rawExport, `var $DEFAULT = ${typeExport} ${nameExport}`);
            }
        }
    }
    if (hasDefault) {
        code += '\n\nreturn { default: $DEFAULT };\n';
    }
    code = '"use strict";\n' + before + after + code + '});';
    return code;
};
const load = async function(url) {
    if (!url) throw new Error('load - url required');
    url = resolve(url);
    if (typeof window.DYNAMIC_SUPPORT !== 'boolean') {
        await run('try { window.DYNAMIC_SUPPORT = true; import("data:text/javascript;base64,"); } catch (e) { /*e*/ }');
        window.DYNAMIC_SUPPORT = window.DYNAMIC_SUPPORT || false;
    }
    if (window.DYNAMIC_SUPPORT === true) {
        await run(`window.MODULES["${url}"] = import("${url}");`);
        return window.MODULES[url];
    }
    if (window.MODULES[url]) {
        return window.MODULES[url];
    }
    if (typeof window.REGULAR_SUPPORT !== 'boolean') {
        const script = document.createElement('script');
        window.REGULAR_SUPPORT = 'noModule' in script;
    }
    let code;
    if (window.REGULAR_SUPPORT) {
        code = `import * as m from "${url}"; window.MODULES["${url}"] = m;`;
    } else {
        code = await fetch(url);
        code = transform(code, url);
    }
    try {
        await run(code);
    } catch  {
        throw new Error(`load - failed to import: ${url}`);
    }
    return window.MODULES[url];
};
window.LOAD = window.LOAD || load;
window.MODULES = window.MODULES || {};
function dash(data) {
    return data.replace(/([a-zA-Z])([A-Z])/g, '$1-$2').toLowerCase();
}
const absolute = function(path) {
    const a = document.createElement('a');
    a.href = path;
    return a.pathname;
};
class XRouter extends HTMLElement {
    static define(name, constructor) {
        constructor = constructor ?? this;
        name = name ?? dash(this.name);
        customElements.define(name, constructor);
    }
    static defined(name) {
        name = name ?? dash(this.name);
        return customElements.whenDefined(name);
    }
    #folder = '';
    #cache = false;
    #dynamic = true;
    #target;
    #paths = [];
    #observer;
    #data = {};
    #external;
    #clickInstance;
    #stateInstance;
    #after;
    #before;
    get hash() {
        return window.location.hash;
    }
    get host() {
        return window.location.host;
    }
    get hostname() {
        return window.location.hostname;
    }
    get href() {
        return window.location.href;
    }
    get origin() {
        return window.location.origin;
    }
    get pathname() {
        return window.location.pathname;
    }
    get port() {
        return window.location.port;
    }
    get protocol() {
        return window.location.protocol;
    }
    get search() {
        return window.location.search;
    }
    back() {
        window.history.back();
    }
    forward() {
        window.history.forward();
    }
    reload() {
        window.location.reload();
    }
    redirect(href) {
        window.location.href = href;
    }
    constructor(option){
        super();
        this.#target = option?.target ?? this;
        this.#stateInstance = this.#state.bind(this);
        this.#clickInstance = this.#click.bind(this);
        this.attachShadow({
            mode: 'open'
        }).innerHTML = `
            <slot name="head"></slot>
            <slot name="body"></slot>
            <slot></slot>
            <slot name="foot"></slot>
        `;
        this.#observer = new MutationObserver((mutations)=>mutations.forEach((mutation)=>{
                console.log(mutation);
                for (const node of mutation.addedNodes){
                    if (node.nodeName === 'A') {
                        console.log('added', node);
                        node.addEventListener('click', this.#clickInstance, true);
                    }
                }
                for (const node1 of mutation.removedNodes){
                    if (node1.nodeName === 'A') {
                        console.log('removed', node1);
                        node1.removeEventListener('click', this.#clickInstance, true);
                    }
                }
            })
        );
        this.#paths = this.getAttribute('paths')?.split(/\s*,\s*/) ?? [];
    }
    path(path) {
        this.#paths.push(path);
        return this;
    }
    target(target) {
        this.#target = target;
        return this;
    }
    assign(data) {
        return this.#go(data, {
            mode: 'push'
        });
    }
    replace(data) {
        return this.#go(data, {
            mode: 'replace'
        });
    }
     #location(href = window.location.href) {
        const parser = document.createElement('a');
        parser.href = href;
        return {
            href: parser.href,
            host: parser.host,
            port: parser.port,
            hash: parser.hash,
            search: parser.search,
            protocol: parser.protocol,
            hostname: parser.hostname,
            pathname: parser.pathname
        };
    }
    async #go(path, options = {}) {
        const mode = options.mode || 'push';
        const location = this.#location(path);
        let element;
        const p = location.pathname.endsWith('/') ? `${location.pathname}root` : location.pathname;
        const base = document.baseURI.replace(window.location.origin, '');
        let load1 = p.startsWith(base) ? p.replace(base, '') : p;
        if (load1.slice(0, 2) === './') load1 = load1.slice(2);
        if (load1.slice(0, 1) !== '/') load1 = '/' + load1;
        if (load1.slice(0, 1) === '/') load1 = load1.slice(1);
        load1 = `${this.#folder}/${load1}.js`.replace(/\/+/g, '/');
        load1 = absolute(load1);
        let component;
        try {
            component = (await load(load1)).default;
        } catch (error) {
            if (error.message === `Failed to fetch dynamically imported module: ${window.location.origin}${load1}`) {
                component = (await load(absolute(`${this.#folder}/all.js`))).default;
            } else {
                throw error;
            }
        }
        const name = 'x-router' + p.replace(/\/+/g, '-');
        console.log(this.#data, location.pathname);
        if (!this.#data[location.pathname]) {
            customElements.define(name, component);
        }
        element = document.createElement(name);
        this.#data[location.pathname] = name;
        console.log(this.#data, location.pathname);
        if (this.#before) await this.#before(location, element);
        if (!this.#dynamic) {
            if (mode === 'push') return globalThis.location.assign(location.href);
            if (mode === 'replace') return globalThis.location.replace(location.href);
        }
        globalThis.history.replaceState({
            href: window.location.href,
            top: document.documentElement.scrollTop || document.body.scrollTop || 0
        }, '', window.location.href);
        if (mode === 'push') globalThis.history.pushState({
            top: 0,
            href: location.href
        }, '', location.href);
        else if (mode === 'replace') globalThis.history.replaceState({
            top: 0,
            href: location.href
        }, '', location.href);
        const keywords = document.querySelector('meta[name="keywords"]');
        const description = document.querySelector('meta[name="description"]');
        if (element.title) window.document.title = element.title;
        if (element.keywords && keywords) keywords.setAttribute('content', element.keywords);
        if (element.description && description) description.setAttribute('content', element.description);
        const nodes = this.childNodes;
        for (const node of nodes){
            if (node?.attributes?.slot?.value === 'body') {
                while(node.firstChild)node.removeChild(node.firstChild);
            } else if (node?.attributes?.slot?.value === 'head' || node?.attributes?.slot?.value === 'foot') {
                continue;
            } else {
                this.removeChild(node);
            }
        }
        if (this.#after) {
            element.removeEventListener('afterconnected', this.#data[location.pathname].after);
            const after = this.#after.bind(this.#after, location, element);
            this.#data[location.pathname].after = after;
            element.addEventListener('afterconnected', after);
        }
        const body = this.querySelector('[slot="body"]');
        if (body) {
            body.appendChild(element);
        } else {
            this.appendChild(element);
        }
        globalThis.dispatchEvent(new CustomEvent('xrouter', {
            detail: location
        }));
    }
    async #state(event) {
        const { href , pathname  } = this.#location(event?.state?.href || window.location.href);
        if (this.#paths[0] !== '*' && !this.#paths.includes(pathname)) return;
        await this.replace(href);
        globalThis.scroll(event?.state?.top || 0, 0);
    }
    async #click(event1) {
        if (event1.button !== 0 || event1.defaultPrevented || event1.altKey || event1.ctrlKey || event1.metaKey || event1.shiftKey) return;
        const target = event1.target;
        if (target.hasAttribute('download') || target.hasAttribute('external') || target.hasAttribute('target') || target.href.startsWith('tel:') || target.href.startsWith('ftp:') || target.href.startsWith('file:)') || target.href.startsWith('mailto:') || !target.href.startsWith(window.location.origin)) return;
        if (this.#external && (this.#external instanceof RegExp && this.#external.test(target.href) || typeof this.#external === 'function' && this.#external(target.href) || typeof this.#external === 'string' && this.#external === target.href)) return;
        if (this.#paths[0] !== '*' && !this.#paths.includes(target.pathname)) return;
        event1.preventDefault();
        await this.assign(target.href);
    }
    async connectedCallback() {
        await this.replace(window.location.href);
        const nodes = this.#target.querySelectorAll('a');
        for (const node of nodes){
            node.addEventListener('click', this.#clickInstance, true);
        }
        this.#observer.observe(this.#target, {
            childList: true
        });
        globalThis.addEventListener('popstate', this.#stateInstance, true);
    }
}
export { XRouter as default };
