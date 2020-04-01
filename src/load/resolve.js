
export default function resolve (url) {
    url = url.trim();

    for (let i = 1; i < arguments.length; i++) {
        const part = arguments[i].trim();
        if (url[url.length-1] !== '/' && part[0] !== '/') {
            url += '/';
        }
        url += part;
    }

    const a = window.document.createElement('a');
    a.href = url;

    return a.href;
}
