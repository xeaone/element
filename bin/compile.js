'use strict';

const Fsep = require('fsep');
const Path = require('path');
const Util = require('util');

const Global = require('./global');
const Parser = require('./lib/parser');
const Bundle = require('./lib/bundle');
const RouteFiles = require('./handlers/route-files.js');
const TemplateFile = require('./handlers/template-file.js');

module.exports = async function (data) {

	const inputIndexJsPath = Path.join(data.input, 'index.js');
	const inputIndexHtmlPath = Path.join(data.input, 'index.html');

	let inputIndexHtmlFile = await Fsep.readFile(inputIndexHtmlPath, Global.encoding);
	inputIndexHtmlFile = inputIndexHtmlFile.replace(/<!DOCTYPE html>/i, '');

	const inputIndexJsBundle = await Bundle({
		cwd: data.input,
		path: inputIndexJsPath
	});

	const inputIndexJsFile = inputIndexJsBundle.code;

	const templateFile = await TemplateFile(inputIndexHtmlFile);
	const routeFiles = await RouteFiles(inputIndexJsFile, templateFile);

	for (let routeFile of routeFiles) {
		await Fsep.outputFile(
			Path.join(data.output, routeFile.path),
			routeFile.data
		);
	}

	const outputIndexJsBundle = await Bundle({
		minify: data.minify,
		path: inputIndexJsPath,
		comments: data.comments,
		transpile: data.transpile
	});

	const outputIndexJsFile = outputIndexJsBundle.code;
	const outputIndexJsPath = Path.join(data.output, 'index.js');

	await Fsep.writeFile(outputIndexJsPath, outputIndexJsFile);

	const options = {
		filters: ['index.js', 'index.html'].concat(outputIndexJsBundle.imports)
	};

	const filePaths = await Fsep.walk(data.input, options);

	for (let filePath of filePaths) {
		const fileData = await Fsep.readFile(filePath, 'utf8');

		filePath = filePath.slice(data.input.length);
		filePath = Path.join(data.output, filePath);

		await Fsep.outputFile(filePath, fileData);
	}

};
