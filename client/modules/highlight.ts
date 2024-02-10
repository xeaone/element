import js from 'https://cdn.jsdelivr.net/gh/highlightjs/cdn-release@11.9.0/build/es/languages/javascript.min.js';
import xml from 'https://cdn.jsdelivr.net/gh/highlightjs/cdn-release@11.9.0/build/es/languages/xml.min.js';
import hljs from 'https://cdn.jsdelivr.net/gh/highlightjs/cdn-release@11.9.0/build/es/highlight.min.js';

hljs.registerLanguage('js', function () {
    return js(...arguments);
});

hljs.registerLanguage('html', function () {
    return xml(...arguments);
});

const link = document.createElement('link');
link.rel = 'stylesheet';
link.href = './theme.css';
// link.href = 'https://cdn.jsdelivr.net/gh/highlightjs/cdn-release@11.9.0/build/styles/atom-one-dark.min.css';
document.head.append(link);

export default function highlight(
    code: DocumentFragment | Element | Text | (() => DocumentFragment) | string,
    language?: string,
): DocumentFragment {
    if (code instanceof DocumentFragment) {
        code = [].map.call(
            code.childNodes,
            (node) => ((node as Element).outerHTML || (node as Text).textContent || ''),
        ).join('');
    } else if (code instanceof Element) {
        code = code.innerHTML;
    } else if (code instanceof Text) {
        code = code.textContent ?? '';
    } else if (typeof code === 'function') {
        code = [].map.call(
            code().childNodes,
            (node) => ((node as Element).outerHTML || (node as Text).textContent || ''),
        ).join('');
    }

    code = code.replace(/^\n+/, '');
    // code = code.replace(/\s*\n+$/g, '');
    // code = code.replace(/^\s*\n+/g, '');

    if (language) {
        code = hljs.highlight(code, { language }).value;
    } else {
        code = hljs.highlight(code, { language: 'html' }).value;
        // code = hljs.highlightAuto(code).value;
    }

    const template = document.createElement('template');

    template.innerHTML = code as string;

    return template.content;
}
