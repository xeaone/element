
export default function Extension (data) {
    const position = data.lastIndexOf('.');
    return position > 0 ? data.slice(position + 1) : '';
}
