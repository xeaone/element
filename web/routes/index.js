import Code from '../modules/code.js';
import Say from '../modules/say.js';

const { Component } = Oxe;

const componentCode = Code(`
// my-component.js

const { Component } = Oxe;

export default MyComponent extends Component {
    static attributes = []
    adopt = false
    shadow = false
    css = '
    '
    html = \`
    < h1 > {{ title }}</h1 >
        <button onclick="{{greet()}}">Greet</button>;
    \`
    data = {
        greeting: '',
        greet () { this.greeting = 'Hola Mundo'; }
    }
    async adopted () {}
    async attributed () {}
    async disconnected () {}
    async connected () {
        this.data.greeting = 'Hello World';
    }
}
`, true);

var indexRoute = Code(`
    // routes/index.js

    const { Component } = Oxe;

	export default Index extends Component {
		title = 'Index Route'
        description = 'Index Description'
		html = \`<my-component></my-component>\`
        async connected () {
            console.log('route connected');
        }
	}
`, true);

var indexJs = Code(`
    // index.js

    await Oxe.define([
        './my-component.js'
    ]); // or import module and use window.customElements.define();

	await Oxe.router.setup({
		target: 'main',
		folder: 'routes'
    }); // or import module and use window.customElements.define();
`);

var indexHtml = Code(`
    <!-- index.html -->
	<html>
	<head>
		<script src="/oxe.min.js" defer></script>
		<script src="/index.js" defer></script>
	</head>
	<body>
		<main></main>
	</body>
	</html>
`);

export default class IndexRoute extends Component {

    async connected () { Say('index connected'); }

    title = 'Oxe';
    description = 'A mighty tiny web components framework/library.';

    html = /*html*/`
	<h2>Overview</h2>

	<strong>Synopsis</strong>
	<p>A mighty tiny web components framework that should feel like your using native JS and HTML to write and bind Custom Elements.</p>

	<strong>Project Goal</strong>
	<ul>
		<li>Easy learning curve</li>
		<li>Feels like JS and HTML not a framework</li>
	</ul>

	<strong>Feature Highlight</strong>
	<ul>
		<li>Zero config smart front end routing</li>
		<li>Dynamic ES6/ESM module rewrites (Use ES6 modules in browsers that don't have native support)</li>
		<li>Dynamic Template string rewrites (Use template strings in browsers that don't have native support)</li>
	</ul>

	<strong>Polyfill You Might Need</strong>
	<ul>
        <li>customElements</li>
        <li>URL, Promise, fetch</li>
        <li>HTMLTemplateElement</li>
        <li>Event, CustomEvent</li>
    </ul>

	<strong>Browser Support</strong>
	<ul>
		<li>IE11~</li>
		<li>Chrome</li>
		<li>Firefox</li>
		<li>Safari 7</li>
		<li>Mobile Safari</li>
		<li>Chrome Android</li>
	</ul>

	<strong>Install</strong>
	<ul>
		<li><i>npm install oxe --save</i></li>
		<li>UMD <i>"pro/oxe.min.js"</i></li>
	</ul>

	<h2>Component Example</h2>
	<pre>${componentCode}</pre>

	<h2>Route Example</h2>
	<pre>${indexRoute}</pre>
    <br>
	<pre>${indexJs}</pre>
    <br>
	<pre>${indexHtml}</pre>
	`;

}
