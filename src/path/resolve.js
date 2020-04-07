
export default function resolve (path) {
    path = path.trim();

    for (let i = 1; i < arguments.length; i++) {
        const part = arguments[i].trim();

        if (path[path.length-1] !== '/' && part[0] !== '/') {
            path += '/';
        }

        path += part;
    }

    const a = window.document.createElement('a');
    
    a.href = path;

    return a.href;
}
