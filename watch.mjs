import ChildProcess from 'child_process';
import { Packer, Watcher, Presser } from './packer.mjs';

const Spawn = ChildProcess.spawn;

(async function () {

    const packOptions = { bundle: true, transform: true, name: 'Oxe', input: 'src/index.js', output: 'web/assets/oxe.js' };

    await Packer(packOptions);

    await Watcher('./src', async function () {
        console.log('pack: start');
        await Packer(packOptions);
        console.log('pack: end');
    });

    const child = Spawn('muleify', [ '-ss', 'web' ], { detached: false, stdio: 'inherit' });

    await Presser(
        async function (key) {
            switch (key) {
            case 'p':
                console.log('pack: start');
                await Packer(packOptions);
                console.log('pack: end');
                break;
            case 'e':
                console.log('exit: start');
                child.kill();
                console.log('exit: end');
                process.exit();
                break;
            }
        },
        async function () {
            child.kill();
        }
    );

    console.log('');
    console.log('Presser - p: packs');
    console.log('Presser - e: exits');

}()).catch(console.error);
