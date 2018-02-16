'use strict';

const Fsep = require('fsep');
const Path = require('path');

const Global = require('./global');
const Bundle = require('./lib/bundle');

module.exports = async function (data) {

	const inputPath = data.input;
	const outputPath = data.output;
	const minify = data.minify || false;
	const comments = data.comments || false;

	const inputIndexJsPath = Path.normalize(inputPath);
	const inputIndexJsFile = await Fsep.readFile(inputIndexJsPath, Global.encoding);
	const cleanInputIndexJsFile = inputIndexJsFile.replace(/^\s*import\s*.*?\s*;\s*$/igm, '');

	const bundle = await Bundle({
		minify: minify,
		root: inputPath,
		comments: comments,
		path: inputIndexJsPath
	});

	const outputIndexJsFile = bundle.code;
	const outputIndexJsPath = Path.join(outputPath);

	await Fsep.writeFile(outputIndexJsPath, outputIndexJsFile);

	// const options = {
	// 	filters: ['index.js']
	// };

	// Array.prototype.push.apply(options.filters, bundle.imports);

	// const filePaths = await Fsep.walk(data.input, options);

	// for (let filePath of filePaths) {
	// 	const fileData = await Fsep.readFile(filePath, 'utf8');
	//
	// 	filePath = filePath.slice(data.input.length);
	// 	filePath = Path.join(outputPath, filePath);
	//
	// 	await Fsep.outputFile(filePath, fileData);
	// }

};
