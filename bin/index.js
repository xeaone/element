#!/usr/bin/env node

const Cliy = require('cliy');
const Path = require('path');
const Bundle = require('./bundle');
const Compile = require('./compile');
const Package = require('../package');

const Program = new Cliy();

const io = async function (argument, values) {
	const args = argument ? argument.split(' ') : [];

	if (!args[0]) throw new Error('Missing input path parameter');
	if (!args[1]) throw new Error('Missing output path parameter');

	values.input = Path.resolve(process.cwd(), args[0]);
	values.output = Path.resolve(process.cwd(), args[1]);

	return values;
};

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
					},
					{
						key: 'c',
						name: 'comments',
						method: function () {
							return false;
						}
					}
				],
				method: async function (argument, values) {
					const data = await io(argument, values);
					await Compile(data);
				}
			},
			{
				key: 'b',
				name: 'bundle',
				method: async function (argument, values) {
					const data = await io(argument, values);
					await Bundle(data);
				}
			}
		]
	});

	await Program.run(process.argv);

}()).catch(function (error) {
	console.error(error);
});
