
const code = (data: string) => {
    const result = data.codePointAt(0);
    if (!result) throw new Error('code character required');
    return result;
};

// const _0 = code('0');
// const _9 = code('9');

const _A = code('A');
const _Z = code('Z');

const _a = code('a');
const _z = code('z');

const b = code('\b');
const t = code('\t');
const n = code('\n');
const f = code('\f');
const r = code('\r');
const s = code(' ');

// console.log(s, code('\s'), code('\n'), code(`
// `));

const bang = code('!');
const dash = code('-');
const equal = code('=');
const less = code('<');
const great = code('>');
const forward = code('/');

const curlOpen = code('{');
const curlClose = code('}');

const squareOpen = code('[');
const squareClose = code(']');

export const isBang = (code: number) => code === bang;
export const isDash = (code: number) => code === dash;
export const isEqual = (code: number) => code === equal;
export const isLess = (code: number) => code === less;
export const isGreat = (code: number) => code === great;
export const isForward = (code: number) => code === forward;

export const isCurlOpen = (code: number) => code === curlOpen;
export const isCurlClose = (code: number) => code === curlClose;

export const isSquareOpen = (code: number) => code === squareOpen;
export const isSquareClose = (code: number) => code === squareClose;

export const isAlphabet = (code: number) =>
    (code >= _A && code <= _Z) ||
    (code >= _a && code <= _z) ||
    false;

export const isSpace = (code: number) =>
    code === b ||
    code === t ||
    code === n ||
    code === f ||
    code === r ||
    code === s ||
    false;
