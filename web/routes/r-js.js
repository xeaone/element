
export default {
	title: 'JS',
	path: './js',
	component: {
		name: 'r-js',
		model: {
			text: 'Hello from js test'
		},
		template: `
			<p o-text="text"></p>
			<div>
				<slot name="one"></slot>
				<slot name="two"></slot>
			</div>
		`,
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
	}
}
