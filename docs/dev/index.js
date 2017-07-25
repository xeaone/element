
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

var base = window.location.pathname;

Jenie.router.listen({
	base: base,
	routes: [
		{
			title: 'html',
			path: '/',
			component: 'html-test',
			componentUrl: base + '/html-test.html'
		},
		{
			title: 'js',
			path: '/js',
			component: 'js-test',
			componentUrl: base + '/js-test.js'
		},
		{
			title: '404',
			path: '/{*}',
			component: 'j-404',
			componentUrl: base + '/j-404.html'
		}
	]
});
