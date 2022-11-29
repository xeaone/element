import { Update } from './types.ts';

const tick = Promise.resolve();
const updates: Array<Update> = [];

let patching: number;

const frame = async function () {
    const tasks = [];
    while (updates.length) tasks.push(updates.shift()?.());
    await Promise.all(tasks);
    patching = 0;
};

export default async function Schedule(update: Update) {
    if (updates.includes(update)) return;
    updates.push(update);
    if (patching) return;
    patching = 1;
    await tick.then(frame);
}
