
export default function resolve (...paths:string[]) {
    let path = (paths[0] || '').trim();

    for (let i = 1; i < paths.length; i++) {
        const part = paths[i].trim();

        if (path[path.length-1] !== '/' && part[0] !== '/') {
            path += '/';
        }

        path += part;
    }

    const a = window.document.createElement('a');
    
    a.href = path;

    return a.href;
}
