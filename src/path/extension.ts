
export default function extension (path:string) {
    const position = path.lastIndexOf('.');
    return position > 0 ? path.slice(position + 1) : '';
}
