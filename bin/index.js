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

const operations = {
	minify: {
		key: 'm',
		name: 'minify',
		method: function () {
			return true;
		}
	},
	comments: {
		key: 'c',
		name: 'comments',
		method: function () {
			return false;
		}
	},
	transpile: {
		key: 't',
		name: 'transpile',
		method: function () {
			return true;
		}
	}
};

(async function() {

	await Program.setup({
		name: Package.name,
		version: Package.version,
		operations: [
			{
				key: 'c',
				name: 'compile',
				description: 'Compiles project to static files requires a index.html and index.js.',
				operations: [
					operations.minify,
					operations.comments,
					operations.transpile
				],
				method: async function (argument, values) {
					const data = await io(argument, values);
					await Compile(data);
				}
			},
			{
				key: 'b',
				name: 'bundle',
				operations: [
					operations.minify,
					operations.comments,
					operations.transpile,
					{
						key: 'n',
						name: 'name',
						method: function (name) {
							return name;
						}
					}
				],
				method: async function (argument, values) {
					const data = await io(argument, values);
					await Bundle(data);
				}
			}
		]
	});

	await Program.run(process.argv);

}()).catch(function (error) {
	console.error(error.stack);
});
