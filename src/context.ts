import { tick } from './tool.ts';

type ContextKeys = string | symbol;
// type ContextHandlers = 'render' | 'reset';

// const diff = function (from: any, to: any, resets?: string[], renders?: string[], reference?: string) {
//     resets = resets ?? [];
//     renders = renders ?? [];
//     reference = reference ?? '';

//     if (from && typeof from === 'object') {
//         for (const key in from) {
//             if (to === null || to === undefined) {
//                 resets.push(reference ? `${reference}.${key}` : key);
//                 if (from[key] && typeof from[key] === 'object') {
//                     diff(from[key], to, resets, renders, reference ? `${reference}.${key}` : key);
//                 }
//             } else if (to && typeof to === 'object') {
//                 if (key in to) {
//                     if (from[key] === to[key]) {
//                         renders.push(reference ? `${reference}.${key}` : key);
//                         diff(from[key], to[key], resets, renders, reference ? `${reference}.${key}` : key);
//                     } else {
//                     }
//                 } else {
//                 }
//                 if (from[key] !== to[key]) {
//                 }
//             }
//         }
//     }

// };

export const ContextGet = function (event: any, reference: string, target: any, key: ContextKeys, receiver: any): any {
    if (typeof key === 'symbol') return Reflect.get(target, key, receiver);

    const value = Reflect.get(target, key, receiver);

    if (value && typeof value === 'object') {
        reference = reference ? `${reference}.${key}` : `${key}`;
        return new Proxy(value, {
            get: ContextGet.bind(null, event, reference),
            set: ContextSet.bind(null, event, reference),
            deleteProperty: ContextDelete.bind(null, event, reference),
        });
    }

    return value;
};

export const ContextDelete = function (event: any, reference: string, target: any, key: ContextKeys) {
    if (typeof key === 'symbol') return Reflect.deleteProperty(target, key);

    Reflect.deleteProperty(target, key);

    tick(async function contextTick() {
        await event(reference ? `${reference}.${key}` : `${key}`, 'reset');
    });

    return true;
};

export const ContextSet = function (event: any, reference: string, target: any, key: ContextKeys, to: any, receiver: any) {
    if (typeof key === 'symbol') return Reflect.set(target, key, to, receiver);

    if (key === 'length') {
        Reflect.set(target, key, to, receiver);

        tick(async function contextTick() {
            await event(reference, 'render');
        });

        tick(async function contextTick() {
            await event(reference ? `${reference}.${key}` : `${key}`, 'render');
        });

        return true;
    }

    const from = Reflect.get(target, key, receiver);

    if (from === to) return true;
    if (Number.isNaN(from) && Number.isNaN(to)) return true;

    Reflect.set(target, key, to, receiver);

    tick(async function contextTick() {
        await event(reference ? `${reference}.${key}` : `${key}`, 'render');
    });

    return true;
};
