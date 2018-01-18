
Oxe.loader.load('./index.css', function () {
	document.body.style.opacity = 1;
});

Oxe.loader.load('./assets/prism.css');

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
			'./assets/prism.js',
			'./elements/e-menu.js'
		]
	},
	router: {
		// hash: true,
		// trailing: true,
		routes: [
			{
				title: 'Home',
				path: '/',
				template: '<r-home></r-home>',
				url: './routes/r-home.js'
			},
			{
				title: 'Test',
				path: '/test',
				template: '<r-test></r-test>',
				url: './routes/r-test.js'
			},
			{
				title: 'JS',
				path: '/js',
				template: '<r-js></r-js>',
				url: './routes/r-js.js'
			},
			{
				title: '404',
				path: '/{*}',
				template: '<r-404></r-404>',
				url: './routes/r-404.js'
			}
		]
	}
});
