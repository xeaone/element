var title = 'Input';

export default {
    title: title,
    path: '/input',
    component: {
        name: 'r-input',
        model: {
            title: title,
            text: 'Hello World'
        },
        template: `
			<h2 o-text="title"></h2>
			<hr>

			<div o-text="text"></div>
			<input o-value="text" />

		`
    }
};
