
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
				component: 'r-home',
				url: './routes/r-home.js'
			},
			{
				title: 'Test',
				path: '/test',
				component: 'r-test',
				url: './routes/r-test.js'
			},
			{
				title: 'JS',
				path: '/js',
				component: 'r-js',
				url: './routes/r-js.js'
			},
			{
				title: '404',
				path: '/{*}',
				component: 'r-404',
				url: './routes/r-404.js'
			}
		]
	}
});
