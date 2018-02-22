'use strict';

const Vm = require('vm');
const Path = require('path');
const Fsep = require('fsep');
const Global = require('../global');

module.exports = async function (inputIndexJsContent, template) {
	const files = [];

	Vm.runInNewContext(inputIndexJsContent, {
		Oxe: {
			component: {
				define: function (c) {
					return function () {
						return c;
					}
				}
			},
			router: {
				data: [],
				add: function (r) {
					this.data.push(r);
					return r;
				}
			},
			setup: function (options) {

				options = options || {};

				for (let route of this.router.data) {
					let data, path, routeTemplate, routeName;

					route.title = route.title || '';

					if (typeof route.component === 'string') {
						routeName = route.component;
					} else if (typeof route.component === 'object') {
						routeName = route.component.name;
						routeTemplate = route.component.template;
					}

					data = template.replace(
						Global.oRouterPlaceholder,
						`<o-router>\n\t\t<${routeName} o-scope="${routeName}-0">\n${routeTemplate}\n\t\t</${routeName}>\n</o-router>`
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
