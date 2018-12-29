import cMenu from './components/c-menu.js';
import cFoo from './components/c-foo.js';

import rSelect from './routes/r-select.js';
// import rIndex from './routes/r-index.js';
import rTest from './routes/r-test.js';
import r404 from './routes/r-404.js';
import rJs from './routes/r-js.js';

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
			'./routes/r-index.js',
			rSelect,
			rTest,
			rJs,
			r404
		]
	}
}).catch(console.error);
