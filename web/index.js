import './assets/prism.js';

import cMenu from './components/c-menu.js';
import cFoo from './components/c-foo.js';
import rIndex from './routes/r-index.js';
import rTest from './routes/r-test.js';
import r404 from './routes/r-404.js';
import rJs from './routes/r-js.js';

Oxe.setup({
	fetcher: {
		// request: function () {
		// 	return new Promise(function (resolve) {
		// 		setTimeout(function () {
		// 			resolve(true);
		// 		}, 1500);
		// 	});
		// }
		// request: async function () {
		// 	return true;
		// }
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
		},
		loads: [
			'./assets/prism.css'
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

Promise.resolve().then(function () {
	return Oxe.fetcher.get({
		url: 'https://jsonplaceholder.typicode.com/todos/1'
	});
})
.then(console.log)
.catch(console.error);
