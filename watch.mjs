import Fs from 'fs';
import Util from 'util';
import Path from 'path';
import Readline from 'readline';
import ChildProcess from 'child_process';

const Spawn = ChildProcess.spawn;
const Exec = Util.promisify(ChildProcess.exec);
const ReadFolder = Util.promisify(Fs.readdir);

const Executor = async function (command) {
    const { stdout, stderr, error } = await Exec(command);
    if (error) console.error(error);
    if (stdout) console.log(stdout);
    if (stderr) console.warn(stderr);
};

const Presser = async function (listener, exit) {
    Readline.emitKeypressEvents(process.stdin);

    process.stdin.setRawMode(true);

    process.stdin.on('keypress', function (key, data) {
        if (data.ctrl && data.name === 'c') {
            Promise.resolve().then(function () {
                if (typeof exit === 'function') {
                    return exit();
                }
            }).then(function () {
                process.exit();
            }).catch(console.error);
        } else {
            Promise.resolve().then(function () {
                if (typeof listener === 'function') {
                    return listener(key);
                }
            }).catch(console.error);
        }
    });
};

let Busy = false;
const Watcher = async function (data, listener) {
    const paths = await ReadFolder(data);

    for (const path of paths) {
        const item = Path.resolve(Path.join(data, path));

        if (item.includes('.')) {
            Fs.watch(item, function (type, name) {
                if (Busy) {
                    return;
                } else {
                    Busy = true;
                    Promise.resolve().then(function () {
                        return listener(type, name);
                    }).then(function () {
                        Busy = false;
                    }).catch(function (error) {
                        console.error(error);
                        Busy = false;
                    });
                }
            });
        } else {
            await Watcher(item, listener);
        }

    }

};

(async function () {

    const build = 'node --experimental-modules build.mjs src/index.js web/assets/oxe.js oxe';

    await Executor(build);

    await Watcher('./src', async function () {
        await Executor(build);
    });

    const child = Spawn('muleify', [ '-ss', 'web' ], { detached: false, stdio: 'inherit' });

    await Presser(
        async function (key) {
            switch (key) {
            case 'c':
                await Executor(build);
                break;
            case 'e':
                child.kill();
                process.exit();
                break;
            }
        },
        async function () {
            child.kill();
        }
    );

}()).catch(console.error);
