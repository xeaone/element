'use strict';

const Fsep = require('fsep');
const Path = require('path');

const Global = require('./global');
const Bundle = require('./lib/bundle');

module.exports = async function (data) {

	const minify = data.minify || false;
	const comments = data.comments || false;

	const inputPath = Path.extname(data.input) ? data.input : `${data.input}.js`;
	const outputPath = Path.extname(data.output) ? data.output : `${data.output}.js`;

	const inputIndexJsPath = Path.normalize(inputPath);
	const inputIndexJsFile = await Fsep.readFile(inputIndexJsPath, Global.encoding);

	const bundle = await Bundle({
		name: data.name,
		minify: minify,
		root: inputPath,
		comments: comments,
		path: inputIndexJsPath
	});

	const outputIndexJsFile = bundle.code;
	const outputIndexJsPath = Path.join(outputPath);

	await Fsep.outputFile(outputIndexJsPath, outputIndexJsFile);

};
