import Absolute from './tool/absolute.js';

import S_EXPORT from './import/s-export.js';
import S_IMPORT from './import/s-import.js';

window.MODULES = 'MODULES' in window ? window.MODULES : {};
window.DYNAMIC_SUPPORT = 'DYNAMIC_SUPPORT' in window ? window.DYNAMIC_SUPPORT : undefined;
window.REGULAR_SUPPORT = 'REGULAR_SUPPORT' in window ? window.REGULAR_SUPPORT : undefined;

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
        code = code.replace(templateMatch,
            templateMatch
                .replace(/'/g, '\\\'')
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

        if (pathImport.slice(0, 1) !== '/') {
            pathImport = Absolute(parentImport, pathImport);
        } else {
            pathImport = Absolute(pathImport);
        }

        before = `${before} \twindow.Import("${pathImport}"),\n`;
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

const run = function (code) {
    return new Promise(function (resolve, reject) {
        const blob = new Blob([ code ], { type: 'text/javascript' });
        const script = document.createElement('script');

        if ('noModule' in script) {
            script.type = 'module';
        }

        script.onerror = function (e) {
            reject(e);
            script.remove();
            URL.revokeObjectURL(script.src);
        };

        script.onload = function (e) {
            resolve(e);
            script.remove();
            URL.revokeObjectURL(script.src);
        };

        script.src = URL.createObjectURL(blob);

        window.document.head.appendChild(script);
    });
};

const request = function (url) {
    return new Promise(function (resolve, reject) {
        const xhr = new XMLHttpRequest();

        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4) {
                if (xhr.status === 200 || xhr.status === 0) {
                    resolve(xhr.responseText);
                } else {
                    reject(new Error(`failed to import: ${url}`));
                }
            }
        };

        try {
            xhr.open('GET', url, true);
            xhr.send();
        } catch (error) {
            reject(new Error(`failed to import: ${url}`));
        }

    });
};

// const normalize = function (url) {
//     const a = window.document.createElement('a');
//     a.href = url;
//     return a.href;
// };

export default async function Import (url) {
    if (!url) throw new Error('import url required');

    url = Absolute(url);
    // url = normalize(url);

    if (typeof window.DYNAMIC_SUPPORT !== 'boolean') {
        await run('try { window.DYNAMIC_SUPPORT = true; import(""); } catch (e) { //e }');
        window.DYNAMIC_SUPPORT = window.DYNAMIC_SUPPORT || false;
    }

    if (window.DYNAMIC_SUPPORT === true) {
        console.log('native import');
        await run(`window.MODULES[${url}] = import("${url}")`);
        return window.MODULES[url];
        // return new Function('url', 'return import(url)')(url);
    }

    console.log('not native import');

    if (window.MODULES[url]) {
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
        code = request(url);
        code = transform(code, url);
    }

    try {
        await run(code);
    } catch (error) {
        throw new Error(`failed to import: ${url}`);
    }

    return window.MODULES[url];
}
