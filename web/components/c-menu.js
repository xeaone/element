
export default {
    name: 'c-menu',
    model: {
        text: 'text from menu'
    },
    created: function () {
        console.log('created c-menu');
    },
    style: /*css*/`
		:host {
			--g: gray;
			--r-e-d: red;
		}
		:host ul {
			background: var(--g);
		}
		:host li {
			background: var(--r-e-d);
		}
	`,
    template: /*html*/`
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
