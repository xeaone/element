import hljs from 'https://unpkg.com/@highlightjs/cdn-assets@11.4.0/es/highlight.min.js';
import js from 'https://unpkg.com/@highlightjs/cdn-assets@11.4.0/es/languages/javascript.min.js';
import xml from 'https://unpkg.com/@highlightjs/cdn-assets@11.4.0/es/languages/xml.min.js';

hljs.registerLanguage('js', js);
hljs.registerLanguage('xml', xml);

const link = document.createElement('link');
link.rel = 'stylesheet';
link.href = '/theme.css';
// link.href = '//unpkg.com/@highlightjs/cdn-assets@11.4.0/styles/base16/material-vivid.min.css';
// link.href = '//unpkg.com/@highlightjs/cdn-assets@11.4.0/styles/base16/tomorrow-night.min.css';
document.head.append(link);

export default function (data, type) {
    if (data) {
        return hljs.highlight(data, { language: type ?? 'html' }).value;
    } else {
        hljs.highlightAll();
        // requestAnimationFrame(() => hljs.highlightAll());
    }
}
