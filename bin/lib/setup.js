'use strict';

const Path = require('path');
const Fsep = require('fsep');
const Global = require('../global');

module.exports = async function (outputContent, outputPath, options) {

	try {

		options = options || {};

		for (let route of options.router.routes) {

			let routeContent = outputContent.replace(
				Global.oRouterPlaceholder,
				`<o-router><${route.component}></${route.component}></o-router>`
			);

			let routePath = route.path;

			routePath = routePath === '/' ? routePath = '/index.html' : routePath;
			routePath = Path.extname(routePath) === '.html' ? routePath : Path.join(routePath, 'index.html');
			routePath = Path.join(outputPath, routePath);

			await Fsep.outputFile(routePath, routeContent);

		}

	} catch (e) {
		console.error(e);
	}

};
