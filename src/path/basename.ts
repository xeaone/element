import normalize from './normalize';

export default function basename (path:string, extention?:string) {
    path = normalize(path);

    if (path.slice(0, 1) === '.') {
        path = path.slice(1);
    }

    if (path.slice(0, 1) === '/') {
        path = path.slice(1);
    }

    const last = path.lastIndexOf('/');
    if (last !== -1) {
        path = path.slice(last+1);
    }

    if (extention && path.slice(-extention.length) === extention) {
        path = path.slice(0, -extention.length);
    }

    return path;
}
