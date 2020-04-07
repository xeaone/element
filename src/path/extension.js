
export default function extension (data) {
    const position = data.lastIndexOf('.');
    return position > 0 ? data.slice(position + 1) : '';
}
