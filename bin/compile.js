
const Path = require('path');
const Util = require('util');
const Fs = require('fs');

const ReadFile = Util.promisify(Fs.readFile);
const WriteFile = Util.promisify(Fs.writeFile);

module.exports = async function Compile (value) {
	const values = value.split(' ');
	const input = Path.resolve(values[0]);
	const output = Path.resolve(values[1]);

	if (!Fs.existsSync(input)) {
		// throw new Error('Input folder does not exists');
		throw new Error('Input file does not exists');
	}

	let data = await ReadFile(input, 'utf8');
	await WriteFile(output, 'utf8', data);


}
