import cMenu from './components/c-menu.js';
import cFoo from './components/c-foo.js';

Oxe.router.on('route:before', function () {
	console.log('route:before');
});

Oxe.router.on('route:after', function () {
	console.log('route:after');
});

Oxe.setup({
	fetcher: {
		request: function () {
			console.log(arguments);
		},
		response: function () {
			console.log(arguments);
		}
	},
	component: {
		components: [
			cFoo,
			cMenu
		]
	},
	router: {
		routes: [
			'index',
			'js',
			'test',
			'select',
			'input',
			'style',
			'(*)'
		]
	}
}).catch(console.error);
