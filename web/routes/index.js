import Code from '../modules/code.js';
import Say from '../modules/say.js';

const { Component } = Oxe;

var home = Code(`
	// routes/index.js

	export default {
		title: 'Home',
		html: \`
			<h1>{{title}}</h1>
			<button onclick="{{greet()}}">Greet</button>
		\`,
		data: {
			greeting: 'Old Hello World',
			greet () {
				console.log(this.data.greeting);
			}
		},
		created () {
			this.data.greeting = 'New Hello World';
		}
	};

`, true);

var indexjs = Code(`
	// index.js

	Oxe.location.listen({
		target: 'main',
		folder: 'routes'
	});

`);

var indexhtml = Code(`
	<!-- index.html -->
	<html>
	<head>

		<base href="/">
		<script src="./poly.min.js" defer></script>
		<script src="./oxe.min.js" defer></script>

	</head>
	<body>

		<e-menu>
			<ul>
				<li><a href="/home">Home</a></li>
			</ul>
		</e-menu>

		<main></main>

	</body>
	</html>
`);

export default class IndexRoute extends Component {

	title = 'Oxe';
	description = 'A mighty tiny web components framework/library.';

	async connected () {
		Say('index connected');
	}

	html = /*html*/`
		<h2>Overview</h2>

		<strong>Synopsis</strong>
		<p>A mighty tiny web components framework/library.</p>

		<strong>Features</strong>
		<ul>
			<li>Small file size</li>
			<li>Simple smart front end routing</li>
			<li>Dynamic ES6/ESM module rewrites</li>
			<li>Dynamic Template string rewrites</li>
		</ul>

		<strong>Support</strong>
		<ul>
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
					<a href="https://github.com/vokeio/oxe/blob/master/dst/poly.min.js">poly.min.js</a> includes everything need except shadow poly code.
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
	`;

}
