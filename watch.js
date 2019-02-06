
const Rollup = require('rollup');
const Babel = require('@babel/core');

const Fs = require('fs');
const Util = require('util');
const Path = require('path');
const Readline = require('readline');

const ReadFolder = Util.promisify(Fs.readdir);
const WriteFile = Util.promisify(Fs.writeFile);

let Busy = false;

const Keypresser = async function (listener) {
	Readline.emitKeypressEvents(process.stdin);

	process.stdin.setRawMode(true);

	process.stdin.on('keypress', async function (key, data) {
		if (data.ctrl && data.name === 'c') {
			process.exit();
		} else {
			Promise.resolve(listener(key)).catch(console.error);
		}
	});
};

const Watcher = async function (data, listener) {
	const paths = await ReadFolder(data);

	for (const path of paths) {
		const item = Path.resolve(Path.join(data, path));

		if (item.includes('.')) {
			Fs.watch(item, function (type, name) {
				Promise.resolve(listener(type, name)).catch(console.error);
			});
		} else {
			await Watcher(item, listener);
		}

	}

};

const compile = async function () {
	if (Busy) return;
	else Busy = true;

	console.log('\nWatch Compile Start\n');

	const bundled = await Rollup.rollup({ input: 'src/index.js' });

	const generated = await bundled.generate({
		name: 'Oxe',
		indent: '\t',
		// format: 'esm',
		format: 'umd',
		treeshake: true
	});

	const code = generated.output[0].code;

	const options = {
		moduleId: 'Oxe',
		comments: false,
		sourceMaps: false,
		plugins: [
			['module:fast-async', {
				spec: true
			}]
        ],
		presets: [
			['@babel/preset-env', {
				modules: false,
				// useBuiltIns: 'usage',
				targets: { ie: '11' },
				exclude: [
					'transform-regenerator',
					'transform-async-to-generator',
					'proposal-async-generator-functions',
				]
			}]
		]
	};

	const dev = Babel.transform(code, options);

	await WriteFile('web/assets/oxe.js', dev.code);

	console.log('\nWatch Compile End\n');

	Busy = false;
};

(async function () {

	await compile();

	await Keypresser(async function (key) {
		if (key === 'c') {
			await compile();
		}
	});

	await Watcher('./src', compile);

}()).catch(console.error);
