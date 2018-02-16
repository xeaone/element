'use strict';

/*
	TODO fix links on page not serving
*/

const Vm = require('vm');
const Fsep = require('fsep');
const Path = require('path');
const Util = require('util');

const Global = require('./global');
const Setup = require('./lib/setup');
const Parser = require('./lib/parser');
const Bundle = require('./lib/bundle');

return module.exports = async function (data) {

	let outputContent = '';

	const inputPath = data.input;
	const outputPath = data.output;
	const minify = data.minify || false;
	const comments = data.comments || false;

	const inputIndexJsPath = Path.join(inputPath, 'index.js');
	const inputIndexJsFile = await Fsep.readFile(inputIndexJsPath, Global.encoding);
	const cleanInputIndexJsFile = inputIndexJsFile.replace(/^\s*import\s*.*?\s*;\s*$/igm, '');

	const inputIndexHtmlPath = Path.join(inputPath, 'index.html');
	const inputIndexHtmlFile = await Fsep.readFile(inputIndexHtmlPath, Global.encoding);

	const cleanInputIndexHtmlFile = inputIndexHtmlFile.replace(/<!DOCTYPE html>/i, '');

	Parser.html(cleanInputIndexHtmlFile, {
		start: function (tag, attributes, unary) {
			if (tag === 'script') {

				const oscript = attributes.find(function (attribute) {
					return attribute.name === 'o-setup';
				});

				if (oscript) {
					oscript.value = `${oscript.value.split(/\s*,\s*/)[0]}, compiled, script`;
				}

				outputContent += Parser.createTagStart(tag, attributes);

			} else if (tag === 'o-router') {
				outputContent += Global.oRouterPlaceholderStart;
			} else {
				outputContent += Parser.createTagStart(tag, attributes);
			}
		},
		end: function (tag) {
			if (tag === 'o-router') {
				outputContent += Global.oRouterPlaceholderEnd;
			} else {
				outputContent += `</${tag}>`;
			}
		},
		chars: function (text) {
			outputContent += text;
		},
		comment: function (text) {
			outputContent += `<!--${text}-->`;
		}
	});

	Vm.runInNewContext(cleanInputIndexJsFile, {
		Oxe: { setup: Setup.bind(null, outputContent, outputPath) }
	});

	const bundle = await Bundle({
		minify: minify,
		root: inputPath,
		comments: comments,
		path: inputIndexJsPath
	});

	const outputIndexJsFile = bundle.code;
	const outputIndexJsPath = Path.join(outputPath, 'index.js');

	await Fsep.writeFile(outputIndexJsPath, outputIndexJsFile);

	const options = {
		filters: ['index.js', 'index.html']
	};

	Array.prototype.push.apply(options.filters, bundle.imports);

	const filePaths = await Fsep.walk(inputPath, options);

	for (let filePath of filePaths) {
		const fileData = await Fsep.readFile(filePath, 'utf8');

		filePath = filePath.slice(inputPath.length);
		filePath = Path.join(outputPath, filePath);

		await Fsep.outputFile(filePath, fileData);
	}

};
