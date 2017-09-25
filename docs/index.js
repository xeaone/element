
Oxe.setup({
	loader: {
		esm: true,
		est: true,
		base: true,
		loads: [
			{
				url: 'say.js'
			}
		]
	},
	router: {
		base: true,
		// hash: true,
		// trailing: true,
		routes: [
			{
				title: 'Root',
				path: '/',
				component: 'v-root',
				url: 'views/v-root.js'
			},
			{
				title: 'Test',
				path: '/test',
				component: 'v-test',
				url: 'views/v-test.js'
			},
			{
				title: 'JS',
				path: '/js',
				component: 'v-js',
				url: 'views/v-js.js'
			},
			{
				title: '404',
				path: '/{*}',
				component: 'v-404',
				url: 'views/v-404.js'
			}
		]
	}
});
