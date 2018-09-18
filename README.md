
# Oxe
A mighty tiny web components framework/library.
Command line interface moved to [oxe-cli](https://github.com/AlexanderElias/oxe-cli).

### API
Api documentation can be found at [API.md](https://github.com/AlexanderElias/oxe/blob/master/API.md).

### VERSION
Breaking version changes can be found at [VERSION.md](https://github.com/AlexanderElias/oxe/blob/master/VERSION.md).

### Features
- Small size
- Front end routing
- Optional module loading
- In browser ES6/ESM module rewrites
- In browser Template string rewrites
- Automatic conditional pollyfills [web components v0](https://cdnjs.cloudflare.com/ajax/libs/document-register-element/1.7.2/document-register-element.js) [fetch, Promise, Object.assign](https://cdn.polyfill.io/v2/polyfill.min.js?features=fetch,Promise,Object.assign)

### Support
- IE10~
- IE11
- Chrome
- Firefox
- Safari 7
- Mobile Safari
- Chrome Android

### Overview
Live examples [alexanderelias.github.io/oxe/](https://alexanderelias.github.io/oxe/).

### Install
- `npm i oxe --save`
- UMD `dst/oxe.min.js`
- UMD with Web Component Pollyfill `dst/oxe.polly.min.js`
- Web Component Pollyfill `dst/webcomponents-lite.min.js`

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
```
```html
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
```

## Authors
[AlexanderElias](https://github.com/AlexanderElias)

## License
[Why You Should Choose MPL-2.0](http://veldstra.org/2016/12/09/you-should-choose-mpl2-for-your-opensource-project.html)
This project is licensed under the MPL-2.0 License
