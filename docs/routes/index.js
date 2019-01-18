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

	imprt './elements/e-menu.js';
	imprt Home from './home.js';

	Oxe.setup({
		loader: {
			type: 'es' // required to rewrite import exports
		},
		router: {
			routes: [
				Home,
				'error' // dynamically loads and resolves to /routes/error.js
			]
		}
	}).catch(console.error);
`);

var indexhtml = Escape(`
	<!-- index.html -->

	<html>
	<head>

		<base href="/">
		<script src="./poly.min.js" defer></script>
		<script src="./oxe.min.js" o-setup="./index.js, es" defer></script>

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
	path: '/',
	component: {
		name: 'r-index',
		created: function () {
			Say('r-home created');
		},
		template: `
			<h2>Overview</h2>

			<strong>Synopsis</strong>
			<p>A mighty tiny web components framework/library.</p>

			<strong>Features</strong>
			<ul>
				<li>Small size</li>
				<li>Front end routing</li>
				<li>Configuration based</li>
				<li>Optional module loading</li>
				<li>Optional in browser ES6/ESM module rewrites</li>
				<li>Optional in browser Template string rewrites</li>
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

			<strong>Polyfill</strong>
			<ul>
				<li>
					<p>
						<a hregf="https://github.com/vokeio/oxe/blob/master/dst/poly.min.js">poly.min.js</a> includes everything need except shadow poly code.
					</p>
					<ul>
						<li>customElements</li>
						<li>DocumentFragment</li>
						<li>URL, Promise, fetch</li>
						<li>HTMLTemplateElement</li>
						<li>Event, CustomEvent, MouseEvent constructors and Object.assign, Array.from</li>
					</ul>
				</li>
				<li>
					<p>
						<a href="https://github.com/vokeio/oxe/blob/master/dst/poly.shadow.min.js">poly.shadow.min.js</a> includes everything.
					</p>
					<ul>
						<li>Webcomponentsjs</li>
						<li>DocumentFragment</li>
						<li>URL, Promise, fetch</li>
					</ul>
				</li>
			</ul>

			<strong>Install</strong>
			<ul>
				<li><i>npm install oxe --save</i></li>
				<li>UMD <i>"dst/oxe.min.js"</i></li>
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
