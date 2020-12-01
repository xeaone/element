import Fs from 'fs';
import Path from 'path';
import Util from 'util';
import Readline from 'readline';
import ChildProcess from 'child_process';

let WATCHER_BUSY = false;

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
    return s(commands[0], commands.slice(1), { ...options, detached: false, stdio: [ 'ignore', 'inherit', 'inherit' ] });
};

export const Press = async function (key, listener) {
    Readline.emitKeypressEvents(process.stdin);
    process.stdin.setRawMode(true);
    process.stdin.on('keypress', async (name) => {
        if (name === key) {
            await listener();
        }
    });
};

export const Watch = async function (data, listener) {
    const paths = await ReadFolder(data);

    for (const path of paths) {
        const item = Path.resolve(Path.join(data, path));

        if (item.includes('.')) {
            Fs.watch(item, (type, name) => {
                if (WATCHER_BUSY) {
                    return;
                } else {
                    WATCHER_BUSY = true;
                    Promise.resolve()
                        .then(() => listener(type, name))
                        .then(() => WATCHER_BUSY = false)
                        .catch(console.error)
                        .then(() => WATCHER_BUSY = false);
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
                (value[0] === '[' && value[value.length-1] === ']') ||
                (value[0] === '{' && value[value.length-1] === '}')
            ) {
                value = JSON.parse(value);
            } else if (value.includes(',')) {
                value = value.split(',');
            } else if (value === 'true') {
                value = true;
            } else if (value === 'false') {
                value = false;
            }

            result[name] = value;
        }
    });

    return result;
};
