import Escape from '../modules/escape.js';
import Say from '../modules/say.js';

var home = Escape(`
	// home.js

	exprt default {
		path: '/',
		title: 'Home',
		component: {
			name: 'r-home',
			template: \`
				<h1 o-text="title"></h1>
				<button o-on-click="greet">Greet</button>
			\`,
			model: {
				greeting: 'Old Hello World'
			},
			methods: {
				greet: function () {
					console.log(this.model.greeting);
				}
			},
			created: function () {
				console.log(this.model.greeting);
				this.model.greeting = 'New Hello World';
			}
		}
	};
`);

var indexjs = Escape(`
	// index.js

	import Home from './home.js';

	Oxe.setup({
		loader: {
			transformers: {
				js: 'es', // enables ES6 module and template string re-writes
			},
			methods: {
				js: 'fetch'
			},
			loads: [
				'./index.css',
				'./elements/e-menu.js'
			]
		},
		router: {
			routes: [
				Home
			]
		}
	});

`);

var indexhtml = Escape(`
	<!-- index.html -->

	<html>
	<head>

		<base href="/">
		<script src="./oxe.min.js" o-setup="./index.js, es, fetch" async></script>

	</head>
	<body>

		<e-menu>
			<ul>
				<li><a href="/home">Home</a></li>
			</ul>
		</e-menu>

		<o-router></o-router>

	</body>
	</html>
`);

export default {
	title: 'Oxe',
	path: './',
	component: {
		name: 'r-index',
		attached: function () {
			Prism.highlightAll();
		},
		created: function () {
			Say('r-home created');
		},
		template: `
			<h2>Overview</h2>

			<strong>Synopsis</strong>
			<p>
				A small but mighty web components framework/library.
			</p>

			<strong>Features</strong>
			<ul>
				<li>Small size</li>
				<li>Front end routing</li>
				<li>Optional module loading</li>
				<li>In browser ES6/ESM module rewrites</li>
				<li>In browser Template string rewrites</li>
			</ul>

			<strong>Support</strong>
			<ul>
				<li>IE10~</li>
				<li>IE11</li>
				<li>Chrome</li>
				<li>Firefox</li>
				<li>Safari 7</li>
				<li>Mobile Safari</li>
				<li>Chrome Android</li>
			</ul>

			<strong>Note</strong>
			<p>
			Loader uses <i>XHR </i> and <i>new Function</i> to load on-demand and execute modules. If your worried about security please read the linked articles. In summary the articles support not using new Function/eval to process client input. Therefore if the modules imported are local (Loader enforces this) and contains no malicious code then the safety concern is eliminated.
				<div>Resources</div>
				<ul>
					<li><a href="http://2ality.com/2014/01/eval.html" target="_blank" re="noopener">http://2ality.com/2014/01/eval.html</a></li>
					<li><a href="https://www.nczonline.net/blog/2013/06/25/eval-isnt-evil-just-misunderstood/" target="_blank" re="noopener">https://www.nczonline.net/blog/2013/06/25/eval-isnt-evil-just-misunderstood/</a></li>
				</ul>
			</p>

			<strong>Install</strong>
			<ul>
				<li><i>npm install oxe --save</i></li>
				<li>UMD <i>"dst/oxe.min.js"</i></li>
				<li>UMD with Web Component Pollyfill <i>"dst/oxe.polly.min.js"</i></li>
				<li>Web Component Pollyfill <i>"dst/webcomponents-lite.min.js"</i></li>
			</ul>

			<h2>Example</h2>
			<pre>
				<code class="language-js">${home}</code>
			</pre>
			<pre>
				<code class="language-js">${indexjs}</code>
			</pre>
			<pre>
				<code class="language-html">${indexhtml}</code>
			</pre>
		`
	}
};
