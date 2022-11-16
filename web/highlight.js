import hljs from './highlight/core.min.js';
import xml from './highlight/languages/xml.min.js';
import js from './highlight/languages/javascript.min.js';

hljs.registerLanguage('js', js);
hljs.registerLanguage('xml', xml);

const link = document.createElement('link');
link.rel = 'stylesheet';
link.href = './theme.css';

document.head.append(link);

export default function (data, type) {
    data = data.replace(/\s*\n+$/, '');
    data = data.replace(/^\s*\n+/, '');
    return hljs.highlight(data, { language: type ?? 'js' }).value;
    // if (typeof data === 'string') {
    //     return hljs.highlight(data, { language: type ?? 'html' }).value;
    // } else if (data instanceof HTMLElement) {
    //     return hljs.highlightElement(data);
    // } else {
    //     return hljs.highlightAll();
    // }
}
