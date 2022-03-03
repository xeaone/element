
export default function format (data) {
    return data === undefined ? '' : typeof data === 'object' ? JSON.stringify(data) : data;
};