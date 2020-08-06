
export default function normalize (path) {
    return path
        .replace(/\/+/g, '/')
        .replace(/\/$/g, '')
        || '.';
}
