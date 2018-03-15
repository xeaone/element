'use strict';

const Vm = require('vm');
const Path = require('path');
const Global = require('../global');

module.exports = async function (inputIndexJsContent, template) {
	const files = [];

	Vm.runInNewContext(inputIndexJsContent, {
		Oxe: {
			global: {},
			component: {
				define: function (c) {
					return function () {
						return c;
					}
				}
			},
			router: {
				data: [],
				add: function (data) {
					if (!data) return;
					var type = data.constructor.name === 'Array' ? 'apply' : 'call';
					Array.prototype.push[type](this.data, data);
					return data;
				}
			},
			setup: function (options) {

				options = options || {};

				if (options.router) {
					this.router.add(options.router.routes);
				}

				for (let route of this.router.data) {
					let data, path, routeTemplate, routeName, routeStyle;

					route.title = route.title || '';

					if (typeof route.component === 'string') {
						routeName = route.component;
					} else if (typeof route.component === 'object') {
						routeName = route.component.name || '';
						routeStyle = route.component.style || '';
						routeTemplate = route.component.template || '';
					}

					data = template.replace(
						Global.oRouterPlaceholder,
						`<o-router>\n\t\t<${routeName} o-scope="${routeName}-0">\n${routeStyle}\n${routeTemplate}\n\t\t</${routeName}>\n</o-router>`
					);

					data = data.replace(Global.oTitlePlaceholder, route.title);

					path = route.path;
					path = path === '/' ? path = '/index.html' : path;
					path = Path.extname(path) === '.html' ? path : Path.join(path, 'index.html');

					files.push({
						path: path,
						data: data
					});

				}

			}
		}
	});

	return files;
};
