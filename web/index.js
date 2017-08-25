
Jenie.setup({
	module: {
		modules: [
			{
				name: 'one',
				method: function () {
					return 1;
				}
			},
			{
				name: 'two',
				method: function () {
					return 2;
				}
			},
			{
				name: 'sum',
				dependencies: ['one', 'two'],
				method: function (one, two) {
					return one + two;
				}
			}
		]
	},
	loader: {
		loads: [
			{
				group: 'defer',
				path: 'assets/prism-default.css'
			},
			{
				group: 'defer',
				path: 'assets/prism.js'
			}
		]
	},
	router: {
		base: true,
		// trailing: true,
		// hash: true,
		routes: [
			{
				title: 'Root',
				path: '/',
				component: 'v-root',
				load: 'views/v-root.js'
			},
			{
				title: 'Test',
				path: '/test',
				component: 'v-test',
				load: 'views/v-test.js'
			},
			{
				title: 'JS',
				path: '/js',
				component: 'v-js',
				load: 'views/v-js.js'
			},
			{
				title: '404',
				path: '/{*}',
				component: 'v-404',
				load: 'views/v-404.js'
			}
		]
	}
});

Jenie.module.export('say', ['sum'], function (sum) {
	return function (string) {
		console.log(string);
		console.log(sum);
	};
});
