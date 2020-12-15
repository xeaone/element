
export const isMap = (data:any) => data?.constructor === Map;
export const isDate = (data:any) => data?.constructor === Date;
export const isArray = (data:any) => data?.constructor === Array;
export const isString = (data:any) => data?.constructor === String;
export const isNumber = (data:any) => data?.constructor === Number;
export const isObject = (data:any) => data?.constructor === Object;
export const isBoolean = (data:any) => data?.constructor === Boolean;

export const toArray = (data:any) => JSON.parse(data);
export const toObject = (data:any) => JSON.parse(data);
export const toBoolean = (data:any) => data === 'true';
export const toDate = (data:any) => new Date(Number(data));
export const toMap = (data:any) => new Map(JSON.parse(data));
export const toString = (data:any) => typeof data === 'string' ? data : JSON.stringify(data);
export const toNumber = (data:any) => data === '' || typeof data !== 'string' && typeof data !== 'number' ? NaN : Number(data);

export const to = function (source:any, target:any) {
    try {
        if (isMap(source)) return toMap(target);
        if (isDate(source)) return toDate(target);
        if (isArray(source)) return toArray(target);
        if (isString(source)) return toString(target);
        if (isObject(source)) return toObject(target);
        if (isNumber(source)) return toNumber(target);
        if (isBoolean(source)) return toBoolean(target);
    } catch {
        return target;
    }
};