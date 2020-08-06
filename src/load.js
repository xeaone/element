import absolute from './path/absolute.js';
import resolve from './path/resolve.js';
import fetch from './load/fetch.js';
import run from './load/run.js';

import S_EXPORT from './load/s-export.js';
import S_IMPORT from './load/s-import.js';

const R_IMPORT = new RegExp(S_IMPORT);
const R_EXPORT = new RegExp(S_EXPORT);
const R_IMPORTS = new RegExp(S_IMPORT, 'g');
const R_EXPORTS = new RegExp(S_EXPORT, 'gm');
const R_TEMPLATES = /[^\\]`(.|[\r\n])*?[^\\]`/g;

const transform = function (code, url) {

    let before = `window.MODULES["${url}"] = Promise.all([\n`;
    let after = ']).then(function ($MODULES) {\n';

    const templateMatches = code.match(R_TEMPLATES) || [];
    for (let i = 0; i < templateMatches.length; i++) {
        const templateMatch = templateMatches[i];
        code = code.replace(
            templateMatch,
            templateMatch
                .replace(/'/g, '\\' + '\'')
                .replace(/^([^\\])?`/, '$1\'')
                .replace(/([^\\])?`$/, '$1\'')
                .replace(/\${(.*)?}/g, '\'+$1+\'')
                .replace(/\n/g, '\\n')
        );
    }

    const parentImport = url.slice(0, url.lastIndexOf('/') + 1);
    const importMatches = code.match(R_IMPORTS) || [];
    for (let i = 0, l = importMatches.length; i < l; i++) {
        const importMatch = importMatches[i].match(R_IMPORT);
        if (!importMatch) continue;

        const rawImport = importMatch[0];
        const nameImport = importMatch[1]; // default
        let pathImport = importMatch[4] || importMatch[5];

        if (absolute(pathImport)) {
            pathImport = resolve(pathImport);
        } else {
            pathImport = resolve(parentImport, pathImport);
        }

        before = `${before} \twindow.LOAD("${pathImport}"),\n`;
        after = `${after}var ${nameImport} = $MODULES[${i}].default;\n`;

        code = code.replace(rawImport, '') || [];
    }

    let hasDefault = false;
    const exportMatches = code.match(R_EXPORTS) || [];
    for (let i = 0, l = exportMatches.length; i < l; i++) {
        const exportMatch = exportMatches[i].match(R_EXPORT) || [];
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

const load = async function (url) {
    if (!url) throw new Error('Oxe.load - url required');

    url = resolve(url);

    // window.REGULAR_SUPPORT = false;
    // window.DYNAMIC_SUPPORT = false;

    if (typeof window.DYNAMIC_SUPPORT !== 'boolean') {
        await run('try { window.DYNAMIC_SUPPORT = true; import("data:text/javascript;base64,"); } catch (e) { /*e*/ }');
        window.DYNAMIC_SUPPORT = window.DYNAMIC_SUPPORT || false;
    }

    if (window.DYNAMIC_SUPPORT === true) {
        console.log('native import');
        await run(`window.MODULES["${url}"] = import("${url}");`);
        return window.MODULES[url];
    }

    console.log('not native import');

    if (window.MODULES[url]) {
        // maybe clean up
        return window.MODULES[url];
    }

    if (typeof window.REGULAR_SUPPORT !== 'boolean') {
        const script = document.createElement('script');
        window.REGULAR_SUPPORT = 'noModule' in script;
    }

    let code;

    if (window.REGULAR_SUPPORT) {
        console.log('noModule: yes');
        code = `import * as m from "${url}"; window.MODULES["${url}"] = m;`;
    } else {
        console.log('noModule: no');
        code = await fetch(url);
        code = transform(code, url);
    }

    try {
        await run(code);
    } catch {
        throw new Error(`Oxe.load - failed to import: ${url}`);
    }

    return this.modules[url];
};

window.LOAD = window.LOAD || load;
window.MODULES = window.MODULES || {};

export default load;

// load.modules = load.modules || {};

// window.importer = window.importer || importer;
// window.importer.modules = window.importer.modules || {};
// window.DYNAMIC_SUPPORT = 'DYNAMIC_SUPPORT' in window ? window.DYNAMIC_SUPPORT : undefined;
// window.REGULAR_SUPPORT = 'REGULAR_SUPPORT' in window ? window.REGULAR_SUPPORT : undefined;
//
// const observer = new MutationObserver(mutations => {
//     mutations.forEach(({ addedNodes }) => {
//         addedNodes.forEach(node => {
//             if (
//                 node.nodeType === 1 &&
//                 node.nodeName === 'SCRIPT'&&
//                 node.type === 'module' &&
//                 node.src
//             ) {
//                 const src = node.src;
//                 // node.src = '';
//                 node.type = 'module/blocked';
//                 Promise.resolve().then(() => dynamic()).then(() => {
//                     if (window.DYNAMIC_SUPPORT) {
//                         // node.src = src;
//                         node.type = 'module';
//                     } else {
//                         return window.importer(src);
//                     }
//                 });
//             }
//         });
//     });
// });
//
// observer.observe(document.documentElement, { childList: true, subtree: true });

// const load = function load () {
//     const scripts = document.getElementsByTagName('script');
//     // var anonCnt = 0;
//
//     for (let i = 0; i < scripts.length; i++) {
//         const script = scripts[i];
//         if (script.type == 'module' && !script.loaded) {
//             script.loaded = true;
//             if (script.src) {
//                 script.parentElement.reomveChild(script);
//                 window.importer(script.src);
//             } else {
//             // anonymous modules supported via a custom naming scheme and registry
//                 // var uri = './<anon' + ++anonCnt + '>';
//                 // if (script.id !== ""){
//                 //     uri = "./" + script.id;
//                 // }
//                 //
//                 // var anonName = resolveIfNotPlain(uri, baseURI);
//                 // anonSources[anonName] = script.innerHTML;
//                 // loader.import(anonName);
//             }
//         }
//     }
//
//     // document.removeEventListener('DOMContentLoaded', , false );
// };

// if (document.readyState === 'complete') {
//     load();
// } else {
//     document.addEventListener('DOMContentLoaded', load, false);
// }
