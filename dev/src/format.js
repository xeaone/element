
const format = function (data) {
    return data === undefined ? '' : typeof data === 'object' ? JSON.stringify(data) : data;
};

export default format;