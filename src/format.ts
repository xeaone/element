
const format = (data: any) => data === undefined ? '' : typeof data === 'object' ? JSON.stringify(data) : data;

export default format;