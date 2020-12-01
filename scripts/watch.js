import { Watch, Spawn, Execute, Press } from './packer.js';

console.log(`
    b: builds
    e: exits
`);

const build = async function () {
    console.log('build: start');
    await Execute('rollup -c rollup.watch.js');
    console.log('build: end');
};

const exit = async function () {
    console.log('exit: start');
    child.kill();
    console.log('exit: end');
    process.exit();
};

await Watch('./src', () => build());
await Press('b', () => build());
await Press('c', () => exit());
await Press('e', () => exit());
await build();

const child = await Spawn('muleify -ss web');
