
var base = window.location.pathname;

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
		base: base,
		routes: [
			{
				title: 'html',
				path: '/',
				component: 'html-test',
				componentUrl: base + 'html-test.html'
			},
			{
				title: 'js',
				path: '/js',
				component: 'js-test',
				componentUrl: base + 'js-test.js'
			},
			{
				title: '404',
				path: '/{*}',
				component: 'j-404',
				componentUrl: base + 'j-404.html'
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
