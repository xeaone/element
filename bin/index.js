#!/usr/bin/env node

const Cliy = require('cliy');
const Compile = require('./compile');
const Package = require('../package');

const Program = new Cliy();

(async function() {

	await Program.setup({
		name: Package.name,
		version: Package.version,
		operations: [
			{
				key: 'c',
				name: 'compile',
				operations: [
					{
						key: 'm',
						name: 'minify',
						method: function () {
							return true;
						}
					}
				],
				method: Compile
			}
		]
	});

	await Program.run(process.argv);

}()).catch(function (error) {
	console.error(error);
});
