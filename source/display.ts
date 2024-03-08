export const display = function (data: any): string {
    switch (`${data}`) {
        case 'NaN':
            return '';
        case 'null':
            return '';
        case 'undefined':
            return '';
    }

    switch (typeof data) {
        case 'string':
            return data;
        case 'number':
            return `${data}`;
        case 'bigint':
            return `${data}`;
        case 'boolean':
            return `${data}`;
        case 'symbol':
            return String(data);
        case 'object':
            return JSON.stringify(data);
    }

    throw new Error('XElement - display type not handled');
};
