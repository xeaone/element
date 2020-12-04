
export default function Traverse (data:object, path:string, end?:number) {
    const keys = typeof path === 'string' ? path.split('.') : path;
    const length = keys.length - (end || 0);
    let result = data;

    for (let index = 0; index < length; index++) {
        result = result[ keys[ index ] ];
    }

    return result;
}