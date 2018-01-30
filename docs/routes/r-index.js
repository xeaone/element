import Escape from '../modules/escape.js';
import Say from '../modules/say.js';

var home = Escape(`
	Oxe.component.define({
		name: 'r-home',
		template: \`
			<h1 o-text="title"></h1>
		\`,
		model: {
			title: 'Old Title'
		},
		methods: {
			log: function () {
				console.log(this.model.title);
			}
		},
		created: function () {
			this.model.title = 'New Title';
		}
	});
`);

var indexjs = Escape(`
	Oxe.setup({
		keeper: {
			unauthorized: '/sign-in', // string or function
		},
		fetcher: {
			auth: true, // enables keeper for all fetches
		},
		loader: {
			transformers: {
				js: 'es', // enables ES6 module and template string re-writes
			},
			methods: {
				js: 'fetch'
			},
			loads: [
				'./index.css',
				'./routes/r-home.js',
				'./elements/e-menu.js'
			]
		},
		router: {
			auth: true, // enables keeper for all routes
			routes: [
				{
					auth: false, // individually disable/eneable auth
					path: '/',
					title: 'Home',
					template: '<r-home></r-home>'
				}
			]
		}
	});
`);

var indexhtml = Escape(/*html*/`
	<html>
	<head>

		<base href="/">
		<script src="oxe.min.js" o-index-url="index.js" o-index-method="fetch" o-index-transformer="es" async></script>

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

Oxe.component.define({
	name: 'r-index',
	attached: function () {
		Prism.highlightAll();
	},
	created: function () {
		Say('r-home created');
	},
	template: /*html*/`
		<h2>Overview</h2>

		<strong>Synopsis</strong>
		<p>
			A small but mighty web components framework/library.
		</p>

		<strong>Features</strong>
		<ul>
			<li>Really Small 8.09KB gzipped and 27.08KB uncompressed</li>
			<li>In browser ES6/ESM module and template strings support</li>
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
		Loader uses <i>XHR </i> and <i>new Function</i> to load on-demand and execute modules. If your worried about security please read the linked articles. In summary the articles support not using new Function/eval to process client input. So as long as your only importing local modules (Loader enforces this) then the safety concern is eliminated.
			<div>Resources</div>
			<ul>
				<li><a href="http://2ality.com/2014/01/eval.html" target="_blank" re="noopener">http://2ality.com/2014/01/eval.html</a></li>
				<li><a href="https://www.nczonline.net/blog/2013/06/25/eval-isnt-evil-just-misunderstood/" target="_blank" re="noopener">https://www.nczonline.net/blog/2013/06/25/eval-isnt-evil-just-misunderstood/</a></li>
			</ul>
		</p>

		<strong>Install</strong>
		<ul>
			<li><i>npm install oxe --save</i></li>
			<li>UMD <i>"dist/oxe.min.js"</i></li>
			<li>UMD with Web Component Pollyfill <i>"dist/oxe.polly.min.js"</i></li>
			<li>Web Component Pollyfill <i>"dist/webcomponents-lite.min.js"</i></li>
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
});
