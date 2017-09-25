const Package = require('./package');
const Muleify = require('muleify');
const Fs = require('fs');

const version = Package.version;

const header = `/*
	Name: Oxe
	Version: ${version}
	License: MPL-2.0
	Author: Alexander Elias
	Email: alex.steven.elias@gmail.com
	This Source Code Form is subject to the terms of the Mozilla Public
	License, v. 2.0. If a copy of the MPL was not distributed with this
	file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/
`

function prepend (data, path) {
	return new Promise(function(resolve, reject) {
		Fs.readFile(path, 'utf8', function (error, fileData) {
			if (error) {
				reject(error);
			} else {
				Fs.writeFile(path, data + fileData, 'utf8', function (error) {
					if (error) {
						reject(error);
					} else {
						resolve();
					}
				});
			}
		});
	});
}

Promise.resolve().then(function () {
	var options = { bundle: true };
	return Muleify.pack('src/index.js', 'dist/oxe.js', options);
}).then(function () {
	return prepend(header, 'dist/oxe.js');
}).then(function () {
	var options = { bundle: true, minify: true };
	return Muleify.pack('src/index.js', 'dist/oxe.min.js', options);
}).then(function () {
	return prepend(header, 'dist/oxe.min.js');
}).then(function () {
	var options = { bundle: true, minify: true };
	return Muleify.pack('src/index.js', 'dist/oxe.polly.min.js', options);
}).then(function () {
	return prepend(header, 'dist/oxe.polly.min.js');
}).then(function () {
	return new Promise(function(resolve, reject) {
		Fs.readFile('dist/webcomponents-lite.min.js', 'utf8', function (error, data) {
			if (error) {
				reject(error);
			} else {
				resolve(data);
			}
		});
	});
}).then(function (data) {
	return prepend(data, 'dist/oxe.polly.min.js');
}).catch(function (error) {
	console.log(error);
});
