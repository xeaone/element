
# Oxe
A mighty tiny web components framework/library.
<!-- Command line interface moved to [oxe-cli](https://github.com/vokeio/oxe-cli). -->

### API
Api documentation can be found at [API.md](https://github.com/vokeio/oxe/blob/master/API.md).

### VERSION
Breaking version changes can be found at [VERSION.md](https://github.com/vokeio/oxe/blob/master/VERSION.md).

### Features
- Small size
- Front end routing
- Configuration based
- Dynamic import polyfill
- Template string polyfill
- In browser Template and Import/Export rewrites

### Polyfill
- [poly.min.js](https://github.com/vokeio/oxe/blob/master/dst/poly.min.js) includes everything need except shadow poly code.
	- customElements
	- DocumentFragment
	- URL, Promise, fetch
	- HTMLTemplateElement
	- Event, CustomEvent, MouseEvent constructors and Object.assign, Array.from
- [poly.shadow.min.js](https://github.com/vokeio/oxe/blob/master/dst/poly.shadow.min.js) includes everything.
	- Webcomponentsjs
	- DocumentFragment
	- URL, Promise, fetch


### Support
- IE10~
- IE11
- Chrome
- Firefox
- Safari 7
- Mobile Safari
- Chrome Android

### Overview
Live examples [vokeio.github.io/oxe/](https://vokeio.github.io/oxe/).

### Install
- `npm i oxe --save`
- Script `dst/poly.min.js`
- UMD `dst/oxe.min.js`

## Example
```js
// home.js

export default {
	path: '/',
	title: 'Home',
	component: {
		name: 'r-home',
		template: `
			<h1 o-text="title"></h1>
			<button o-on-click="greet">Greet</button>
		`,
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
```
```js
// index.js

import './elements/e-menu.js';
import Home from './home.js';

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
```
```html
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
```

## Author
[vokeio](https://github.com/vokeio)

## License
[Why You Should Choose MPL-2.0](http://veldstra.org/2016/12/09/you-should-choose-mpl2-for-your-opensource-project.html)
This project is licensed under the MPL-2.0 License
