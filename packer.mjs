import Fs from 'fs';
import Path from 'path';
import Util from 'util';
import Rollup from 'rollup';
import Babel from '@babel/core';

export const ReadFile = Util.promisify(Fs.readFile);
export const WriteFile = Util.promisify(Fs.writeFile);

export const bundler = async function (option) {

    const bundled = await Rollup.rollup({
        input: option.input
    });

    const generated = await bundled.generate({
        treeshake: true,
        name: option.name,
        indent: option.indent,
        format: option.format
    });

    return generated.output[0].code;
};

export const transformer = async function (option) {

    const result = Babel.transform(code, {
        sourceMaps: false,
        minified: option.minify,
        moduleId: option.name,
        comments,
        plugins: [
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

    return result.code;
};

// export const header = async function (option) {
//     const path = Path.resolve(option.header);
//     const extension = Path.extname(option.header);
//
//     if (extension === '.js' || extension === '.mjs') {
//         return await import(path).default();
//         // const module = await import(path);
//         // const data = module.default();
//     } else {
//         return await ReadFile(path);
//     }
//
// };

export const options = async function (args) {
    const result = {};

    args.forEach(function (arg) {
        if (arg.includes('=')) {
            const [ name, value ] = arg.split('=');
            result[name] = value;
        }
    });

    return result;
};

export const main = async function (option) {
    option = option || {};

    if (!option.input) return console.error('input path required');
    if (!option.output) return console.error('output path required');

    option.header = option.header || null;
    option.indent = option.indent || '\t';
    option.format = option.format || 'umd';
    option.minify = option.minify || false;
    option.comments = option.comments || false;

    option.bundle = option.bundle || false;
    option.transform = option.transform || false;

    option.input = Path.resolve(option.input);
    option.output = Path.resolve(option.output);
    option.name = option.name ? `${option.name[0].toUpperCase()}${option.name.slice(1).toLowerCase()}` : '';

    let code;

    if (option.bundle) {
        code = await bundler(option);
    }

    if (option.transform) {
        code = await transformer(option);
    }

    if (!code) {
        code = await ReadFile(option.input);
    }

    if (option.header) {
        // const result = await header(option);
        code = `${result}${code}`;
    }

    await WriteFile(option.output, code);

};

if (process.argv.length > 2) {
    (async function () {

        const args = process.argv.slice(2);

        let opt;

        if (args.length === 0) {
            return console.error('Packer - arguments required');
        } else if (args.length === 1) {

            const path = Path.resolve(args[0]);
            const extension = Path.extname(path);

            if (extension === '.js' || extension === '.mjs') {
                // const module = await import(path);
                // opt = module.default();
                opt = await import(path).default();
            } else if (extension === '.json') {
                // const file = await ReadFile(path);
                // opt = JSON.parse(file);
                opt = JSON.parse(await ReadFile(path));
            } else {
                return console.error('Packer - invalid file extension');
            }

            opt = Object.assign(opt, await options(args));
        } else {
            opt = await options(args);
        }

        if (Array.isArray(opt.output)) {
            for (const output of opt.output) {
                await main(Object.assign({}, opt, output));
            }
        } else {
            await main(opt);
        }

    }()).catch(console.error);

    // const args = [];
    // const opt = {};

    // process.argv.slice(2).forEach(function (arg) {
    //     if (arg[0] === '-') {
    //         arg.slice(1).split().forEach(function (name) {
    //             opt[name] = true;
    //         });
    //         // opt.push.apply(opt, arg.slice(1).split());
    //     } else if (arg.includes('=')) {
    //         const [ name, value ] = arg.split('=');
    //         opt[name] = value;
    //     } else {
    //         args.push(arg);
    //     }
    // });

    // args.push(opt);

    // main.apply(null, args).catch(console.error);
}
