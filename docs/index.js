import './assets/prism.js';
import './elements/e-foo.js';
import './elements/e-menu.js';
import './routes/r-index.js';
import './routes/r-test.js';
import './routes/r-404.js';
import './routes/r-js.js';

Oxe.setup({
	loader: {
		// methods: {
		// 	js: 'fetch'
		// },
		// transformers: {
		// 	js: 'es'
		// },
		loads: [
			'./assets/prism.css',
		]
	},
	router: {
		// hash: true,
		// trailing: true,
	}
});
