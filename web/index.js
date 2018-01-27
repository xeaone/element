// import './routes/r-js.js';
// import './routes/r-404.js';
// import './routes/r-test.js';
// import './routes/r-index.js';
// import './elements/e-foo.js';
// import './elements/e-menu.js';
// import './assets/prism.js';

Oxe.setup({
	loader: {
		methods: {
			js: 'fetch'
		},
		transformers: {
			js: 'es'
		},
		loads: [
			'./routes/r-js.js',
			'./routes/r-404.js',
			'./routes/r-test.js',
			'./routes/r-index.js',
			'./elements/e-foo.js',
			'./elements/e-menu.js',
			'./assets/prism.css',
			{
				transformer: 'none',
				url: './assets/prism.js',
			}
		]
	},
	router: {
		// hash: true,
		// trailing: true,
		routes: [
			{
				title: 'Oxe',
				path: '/',
				template: '<r-index></r-index>',
				// template: function (render) {
				// 	render(document.createElement('r-index'));
				// }
			},
			{
				title: 'Test',
				path: '/test',
				template: '<r-test></r-test>',
			},
			{
				title: 'JS',
				path: '/js',
				template: '<r-js></r-js>',
			},
			{
				title: '404',
				path: '/{*}',
				template: '<r-404></r-404>',
			}
		]
	}
});
