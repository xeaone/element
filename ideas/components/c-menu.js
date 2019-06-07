
export default {
    name: 'c-menu',
    model: {
        text: 'text from menu'
    },
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
			<c-foo>
				<div slot="sub" o-text="text"></div>
			</c-foo>
			<slot name="one"></slot>
			<slot name="two"></slot>
			<slot></slot>
		</ul>
	`
};
