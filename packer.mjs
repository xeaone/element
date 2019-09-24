import Fs from 'fs';
import Path from 'path';
import Util from 'util';
import Rollup from 'rollup';
import Readline from 'readline';
import Babel from '@babel/core';

let WATCHER_BUSY = false;

export const ReadFile = Util.promisify(Fs.readFile);
export const ReadFolder = Util.promisify(Fs.readdir);
export const WriteFile = Util.promisify(Fs.writeFile);

export const Bundler = async function (option) {

    const bundled = await Rollup.rollup({
        input: option.input
    });

    const generated = await bundled.generate({
        name: option.name,
        indent: option.indent,
        format: option.format,
        treeshake: option.treeshake
    });

    return generated.output[0].code;
};

export const Transformer = async function (option) {

    const transformed = Babel.transform(option.code, {
        sourceMaps: false,
        moduleId: option.name,
        minified: option.minify,
        comments: option.comments,
        plugins: [
            // '@babel/plugin-syntax-dynamic-import',
            [ 'module:fast-async', {
                spec: true
            } ]
        ],
        presets: [
            [ '@babel/preset-env', {
                modules: false,
                targets: { ie: '11' },
                exclude: [
                    'transform-regenerator',
                    'transform-async-to-generator',
                    'proposal-async-generator-functions'
                ]
            } ]
        ]
    });

    return transformed.code;
};

export const Presser = async function (listener, exit) {
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

export const Watcher = async function (data, listener) {
    const paths = await ReadFolder(data);

    for (const path of paths) {
        const item = Path.resolve(Path.join(data, path));

        if (item.includes('.')) {
            Fs.watch(item, function (type, name) {
                if (WATCHER_BUSY) {
                    return;
                } else {
                    WATCHER_BUSY = true;
                    Promise.resolve().then(function () {
                        return listener(type, name);
                    }).then(function () {
                        WATCHER_BUSY = false;
                    }).catch(function (error) {
                        console.error(error);
                        WATCHER_BUSY = false;
                    });
                }
            });
        } else {
            await Watcher(item, listener);
        }

    }

};

export const Argumenter = async function (args) {
    const result = {};

    // need to account for random = signs

    args.forEach(function (arg) {
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

export const Packer = async function (option) {
    option = Object.assign({}, option || {});

    if (!option.input) return console.error('input path required');
    if (!option.output) return console.error('output path required');

    option.indent = option.indent || '\t';
    option.format = option.format || 'umd';

    option.header = option.header === undefined ? null : option.header;
    option.comments = option.comments === undefined ? false : option.comments;
    option.treeshake = option.treeshake === undefined ? true : option.treeshake;

    option.bundle = option.bundle === undefined ? false : option.bundle;
    option.transform = option.transform === undefined ? false : option.transform;

    option.name = option.name || '';
    option.input = Path.resolve(option.inputFolder || '', option.input);
    option.output = Path.resolve(option.outputFolder || '', option.output);

    option.minify = option.minify === undefined ? option.output.includes('.min.') : option.minify;
    // option.name = option.name ? `${option.name[0].toUpperCase()}${option.name.slice(1).toLowerCase()}` : '';

    option.code = null;

    if (option.bundle) {
        option.code = await Bundler(option);
    }

    if (option.transform) {
        option.code = await Transformer(option);
    }

    if (!option.code) {
        option.code = await ReadFile(option.input);
    }

    if (option.header) {
        option.code = `${option.header}${option.code}`;
    }

    await WriteFile(option.output, option.code);

};

(async function () {
    const args = process.argv.slice(2);

    if (args.length === 0) return;

    const opt = await Argumenter(args);

    if (opt.config) {

        const path = Path.resolve(opt.config);
        const extension = Path.extname(path);

        if (extension === '.js' || extension === '.mjs') {
            Object.assign(opt, (await import(path)).default);
        } else {
            return console.error('\nPacker - invalid file extension');
        }

    }

    console.log('\nPacker Started');

    if (Array.isArray(opt.output)) {
        for (let output of opt.output) {
            output = typeof output === 'string' ? { output } : output;
            console.log(`\toutput: ${Path.join(opt.outputFolder || '', output.output)}`);
            await Packer(Object.assign({}, opt, output));
        }
    } else {
        console.log(`\toutput: ${Path.join(opt.outputFolder || '', opt.output)}`);
        await Packer(opt);
    }

    console.log('Packer Ended\n');

}()).catch(console.error);
