
export const isMap = data => data?.constructor === Map;
export const isDate = data => data?.constructor === Date;
export const isArray = data => data?.constructor === Array;
export const isString = data => data?.constructor === String;
export const isNumber = data => data?.constructor === Number;
export const isObject = data => data?.constructor === Object;
export const isBoolean = data => data?.constructor === Boolean;

export const toString = data => `${data}`;
export const toNumber = data => Number(data);
export const toArray = data => JSON.parse(data);
export const toObject = data => JSON.parse(data);
export const toBoolean = data => data === 'true';
export const toDate = data => new Date(Number(data));
export const toMap = data => new Map(JSON.parse(data));

export const to = function (source, target) {
    try {
        if (isMap(source)) return toMap(target);
        else if (isDate(source)) return toDate(target);
        else if (isArray(source)) return toArray(target);
        else if (isString(source)) return toString(target);
        else if (isObject(source)) return toObject(target);
        else if (isNumber(source)) return toNumber(target);
        else if (isBoolean(source)) return toBoolean(target);
    } catch {
        return target;
    }
};