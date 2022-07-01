
declare global {
    interface Window {
        LOAD: any;
        MODULES: any;
        REGULAR: any;
        REGULAR_SUPPORT: any;
        DYNAMIC_SUPPORT: any;
    }
}

// https://regexr.com/5nj32
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

// https://regexr.com/5nj38
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

const isAbsolute = function (path: string) {
    if (
        path.startsWith('/') ||
        path.startsWith('//') ||
        path.startsWith('://') ||
        path.startsWith('ftp://') ||
        path.startsWith('file://') ||
        path.startsWith('http://') ||
        path.startsWith('https://')
    ) {
        return true;
    } else {
        return false;
    }
};

const resolve = function (...paths: string[]) {
    let path = (paths[ 0 ] || '').trim();

    for (let i = 1; i < paths.length; i++) {
        const part = paths[ i ].trim();

        if (path[ path.length - 1 ] !== '/' && part[ 0 ] !== '/') {
            path += '/';
        }

        path += part;
    }

    const a = window.document.createElement('a');

    a.href = path;

    return a.href;
};

const fetch = function (url: string): Promise<string> {
    return new Promise((resolve, reject) => {
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
        } catch {
            reject(new Error(`failed to import: ${url}`));
        }

    });
};

const run = function (code: string): Promise<void> {
    return new Promise(function (resolve, reject) {
        const blob = new Blob([ code ], { type: 'text/javascript' });
        const script = document.createElement('script');

        if ('noModule' in script) {
            script.type = 'module';
        }

        script.onerror = function (error) {
            reject(error);
            script.remove();
            URL.revokeObjectURL(script.src);
        };

        script.onload = function () {
            resolve();
            script.remove();
            URL.revokeObjectURL(script.src);
        };

        script.src = URL.createObjectURL(blob);

        document.head.appendChild(script);
    });
};

const transform = function (code: string, url: string) {

    let before = `window.MODULES["${url}"] = Promise.all([\n`;
    let after = ']).then(function ($MODULES) {\n';

    const templateMatches = code.match(R_TEMPLATES) || [];
    for (let i = 0; i < templateMatches.length; i++) {
        const templateMatch = templateMatches[ i ];
        code = code.replace(
            templateMatch,
            templateMatch
                .replace(/'/g, "\\'")
                .replace(/^([^\\])?`/, '$1\'')
                .replace(/([^\\])?`$/, '$1\'')
                .replace(/\${(.*)?}/g, '\'+$1+\'')
                .replace(/\n/g, '\\n')
        );
    }

    const parentImport = url.slice(0, url.lastIndexOf('/') + 1);
    const importMatches = code.match(R_IMPORTS) || [];
    for (let i = 0, l = importMatches.length; i < l; i++) {
        const importMatch = importMatches[ i ].match(R_IMPORT);
        if (!importMatch) continue;

        const rawImport = importMatch[ 0 ];
        const nameImport = importMatch[ 1 ]; // default
        let pathImport = importMatch[ 4 ] || importMatch[ 5 ];

        if (isAbsolute(pathImport)) {
            pathImport = resolve(pathImport);
        } else {
            pathImport = resolve(parentImport, pathImport);
        }

        before = `${before} \twindow.LOAD("${pathImport}"),\n`;
        after = `${after}var ${nameImport} = $MODULES[${i}].default;\n`;

        code = code.replace(rawImport, '');
        // code = code.replace(rawImport, '') || [];
    }

    let hasDefault = false;
    const exportMatches = code.match(R_EXPORTS) || [];
    for (let i = 0, l = exportMatches.length; i < l; i++) {
        const exportMatch = exportMatches[ i ].match(R_EXPORT) || [];
        const rawExport = exportMatch[ 0 ];
        const defaultExport = exportMatch[ 1 ] || '';
        const typeExport = exportMatch[ 2 ] || '';
        const nameExport = exportMatch[ 3 ] || '';
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

const load = async function (url: string) {
    if (!url) throw new Error('load - url required');

    url = resolve(url);

    if (typeof window.DYNAMIC_SUPPORT !== 'boolean') {
        await run('try { window.DYNAMIC_SUPPORT = true; import("data:text/javascript;base64,"); } catch (e) { /*e*/ }');
        window.DYNAMIC_SUPPORT = window.DYNAMIC_SUPPORT || false;
    }

    if (window.DYNAMIC_SUPPORT === true) {
        await run(`window.MODULES["${url}"] = import("${url}");`);
        return window.MODULES[ url ];
    }

    if (window.MODULES[ url ]) {
        // maybe clean up
        return window.MODULES[ url ];
    }

    if (typeof window.REGULAR_SUPPORT !== 'boolean') {
        const script = document.createElement('script');
        window.REGULAR_SUPPORT = 'noModule' in script;
    }

    let code: string;

    if (window.REGULAR_SUPPORT) {
        code = `import * as m from "${url}"; window.MODULES["${url}"] = m;`;
    } else {
        code = await fetch(url);
        code = transform(code, url);
    }

    try {
        await run(code);
    } catch {
        throw new Error(`load - failed to import: ${url}`);
    }

    return window.MODULES[ url ];
};

window.LOAD = window.LOAD || load;
window.MODULES = window.MODULES || {};

export default load;
