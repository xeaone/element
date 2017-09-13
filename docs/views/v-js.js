
Jenie.component({
	name: 'v-js',
	model: {
		text: 'Hello from js test'
	},
	html: '\n\t\t<p j-text="text"></p>\n\t\t<div>\n\t\t\t<slot name="one"></slot>\n\t\t\t<slot name="two"></slot>\n\t\t</div>\n\t',
	created: function created() {
		console.log('created ' + this.name);
		this.model.text = 'new js render';
	},
	attached: function attached() {
		console.log('attached ' + this.name);
	},
	detached: function detached() {
		console.log('detached ' + this.name);
	}
});