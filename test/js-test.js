
Jenie.register({
	name: 'js-test',
	model: {
		text: 'Hello from js test'
	},
	template: function () {/*

		<template>
			<p j-text="text"></p>
		</template>

	*/},
	created: function () {
		console.log('created ' + this.name);
	},
	attached: function () {
		console.log('attached ' + this.name);
	},
	detached: function () {
		console.log('detached ' + this.name);
	},
});
