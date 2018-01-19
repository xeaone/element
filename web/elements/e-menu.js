
Oxe.component.define({
	name: 'e-menu',
	created: function () {
		console.log('created');
	},
	template: `
		<ul>
			<slot name="one"></slot>
			<slot name="two"></slot>
		</ul>
	`
});
