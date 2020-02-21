
// innerHandler (character, index, string) {
//     if (string[index-1] === '\\') return;
//     if (character === '"') return '\\"';
//     if (character === '\t') return '\\t';
//     if (character === '\r') return '\\r';
//     if (character === '\n') return '\\n';
//     if (character === '\b') return '\\b';
//     if (character === '\'') return '\\\'';
// },
//
// updateString (value, index, string) {
//     return string.slice(0, index) + value + string.slice(index+1);
// },
//
// updateIndex (value, index) {
//     return index + value.length-1;
// },
//
// template (data) {
//
//     var first = data.indexOf('`');
//     var second = data.indexOf('`', first+1);
//
//     if (first === -1 || second === -1) return data;
//
//     var value;
//     var ends = 0;
//     var starts = 0;
//     var string = data;
//     var isInner = false;
//
//     for (var index = 0; index < string.length; index++) {
//         var character = string[index];
//
//         if (character === '`' && string[index-1] !== '\\') {
//
//             if (isInner) {
//                 ends++;
//                 value = '\'';
//                 isInner = false;
//                 string = this.updateString(value, index, string);
//                 index = this.updateIndex(value, index);
//             } else {
//                 starts++;
//                 value = '\'';
//                 isInner = true;
//                 string = this.updateString(value, index, string);
//                 index = this.updateIndex(value, index);
//             }
//
//         } else if (isInner) {
//             value = this.innerHandler(character, index, string);
//
//             if (value) {
//                 string = this.updateString(value, index, string);
//                 index = this.updateIndex(value, index);
//             }
//
//         }
//
//     }
//
//     string = string.replace(/\${(.*?)}/g, '\'+$1+\'');
//
//     if (starts === ends) {
//         return string;
//     } else {
//         throw new Error('import transformer missing backtick');
//     }
//
// },

const ImportPath = function (data) {
    const parser = window.document.createElement('a');

    const hash = window.location.hash;
    const search = window.location.search;
    const origin = window.location.origin;
    const protocol = window.location.protocol + '//';

    if (data.slice(0, origin.length) === origin) {
        data = data.slice(origin.length);
    }

    if (data.slice(0, protocol.length) === protocol) {
        data = data.slice(protocol.length);
    }

    if (data.slice(-hash.length) === hash) {
        data = data.slice(0, -hash.length);
    }

    if (data.slice(-search.length) === search) {
        data = data.slice(0, -search.length);
    }

    data = (data || '/').replace(/\/+/g, '/');

    parser.href = data;

    data = parser.pathname;
    data = data ? data : '/';

    if (data !== '/' && data.slice(-1) === '/') {
        data = data.slice(0, -1);
    }

    return data;
};


const MODULES = {};

// https://regexr.com/4uq8k
const S_EXPORT = '^export\\b(?:\\s*(default)\\s*)?(?:\\s*(var|let|const|function|class)\\s*)?(?:\\s*(\\w+)\\s*)?';

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

const R_IMPORT = new RegExp(S_IMPORT);
const R_IMPORTS = new RegExp(S_IMPORT, 'g');
const R_EXPORT = new RegExp(S_EXPORT);
const R_EXPORTS = new RegExp(S_EXPORT, 'gm');
const R_TEMPLATES = /[^\\]`(.|[\r\n])*?[^\\]`/g;

const transform = function (code, url) {

    let before = `window.Oxe.loader.data["${url}"] = Promise.all([\n`;
    let after = ']).then(function ($MODULES) {\n';

    const templateMatches = code.match(R_TEMPLATES) || [];
    for (let i = 0; i < templateMatches.length; i++) {
        // console.log(templateMatches[i]);
        code = code.replace(templateMatches[i],
            templateMatches[i]
                .replace(/'/g, '\\\'')
                .replace(/^([^\\])?`/, '$1\'')
                .replace(/([^\\])?`$/, '$1\'')
                .replace(/\${(.*)?}/g, '\'+$1+\'')
                .replace(/\n/g, '\\n')
        );
    }
    // console.log(code);

    const parentImport = url.slice(0, url.lastIndexOf('/') + 1);
    const importMatches = code.match(R_IMPORTS) || [];
    // console.log(importMatches);
    for (let i = 0, l = importMatches.length; i < l; i++) {
        const importMatch = importMatches[i].match(R_IMPORT) || [];
        // console.log(importMatch);

        var rawImport = importMatch[0];
        var nameImport = importMatch[1]; // default
        var pathImport = importMatch[4] || importMatch[5];

        if (pathImport.slice(0, 1) !== '/') {
            pathImport = ImportPath(parentImport + '/' + pathImport);
        } else {
            pathImport = ImportPath(pathImport);
        }

        before = before + '\twindow.Oxe.loader.load("' + pathImport + '"),\n';
        after = after + 'var ' + nameImport + ' = $MODULES[' + i + '].default;\n';

        code = code.replace(rawImport, '') || [];
    }

    let hasDefault = false;
    const exps = code.match(R_EXPORTS) || [];
    for (let i = 0, l = exps.length; i < l; i++) {
        const exp = exps[i].match(R_EXPORT) || [];
        const rawExport = exp[0];
        const defaultExport = exp[1] || '';
        const typeExport = exp[2] || '';
        const nameExport = exp[3] || '';
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
    // window._import.modules = window._import.modules || {};
    return new Promise(function (resolve, reject) {

        var a = window.document.createElement('a');
        a.setAttribute('href', url);
        url = a.href;

        // if (window._import.modules[url]) {
        if (MODULES[url]) {
            // return resolve(window._import.modules[url]);
            return resolve(MODULES[url]);
        }

        var script = document.createElement('script');

        var clean = function () {
            script.remove();
            URL.revokeObjectURL(script.src);
        };

        script.defer = 'defer';

        if ('noModule' in script) {
            script.type = 'module';
        }

        script.onerror = function () {
            reject(new Error('failed to import: ' + url));
            clean();
        };

        script.onload = function () {
            // resolve(window._import.modules[url]);
            resolve(MODULES[url]);
            clean();
        };

        if (false) {
        // if ('noModule' in script) {
            // var code = 'import * as m from "' + url + '"; window._import.modules["' + url + '"] = m;';
            var code = 'import * as m from "' + url + '"; Oxe.loader.data["' + url + '"] = m;';
            var blob = new Blob([ code ], { type: 'text/javascript' });

            script.src = URL.createObjectURL(blob);

            document.head.appendChild(script);
        } else {
            var xhr = new XMLHttpRequest();

            xhr.onreadystatechange = function () {
                if (xhr.readyState === 4) {
                    if (xhr.status === 200 || xhr.status === 0) {
                        var code = xhr.responseText;

                        code = transform(code, url);

                        var blob = new Blob([ code ], { type: 'text/javascript' });
                        script.src = URL.createObjectURL(blob);

                        document.head.appendChild(script);
                    } else {
                        reject(new Error('failed to import: ' + url));
                        clean();
                    }
                }
            };

            try {
                xhr.open('GET', url, true);
                xhr.send();
            } catch (e) {
                reject(new Error('failed to import: ' + url));
                clean();
            }

        }

    });
};

export default Object.freeze({

    data: MODULES,
    options: {},

    async setup (options) {
        options = options || {};

        const loads = options.loads;

        if (loads) {
            return Promise.all(loads.map(load => this.load(load)));
        }

    },

    async load () {
        let url, type;

        if (typeof arguments[0] === 'object') {
            url = arguments[0]['url'];
            type = arguments[0]['type'];
        } else {
            url = arguments[0];
            type = arguments[1] || this.options.type;
        }

        if (!url) {
            throw new Error('Oxe.loader.load - url argument required');
        }

        // try {
        //     const a = window.document.createElement('a');
        //     a.setAttribute('href', url);
        //     url = a.href;
        //     const method = new Function('url', 'return import(url);');
        //     return method(url);
        // } catch (error) {
            return IMPORT(url);
        // }

    }

});
