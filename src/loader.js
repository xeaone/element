import Path from './path.js';

// https://regexr.com/4uued
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

// https://regexr.com/4uq22
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

const MODULES = {};
const R_IMPORT = new RegExp(S_IMPORT);
const R_EXPORT = new RegExp(S_EXPORT);
const R_IMPORTS = new RegExp(S_IMPORT, 'g');
const R_EXPORTS = new RegExp(S_EXPORT, 'gm');
const R_TEMPLATES = /[^\\]`(.|[\r\n])*?[^\\]`/g;

const transform = function (code, url) {

    let before = `window.Oxe.loader.data["${url}"] = Promise.all([\n`;
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
        const pathImport = importMatch[4] || importMatch[5];

        if (pathImport.slice(0, 1) !== '/') {
            pathImport = Path.resolve(parentImport, pathImport);
        } else {
            pathImport = Path.resolve(pathImport);
        }

        before = before + '\twindow.Oxe.loader.load("' + pathImport + '"),\n';
        after = after + 'var ' + nameImport + ' = $MODULES[' + i + '].default;\n';

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

const IMPORT = function (url) {
    return new Promise(function (resolve, reject) {

        const a = window.document.createElement('a');
        a.href = url;
        url = a.href;

        if (MODULES[url]) {
            return resolve(MODULES[url]);
        }

        const script = document.createElement('script');

        const clean = function () {
            script.remove();
            URL.revokeObjectURL(script.src);
        };

        script.defer = 'defer';

        if ('noModule' in script) {
            script.type = 'module';
        }

        script.onerror = function () {
            reject(new Error(`failed to import: ${url}`));
            clean();
        };

        script.onload = function () {
            resolve(MODULES[url]);
            clean();
        };

        if (false) {
        // if ('noModule' in script) {
            console.log('noModule yes');
            const code = 'import * as m from "' + url + '"; Oxe.loader.data["' + url + '"] = m;';
            const blob = new Blob([ code ], { type: 'text/javascript' });
            script.src = URL.createObjectURL(blob);
            window.document.head.appendChild(script);
        } else {
            console.log('noModule no');
            const xhr = new XMLHttpRequest();

            xhr.onreadystatechange = function () {
                if (xhr.readyState === 4) {
                    if (xhr.status === 200 || xhr.status === 0) {
                        const code = transform(xhr.responseText, url);
                        const blob = new Blob([ code ], { type: 'text/javascript' });
                        script.src = URL.createObjectURL(blob);
                        window.document.head.appendChild(script);
                    } else {
                        reject(new Error(`failed to import: ${url}`));
                        clean();
                    }
                }
            };

            try {
                xhr.open('GET', url, true);
                xhr.send();
            } catch (e) {
                reject(new Error(`failed to import: ${url}`));
                clean();
            }

        }

    });
};

let native;
try {
    new Function('import("")');
    native = true;
} catch {
    native = false;
}

const load = async function (url) {
    if (!url) throw new Error('Oxe.loader.load - url argument required');

    url = Path.resolve(url);

    if (native) {
    // if (false) {
        console.log('native import');
        return new Function('url', 'return import(url)')(url);
    } else {
        console.log('not native import');
        return IMPORT(url);
    }

};

const setup = async function (options = {}) {
    const { loads } = options;

    if (loads) {
        return Promise.all(loads.map(load => this.load(load)));
    }

};

export default Object.freeze({
    data: MODULES,
    options: {},
    setup, load
});
