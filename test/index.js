
Jenie.services.say = function (string) {
	console.log(string);
};

Jenie.router.setup({
	base: '/test',
	// mode: false,
	routes: [
		{
			path: '/',
			component: 'html-test'
		},
		{
			path: '/js',
			component: 'js-test'
		}
	]
});
