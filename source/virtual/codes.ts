
const code = (data: string) => {
    const result = data.codePointAt(0);
    if (!result) throw new Error('code character required');
    return result;
};

const _0 = code('0');
const _9 = code('9');

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
const lesser = code('<');
const greater = code('>');
const forward = code('/');
const leftSquareBraket = code('[');

export const isBang = (code: number) => code === bang;
export const isDash = (code: number) => code === dash;
export const isEqual = (code: number) => code === equal;
export const isLesser = (code: number) => code === lesser;
export const isGreater = (code: number) => code === greater;
export const isForward = (code: number) => code === forward;
export const isLeftSquareBracket = (code: number) => code === leftSquareBraket;

export const isSpace = (code: number) =>
    code === b ||
    code === t ||
    code === n ||
    code === f ||
    code === r ||
    code === s ||
    false;

export const isName = (code: number) =>
    code === dash ||
    (code >= _0 && code <= _9) ||
    (code >= _A && code <= _Z) ||
    (code >= _a && code <= _z) ||
    false;
