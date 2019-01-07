import cMenu from './components/c-menu.js';
import cFoo from './components/c-foo.js';
import r404 from './routes/404.js';

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
	loader: {
		methods: {
			js: 'fetch'
		},
		transformers: {
			js: 'es'
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
			'select',
			'test',
			'js',
			'input',
			r404
		]
	}
}).catch(console.error);
