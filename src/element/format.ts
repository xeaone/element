
export default function format (data: any) {
    return data === undefined ? '' : typeof data === 'object' ? JSON.stringify(data) : data;
};