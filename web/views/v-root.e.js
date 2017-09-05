import Say from '/say.js';

var home = Jenie.escape(`
	Jenie.component({
		name: 'v-home',
		template: \`
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

var indexjs = Jenie.escape(`
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
			esm: true, // Enables ES6 import export module support
			loads: [
				{
					file: '/components/c-menu.js',
					execute: true // Since this component is not a module/route or imported we must execute.
				}
			]
		},
		router: {
			routes: [
				{
					path: '/',
					title: 'Home',
					component: 'v-home',
					file: 'views/v-home.js'
				}
			]
		}
	});
`);

var indexhtml = Jenie.escape(`
	<html>
	<head>
		<base href="/">
		<script src="jenie.min.js" defer></script>
		<script src="index.js" defer></script>
	</head>
	<body>
		<j-view></j-view>
	</body>
	</html>
`);

Jenie.component({
	name: 'v-root',
	template: `
		<h2>Overview</h2>

		<strong>Synopsis</strong>
		<p>
			A small but mighty web components framework/library.
		</p>

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

		<strong>Install</strong>
		<ul>
			<li><strong>npm install jenie --save</strong></li>
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
	`,
	attached: function () {
		Prism.highlightAll();
		Say('hello world');
	}
});
