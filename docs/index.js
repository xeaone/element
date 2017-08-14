
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
	router: {
		// trailing: true,
		// hash: true,
		routes: [
			{
				title: 'Root',
				path: '/',
				component: 'v-root',
				componentUrl: '/views/v-root.js'
			},
			{
				title: 'Test',
				path: '/test',
				component: 'v-test',
				componentUrl: '/views/v-test.html'
			},
			{
				title: 'JS',
				path: '/js',
				component: 'v-js',
				componentUrl: '/views/v-js.js'
			},
			{
				title: '404',
				path: '/{*}',
				component: 'v-404',
				componentUrl: '/views/v-404.html'
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
