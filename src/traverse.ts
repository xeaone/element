
const traverse = function (data: any, path: string, paths?: string[]) {
    paths = paths || path.replace(/\.?\s*\[(.*?)\]/g, '.$1').split('.');

    if (!paths.length) {
        return data;
    } else {
        let part = paths.shift();
        const conditional = part.endsWith('?');
        if (conditional && typeof data !== 'object') return undefined;
        part = conditional ? part.slice(0, -1) : part;
        return traverse(data[ part ], path, paths);
    }
};

export default traverse;