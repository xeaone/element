import './assets/prism.js';

import cMenu from './components/c-menu.js';
import cFoo from './components/c-foo.js';
import rIndex from './routes/r-index.js';
import rTest from './routes/r-test.js';
import r404 from './routes/r-404.js';
import rJs from './routes/r-js.js';

Oxe.setup({
	fetcher: {
		request: function () {
			return Promise.resolve().then(function () {
				return true;
			});
		}
	},
	loader: {
		methods: {
			js: 'fetch'
		},
		transformers: {
			js: 'es'
		},
		loads: [
			'./assets/prism.css',
		]
	},
	router: {
		routes: [
			rIndex,
			rTest,
			rJs,
			r404
		]
	},
	component: {
		components: [
			cFoo,
			cMenu
		]
	}
});
