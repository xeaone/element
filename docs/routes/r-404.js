
Oxe.router.add({
	title: '404',
	path: '/{*}',
	component: {
		name: 'r-404',
		template: `
			<h1>404</h1>
			<h2>This page does not exists</h2>
		`
	}
});
