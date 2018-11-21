
const Cp = require('child_process');
const Mp = Cp.execSync('npm root -g').toString().trim();
const Muleify = require(`${Mp}/muleify`);

const Package = require('./package');
const Util = require('util');
const Fs = require('fs');

const ReadFile = Util.promisify(Fs.readFile);
const WriteFile = Util.promisify(Fs.writeFile);

const header = `/*
	Name: ${Package.name}
	Version: ${Package.version}
	License: ${Package.license}
	Author: ${Package.author}
	Email: ${Package.email}
	This Source Code Form is subject to the terms of the Mozilla Public
	License, v. 2.0. If a copy of the MPL was not distributed with this
	file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/
`;

const prepend = async function (data, path) {
	const fileData = await ReadFile(path, 'utf8');
	await WriteFile(path, data + fileData, 'utf8');
}

(async function () {

	const options = { bundle: true, transpile: true };

	// options.name = 'Oxe';
	// options.input = Path.resolve('src/index.js');
	// options.output = Path.resolve('web/assets/oxe.js');
	// await Bundle(options);

	await Muleify.pack('src/index.js', 'web/assets/oxe.js', options);
	await prepend(header, 'web/assets/oxe.js');

	await Muleify.pack('src/index.js', 'dst/oxe.js', options);
	await prepend(header, 'dst/oxe.js');

	options.minify = true;

	await Muleify.pack('src/index.js', 'dst/oxe.min.js', options);
	await prepend(header, 'dst/oxe.min.js');

}()).catch(function (error) {
	console.error(error);
});
