
Jenie.setup({
	loader: {
		esm: true,
		base: true,
		loads: [

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
				file: 'views/v-root.js'
			},
			{
				title: 'Test',
				path: '/test',
				component: 'v-test',
				file: 'views/v-test.js'
			},
			{
				title: 'JS',
				path: '/js',
				component: 'v-js',
				file: 'views/v-js.js'
			},
			{
				title: '404',
				path: '/{*}',
				component: 'v-404',
				file: 'views/v-404.js'
			}
		]
	}
});

// Jenie.module.export('say', ['sum'], function (sum) {
// 	return function (string) {
// 		console.log(string);
// 		console.log(sum);
//
// 	};
// });
