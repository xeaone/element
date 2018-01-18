#!/usr/bin/env node

const Package = require('../package');
const Compile = require('./compile');
const Cliy = require('cliy');
const Program = new Cliy();

(async function() {

	await Program.setup({
		name: Package.name,
		version: Package.version,
		operations: [
			{
				key: 'c',
				name: 'compile',
				method: Compile
			}
		]
	});

	await Program.run(process.argv);

}()).catch(function (error) {
	console.error(error);
});
