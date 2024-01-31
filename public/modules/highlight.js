import hljs from 'https://cdn.jsdelivr.net/gh/highlightjs/cdn-release@11.9.0/build/es/highlight.min.js';
import xml from 'https://cdn.jsdelivr.net/gh/highlightjs/cdn-release@11.9.0/build/es/languages/xml.min.js';
import js from 'https://cdn.jsdelivr.net/gh/highlightjs/cdn-release@11.9.0/build/es/languages/javascript.min.js';

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

export default function (code) {

    if (code instanceof DocumentFragment) {
        code = [].map.call(
            code.childNodes,
            (nodes) => (nodes.outerHTML || nodes.textContent)
        ).join('');
    } else if (code instanceof Node) {
        code = code.innerHTML;
    } else if (typeof code === 'function') {
        code = [].map.call(
            code().childNodes,
            (nodes) => nodes.outerHTML || nodes.textContent
        ).join('');
    }

    // code = code.replace(/\s*\n+$/g, '');
    // code = code.replace(/^\s*\n+/g, '');

    // code = hljs.highlight(code, { language: 'html' }).value;
    // code = hljs.highlight(code, { language: 'js' }).value;
    code = hljs.highlightAuto(code).value;

    const template = document.createElement('template');

    template.innerHTML = code;

    return template.content;
}
