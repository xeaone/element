
Oxe.component.define({
	name: 'e-menu',
	created: function () {
		console.log('created');
	},
	html: `
		<ul>
			<slot name="one"></slot>
			<slot name="two"></slot>
		</ul>
	`
});
