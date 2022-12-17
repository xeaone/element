const escapes = new Map([
    ['<', '&lt;'],
    ['>', '&gt;'],
    ['"', '&quot;'],
    ['\'', '&apos;'],
    ['&', '&amp;'],
    ['\r', '&#10;'],
    ['\n', '&#13;'],
]);

const escape = function (data: string) {
    return data?.replace(/[<>"'\r\n&]/g, (c) => escapes.get(c) ?? c) ?? '';
};

export default function display(data: any): string {
    switch (typeof data) {
        case 'undefined':
            return '';
        case 'string':
            return escape(data);
        case 'number':
            return `${data}`;
        case 'bigint':
            return `${data}`;
        case 'boolean':
            return `${data}`;
        case 'function':
            return `${data()}`;
        case 'symbol':
            return String(data);
        case 'object':
            return JSON.stringify(data);
        default:
            throw new Error('display - type not handled');
    }
}
