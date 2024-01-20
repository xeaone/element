import hljs from 'https://cdn.jsdelivr.net/gh/highlightjs/cdn-release@11.9.0/build/es/highlight.min.js';
import xml from 'https://cdn.jsdelivr.net/gh/highlightjs/cdn-release@11.9.0/build/es/languages/xml.min.js';
import js from 'https://cdn.jsdelivr.net/gh/highlightjs/cdn-release@11.9.0/build/es/languages/javascript.min.js';

hljs.registerLanguage('js', js);
hljs.registerLanguage('xml', xml);

const link = document.createElement('link');
link.rel = 'stylesheet';
link.href = './theme.css';
// link.href = 'https://cdn.jsdelivr.net/gh/highlightjs/cdn-release@11.6.0/build/styles/atom-one-dark.min.css';
document.head.append(link);

export function element (e) {
    hljs.highlightElement(e);
};

export default function (code, language) {
    language = language ?? 'js';

    if (code instanceof Node) {
        code = [].map.call(code.childNodes, n => n.outerHTML).join('');
    }

    code = code.replace(/\s*\n+$/, '');
    code = code.replace(/^\s*\n+/, '');

    code = hljs.highlight(code, { language }).value;

    // code = code.replaceAll('&#x27;', '\'');
    // code = code.replaceAll('&lt;', '<');
    // code = code.replaceAll('&gt;', '>');

    // return code;
    const template = document.createElement('template');
    template.innerHTML = code;
    return template.content;
};
