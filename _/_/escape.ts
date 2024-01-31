const escapes = new Map([
    ['<', '&lt;'],
    ['>', '&gt;'],
    ['&', '&amp;'],
    ['"', '&quot;'],
    ['/', '&#x2F;'],
    ['\r', '&#10;'],
    ['\n', '&#13;'],
    ['\'', '&#x27;'],
]);

export default function escape(data: string) {
    return data?.replace(/[<>&"/\r\n']/g, (c) => escapes.get(c) ?? c) ?? '';
}
