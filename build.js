const Package = require('./package');
const Muleify = require('muleify');
const Util = require('util');
const Fs = require('fs');

const ReadFile = Util.promisify(Fs.readFile);
const WriteFile = Util.promisify(Fs.writeFile);

const header = `/*
	Name: Oxe
	Version: ${Package.version}
	License: MPL-2.0
	Author: Alexander Elias
	Email: alex.steven.elias@gmail.com
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

	let options;

	options = { bundle: true };

	await Muleify.pack('src/index.js', 'web/assets/oxe.js', options);
	await prepend(header, 'web/assets/oxe.js');

	await Muleify.pack('src/index.js', 'dist/oxe.js', options);
	await prepend(header, 'dist/oxe.js');

	options.minify = true ;

	await Muleify.pack('src/index.js', 'dist/oxe.min.js', options);
	await prepend(header, 'dist/oxe.min.js');

}()).catch(function (error) {
	console.error(error);
});
