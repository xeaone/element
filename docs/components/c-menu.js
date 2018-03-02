
export default {
	name: 'c-menu',
	created: function () {
		console.log('created c-menu');
	},
	style: `
		:host {
			--g: gray;
			--r-e-d: red;
		}
		:scope ul {
			background: var(--g);
		}
		:scope li {
			background: var(--r-e-d);
		}
	`,
	template: `
		<ul>
			<slot name="one"></slot>
			<slot name="two"></slot>
			<slot></slot>
		</ul>
	`
}
