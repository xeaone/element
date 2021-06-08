import Fs from 'fs';
import Path from 'path';
import Util from 'util';
import Readline from 'readline';
import ChildProcess from 'child_process';

let WATCHER_BUSY = false;
let LISTENER_BUSY = false;

Readline.emitKeypressEvents(process.stdin);

// process.stdin.setRawMode(true);
// process.stdin.on('keypress', (_, data) => {
//     if (data.ctrl && data.name === 'c') {
//         process.exit();
//     }
// });

export const s = ChildProcess.spawn;
export const e = Util.promisify(ChildProcess.exec);
export const ReadFile = Util.promisify(Fs.readFile);
export const ReadFolder = Util.promisify(Fs.readdir);
export const WriteFile = Util.promisify(Fs.writeFile);

export const Execute = async function (command, options) {
    return e(command, options);
};

export const Spawn = async function (command, options = {}) {
    const commands = command.split(/\s+/);
    return s(commands[ 0 ], commands.slice(1), { ...options, detached: false, stdio: [ 'ignore', 'inherit', 'inherit' ] });
};

export const Press = async function (key, listener) {
    Readline.emitKeypressEvents(process.stdin);
    process.stdin.setRawMode(true);
    process.stdin.on('keypress', async (name) => {
        if (name === key) {
            if (!LISTENER_BUSY) {
                LISTENER_BUSY = true;
                await listener();
                LISTENER_BUSY = false;
            }
        }
    });
};

export const Watch = async function (data, listener) {
    const paths = await ReadFolder(data);

    for (const path of paths) {
        const item = Path.resolve(Path.join(data, path));

        if (item.includes('.')) {
            Fs.watch(item, async (type, name) => {
                if (WATCHER_BUSY) {
                    return;
                } else {
                    try {
                        WATCHER_BUSY = true;
                        if (!LISTENER_BUSY) {
                            LISTENER_BUSY = true;
                            await listener(type, name);
                            LISTENER_BUSY = false;
                        }
                        WATCHER_BUSY = false;
                    } catch (error) {
                        LISTENER_BUSY = false;
                        WATCHER_BUSY = false;
                        console.error(error);
                    }
                }
            });
        } else {
            await Watch(item, listener);
        }

    }

};

export const Argument = async function (args) {
    const result = {};

    // need to account for random = signs

    args.forEach(arg => {
        if (arg.includes('=')) {
            let [ name, value ] = arg.split('=');

            if (
                (value[ 0 ] === '[' && value[ value.length - 1 ] === ']') ||
                (value[ 0 ] === '{' && value[ value.length - 1 ] === '}')
            ) {
                value = JSON.parse(value);
            } else if (value.includes(',')) {
                value = value.split(',');
            } else if (value === 'true') {
                value = true;
            } else if (value === 'false') {
                value = false;
            }

            result[ name ] = value;
        }
    });

    return result;
};
