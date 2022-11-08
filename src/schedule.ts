import { Update } from './types.ts';

const updates: Array<Update> = [];

let patching: number;
let request: number;

const frame = function () {
    patching = 1;
    while (updates.length) updates.shift()?.();
    patching = 0;
    request = 0;
};

export default function Schedule(update: Update) {
    updates.push(update);
    if (patching) return;
    cancelAnimationFrame(request);
    request = requestAnimationFrame(frame);
    // clearTimeout(request);
    // request = setTimeout(frame, 100);
}
