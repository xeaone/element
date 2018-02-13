'use strict';

/*
	TODO fix links on page not serving
*/

const Vm = require('vm');
const Fsep = require('fsep');
const Path = require('path');
const Util = require('util');

const Parser = require('./parser');
const Bundle = require('./bundle');

const ENCODEING = 'utf8';

const O_ROUTER_PLACEHOLDER_END = '<!--/o-router-placeholder-->';
const O_ROUTER_PLACEHOLDER_START = '<!--o-router-placeholder-->';
const O_ROUTER_PLACEHOLDER = `${O_ROUTER_PLACEHOLDER_START}${O_ROUTER_PLACEHOLDER_END}`;

const O_SCRIPT_PLACEHOLDER_END = '<!--o-script-placeholder-->';
const O_SCRIPT_PLACEHOLDER_START = '<!--/o-script-placeholder-->';
const O_SCRIPT_PLACEHOLDER = `${O_SCRIPT_PLACEHOLDER_START}${O_SCRIPT_PLACEHOLDER_END}`;

(async function() {
	let setup, output = '';

	const inputBasePath = Path.join(__dirname, '../', 'web');
	const outputBasePath = Path.join(__dirname, '../', 'dev');

	// const oxePath = Path.join(__dirname, '../', 'dist', 'oxe.min.js');
	// const oxeFile = await Fsep.readFile(oxePath, ENCODEING);

	const inputIndexJsPath = Path.join(inputBasePath, 'index.js');
	const inputIndexJsFile = await Fsep.readFile(inputIndexJsPath, ENCODEING);
	const cleanInputIndexJsFile = inputIndexJsFile.replace(/^\s*import\s*.*?\s*;\s*$/igm, '');

	const inputIndexHtmlPath = Path.join(inputBasePath, 'index.html');
	const inputIndexHtmlFile = await Fsep.readFile(inputIndexHtmlPath, ENCODEING);

	const cleanInputIndexHtmlFile = inputIndexHtmlFile.replace(/<!DOCTYPE html>/i, '');

	Parser.html(cleanInputIndexHtmlFile, {
		start: function (tag, attributes, unary) {
			if (tag === 'script') {

				const oscript = attributes.find(function (attribute) {
					return attribute.name === 'o-setup';
				});

				if (oscript) {
					oscript.value = `${oscript.value.split(/\s*,\s*/)[0]}, null, script`;
					// output += O_SCRIPT_PLACEHOLDER_START;
				}

				output += Parser.createTagStart(tag, attributes);

			} else if (tag === 'o-router') {
				output += O_ROUTER_PLACEHOLDER_START;
			} else {
				output += Parser.createTagStart(tag, attributes);
			}
		},
		end: function (tag) {
			if (tag === 'o-router') {
				output += O_ROUTER_PLACEHOLDER_END;
			} else {
				output += `</${tag}>`;
			}
		},
		chars: function (text) {
			output += text;
		},
		comment: function (text) {
			output += `<!--${text}-->`;
		}
	});

	Vm.runInNewContext(cleanInputIndexJsFile, {
		Oxe: {
			setup: async function (options) {

				try {

					options = options || {};

					for (let route of options.router.routes) {

						let routeContent = output;
						let routePath = route.path;

						routePath = routePath === '/' ? routePath = '/index.html' : routePath;
						routePath = Path.extname(routePath) === '.html' ? routePath : Path.join(routePath, 'index.html');

						routeContent = routeContent
							.replace(O_ROUTER_PLACEHOLDER, `<o-router><${route.component}></${route.component}></o-router>`);

						const outputPath = Path.join(outputBasePath, routePath);
						await Fsep.outputFile(outputPath, routeContent);

					}

				} catch (e) {
					console.error(e);
				}

			}
		}
	});

	const bundle = await Bundle(inputIndexJsPath, inputBasePath);

	const outputIndexJsFile = bundle.code;
	const outputIndexJsPath = Path.join(outputBasePath, 'index.js');

	await Fsep.writeFile(outputIndexJsPath, outputIndexJsFile);

	const options = {
		filters: ['index.js', 'index.html']
	};

	Array.prototype.push.apply(options.filters, bundle.imports);

	const filePaths = await Fsep.walk(inputBasePath, options);

	for (let filePath of filePaths) {
		const fileData = await Fsep.readFile(filePath, 'utf8');
		filePath = filePath.slice(inputBasePath.length);
		filePath = Path.join(outputBasePath, filePath);
		await Fsep.outputFile(filePath, fileData);
	}

}()).catch(function (error) {
	console.error(error);
});
