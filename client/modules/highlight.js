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

/**
 *
 * @param {String | Node} code
 * @param {string | undefined} language
 * @returns {DocumentFragment}
 */
export default function highlight(code, language) {

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

    template.innerHTML = code;

    return template.content;
}
