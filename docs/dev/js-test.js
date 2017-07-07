
Jenie.component({
	name: 'js-test',
	model: {
		text: 'Hello from js test'
	},
	template: function () {/*

		<template>

			<p j-text="text"></p>
			<div>
				<slot name="one"></slot>
				<slot name="two"></slot>
			</div>

		</template>

	*/},
	created: function () {
		console.log('created ' + this.name);
		this.model.text = 'new js render';
	},
	attached: function () {
		console.log('attached ' + this.name);
	},
	detached: function () {
		console.log('detached ' + this.name);
	},
});
