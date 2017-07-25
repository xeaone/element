
Jenie.module.export('one', function () {
	return 1;
});

Jenie.module.export('two', function () {
	return 2;
});

Jenie.module.export('say', ['one', 'two'], function (one, two) {
	return function (string) {
		console.log(string);
		console.log(one);
		console.log(two);
	};
});

Jenie.router.listen({
	base: '/dev',
	routes: [
		{
			title: 'html',
			path: '/',
			component: 'html-test',
			componentUrl: './html-test.html'
		},
		{
			title: 'js',
			path: '/js',
			component: 'js-test',
			componentUrl: './js-test.js'
		},
		{
			title: '404',
			path: '/{*}',
			component: 'j-404',
			componentUrl: './j-404.html'
		}
	]
});
