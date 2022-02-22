
const format = (data) => data === undefined ? '' : typeof data === 'object' ? JSON.stringify(data) : data;

export default format;