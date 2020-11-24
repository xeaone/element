import { Watch, Spawn, Execute, Press } from './packer.js';
// import Config from './packer.config.js';

(async function () {

    // Config.output = 'web/assets/oxe.js';

    // await Packer(Config);

    console.log(`
        b: builds
        e: exits
    `);

    const child = await Spawn('muleify -ss web');

    const build = async function () {
        console.log('build: start');
        await Execute('tsc -b tsconfig.json');
        await Execute('rollup -c rollup.json');
        // await Packer(Config);
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
    await Press('e', () => exit());

    // await Presser(
    //     async (key) => {
    //         switch (key) {
    //             case 'b': return build();
    //             case 'e': return exit();
    //         }
    //     },
    //     async () => {
    //         child.kill();
    //     }
    // );

    await build();

}()).catch(console.error);
