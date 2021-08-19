
const seperator = /\s*\??\s*\.?\s*\[\s*|\s*\]\s*\??\s*\.?\s*|\s*\??\s*\.\s*/;

const traverse = function (data: object, path: string | string[]) {
    if (typeof data !== 'object') return undefined;
    const keys = typeof path === 'string' ? path.split(seperator) : path;
    for (const key of keys) {
        if (typeof data !== 'object') return undefined;
        data = data[ key ];
    }
    return data;
};

export default traverse;