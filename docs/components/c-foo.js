
export default {
	name: 'c-foo',
	// shadow: true,
	model: {
		text: 'text from foo'
	},
	template: `
		<div o-text="text"></div>
		<slot name="sub"></slot>
	`
}
