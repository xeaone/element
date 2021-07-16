
// const traverse = function (data: any, path: string, paths?: string[]) {
//     paths = paths || path.replace(/\.?\s*\[(.*?)\]/g, '.$1').split('.');

//     if (!paths.length) {
//         return data;
//     } else {
//         let part = paths.shift();
//         const conditional = part.endsWith('?');
//         if (conditional && typeof data !== 'object') return undefined;
//         part = conditional ? part.slice(0, -1) : part;
//         return traverse(data[ part ], path, paths);
//     }
// };

const traverse = function (data: any, path: string | string[]) {
    const parts = typeof path === 'string' ? path.split('.') : path;
    const part = parts.shift();
    if (!part) {
        return data;
    } else {
        return typeof data === 'object' ? traverse(data[ part ], parts) : undefined;
    }
};

export default traverse;