import Escape from 'modules/escape.js';

var home = Escape(`
	Jenie.component.define({
		name: 'v-home',
		html: \`
			<h1 j-text="title"></h1>
		\`,
		model: {
			title: 'Old Title'
		},
		created: function () {
			this.model.title = 'New Title';
		}
	});
`);

var indexjs = Escape(`
	Jenie.setup({
		http: {
			request: function (opt, xhr) {
				return true; // false will cancel the http.fetch
			},
			response: function (opt, xhr) {
				return true; // false will cancel the http.fetch handlers
			}
		},
		loader: {
			esm: true, // Enables ES6 module re-writes support
			est: true, // Enables ES6 template string re-writes support
			loads: [
				{
					url: '/components/c-menu.js',
					execute: true // Since this component is not a route component or imported we must execute.
				}
			]
		},
		router: {
			routes: [
				{
					path: '/',
					title: 'Home',
					component: 'v-home',
					url: 'views/v-home.js'
				}
			]
		}
	});
`);

var indexhtml = Escape(`
	<html>
	<head>
		<base href="/">
		<script src="jenie.min.js" defer></script>
		<script src="index.js" defer></script>
	</head>
	<body>
		<c-menu>
			<ul>
				<li><a href="/home">Home</a></li>
			</ul>
		</c-menu>
		<j-view></j-view>
	</body>
	</html>
`);

Jenie.component.define({
	name: 'v-root',
	attached: function () {
		Prism.highlightAll();
	},
	html: `
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
			<li><i>npm install jenie --save</i></li>
			<li>UMD <i>"dist/jenie.min.js"</i></li>
			<li>UMD with Web Component Pollyfill <i>"dist/jenie.polly.min.js"</i></li>
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
