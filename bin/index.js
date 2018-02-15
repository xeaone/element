#!/usr/bin/env node

const Cliy = require('cliy');
const Compile = require('./compile');
const Package = require('../package');

const Program = new Cliy();

// TODO update cliy and update with version

(async function() {

	await Program.setup({
		name: Package.name,
		version: Package.version,
		operations: [
			{
				key: 'c',
				name: 'compile',
				options: {
					key: 'm',
					name: 'minify',
					method: function () {
						return true;
					}
				},
				method: Compile
			}
		]
	});

	await Program.run(process.argv);

}()).catch(function (error) {
	console.error(error);
});
