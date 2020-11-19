import ChildProcess from 'child_process';
import Config from './packer.config.js';
import { Packer, Watcher, Presser } from './packer.js';

const Spawn = ChildProcess.spawn;

(async function () {

    Config.output = 'web/assets/oxe.js';

    await Packer(Config);

    await Watcher('./src', async () => {
        console.log('pack: start');
        await Packer(Config);
        console.log('pack: end');
    });

    const child = Spawn('muleify', [ '-ss', 'web' ], { detached: false, stdio: 'inherit' });

    await Presser(
        async (key) => {
            switch (key) {
                case 'p':
                    console.log('pack: start');
                    await Packer(Config);
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
        async () => {
            child.kill();
        }
    );

    console.log('');
    console.log('Presser - p: packs');
    console.log('Presser - e: exits');

}()).catch(console.error);
