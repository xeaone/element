
Oxe.router.on('navigating', function () {
	if (Oxe.router.element) {
		Oxe.router.element.style.opacity = 0;
	}
});

Oxe.router.on('navigated', function () {
	Oxe.router.element.style.opacity = 1;
});

Oxe.setup({
	loader: {
		methods: {
			js: 'fetch'
		},
		transformers: {
			js: 'es'
		},
		loads: [
			{
				url: './index.css',
				listener: function () {
					document.body.style.opacity = 1;
				}
			},
			// './index.css',

			'./routes/r-home.js',
			'./routes/r-test.js',
			'./routes/r-js.js',
			'./routes/r-404.js',

			'./elements/e-menu.js',

			'./assets/prism.css',
			'./assets/prism.js',
		]
	},
	router: {
		// hash: true,
		// trailing: true,
		routes: [
			{
				title: 'Home',
				path: '/',
				template: function (render) {
					render(document.createElement('r-home'));
				},
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
