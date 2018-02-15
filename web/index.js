// import './assets/prism.js';
//
// import './elements/e-foo.js';
// import './elements/e-menu.js';

import './routes/r-index.js';
// import './routes/r-test.js';
// import './routes/r-js.js';
// import './routes/r-test.js';

Oxe.setup({
	loader: {
		methods: {
			js: 'fetch'
		},
		transformers: {
			js: 'es'
		},
		loads: [
			// './routes/r-test.js',
			// './routes/r-index.js',
			// './elements/e-foo.js',
			// './elements/e-menu.js',
			'./assets/prism.css',
			// {
			// 	transformer: 'none',
			// 	url: './assets/prism.js',
			// }
		]
	},
	router: {
		// hash: true,
		// trailing: true,
		routes: [
			{
				title: 'Oxe',
				path: '/',
				component: 'r-index',
				// load: './routes/r-index.js'
			},
			{
				title: 'Test',
				path: '/test',
				component: 'r-test',
				// load: './routes/r-test.js'
			},
			{
				title: 'JS',
				path: '/js',
				component: 'r-js',
				// load: './routes/r-js.js'
			},
			// {
			// 	title: '404',
			// 	path: '/{*}',
			// 	component: {
			// 		name: 'r-404',
			// 		template: `
			// 			<h1>404</h1>
			// 			<h2>This page does not exists</h2>
			// 		`
			// 	}
			// }
		]
	}
});
