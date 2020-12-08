
// export default function Traverse (data:object, path:string, end?:number) {
//     const keys = typeof path === 'string' ? path.split('.') : path;
//     const length = keys.length - (end || 0);
//     let result = data instanceof Array ? [] : {};

//     for (let index = 0; index < length; index++) {
//         const key = keys[index];
//         if (!(key in result)) return undefined;
//         result = result[key];
//     }

//     return result;
// }


export default function Traverse (data:any, paths:string[]) {
    if (paths.length === 0) {
        return data;
    } else if (typeof data !== 'object') {
        return undefined;
    } else {
        return Traverse(data[paths[0]], paths.slice(1));
    }
}
