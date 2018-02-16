'use strict';

const Path = require('path');
const Fsep = require('fsep');
const Global = require('../global');

module.exports = async function (outputContent, outputPath, options) {
	let routeContent, routePath;

	try {

		options = options || {};

		for (let route of options.router.routes) {

			routeContent = outputContent.replace(
				Global.oRouterPlaceholder,
				`<o-router><${route.component}></${route.component}></o-router>`
			);

			routeContent = routeContent.replace(Global.oTitlePlaceholder, route.title);

			routePath = route.path;
			routePath = routePath === '/' ? routePath = '/index.html' : routePath;
			routePath = Path.extname(routePath) === '.html' ? routePath : Path.join(routePath, 'index.html');
			routePath = Path.join(outputPath, routePath);

			await Fsep.outputFile(routePath, routeContent);

		}

	} catch (e) {
		console.error(e);
	}

};
