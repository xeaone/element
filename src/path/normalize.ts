
export default function normalize (path:string) {
    return path
        .replace(/\/+/g, '/')
        .replace(/\/$/g, '')
        || '.';
}
