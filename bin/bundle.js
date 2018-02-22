'use strict';

const Fsep = require('fsep');
const Path = require('path');

const Global = require('./global');
const Bundle = require('./lib/bundle');

module.exports = async function (data) {

	const inputPath = Path.normalize(data.input);
	const outputPath = Path.normalize(data.output);

	const bundle = await Bundle({
		name: data.name,
		path: inputPath,
		minify: data.minify,
		comments: data.comments,
		transpile: data.transpile
	});

	const outputData = bundle.code;

	await Fsep.outputFile(outputPath, outputData);

};
