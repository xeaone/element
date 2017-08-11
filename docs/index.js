
var base = document.baseURI;

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
		base: '/jenie/',
		routes: [
			{
				title: 'Root',
				path: '/',
				component: 'v-root',
				componentUrl: base + 'views/v-root.js'
			},
			{
				title: 'Test',
				path: '/test',
				component: 'v-test',
				componentUrl: base + 'views/v-test.html'
			},
			{
				title: '404',
				path: '/{*}',
				component: 'v-404',
				componentUrl: base + 'views/v-404.html'
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
