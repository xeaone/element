**Beta API Can Change**

# Oxe
A mighty tinny web components framework/library.

## Features
- Really Small 8.09KB gzipped and 27.08KB uncompressed
- In browser ES6/ESM module and template strings support

## Support
- IE10~
- IE11
- Chrome
- Firefox
- Safari 7
- Mobile Safari
- Chrome Android

## Note
Loader uses `XHR` and `new Function` to load on-demand and execute modules. If your worried about security please read the linked articles. In summary the articles support not using new Function/eval to process client input. So as long as your only importing local modules (Loader enforces this) then the safety concern is eliminated.

**Resources:**
- http://2ality.com/2014/01/eval.html
- https://www.nczonline.net/blog/2013/06/25/eval-isnt-evil-just-misunderstood/


## Install
- `npm i oxe --save`
- UMD `dist/oxe.min.js`
- UMD with Web Component Pollyfill `dist/oxe.polly.min.js`
- Web Component Pollyfill `dist/webcomponents-lite.min.js`

## Example
```js
	Oxe.component.define({
		name: 'v-home',
		html: `
			<h1 o-text="title"></h1>
		`,
		model: {
			title: 'Old Title'
		},
		created: function () {
			this.model.title = 'New Title';
		}
	});
```
```js
Oxe.setup({
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
				url: '/components/e-menu.js'
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
```
```html
<html>
<head>
	<base href="/">
	<script src="oxe.min.js" defer></script>
	<script src="index.js" defer></script>
</head>
<body>
	<e-menu>
		<ul>
			<li><a href="/home">Home</a></li>
		</ul>
	</e-menu>
	<o-view></o-view>
</body>
</html>
```

## API

### Oxe.setup(options)
The recommend entry point. This allows you to setup Oxe and automatically starts the router
- `options: Object`
	- `http: Object` Oxe.http options.
	- `loader: Object` Oxe.loader options.
	- `router: Object` Oxe.router options.

### Oxe.component
- `define: Function` Defines a custom web component
	- `options: Object`
		- `name: String` **Required** the tag name
		- `html: String` An HTML string
		- `query: String` An querySelector
		- `template: Element` A Element
		- `model: Object<Any>` See Oxe.controller.model
		- `events: Object<Function>` See Oxe.controller.events
		- `modifiers: Object<Function>` See Oxe.controller.modifiers
		- `created: Function` Triggered once on DOM creation
		- `attached: Function` Triggered on each DOM attachment
		- `detached: Function` Triggered on each DOM detachment
		- `attributed: Function` Triggered attribute change

### Oxe.router
Automatically use the default action for non origin matching hrefs
- `options: Object`
	- `hash: Boolean` Hash URL mode. Default is false
	- `trailing: Boolean` Trailing slash. Default is false
	- `base: Boolean, String` Sets the base if its a string otherwise if true uses the predefined base
	- `external: String, RegExp, Function` Filters URL requests. If true or match Oxe.router will not handle request
	- `container: Element` Contains all href clicks to the container. Default is window. Good for embedding especially
	- `routes: Array`
		- `route: Object`
			- `path: String` Any path.
				- `parameters: String` Named '/account/{user}', or catchalls '{\*}'
			- `title: String` The title for the page
			- `component: String` The name of a component to insert into o-view
			- `url: Object, String` URL path to JS web-component or a Oxe.loader.load Object

- `run: Function` Must be called after <o-view></o-view> is created
- `redirect: Function` Uses window.location.href which is treated like a 301 redirect for SEO
- `add: Function`
	- `path: String`
- `remove: Function`
	- `path: String`
- `get: Function`
	- `path: String` Exact path matching, route path variables are not taken into account
- `find: Function`
	- `path: String` Approximate path matching, route path variables are taken into account
- `navigate: Function` Navgiates to path
	- `path: String` Path to navigate
- `on: EventEmitter`
	- `navigated: Event`

### Oxe.loader
ES6 import and export module support. Imports must be absolute from the domain. Also `export default` is the only export format supported. Please do not use Loader.interpret to handle user input.
- `options: Object`
	- `esm: Boolean` Enables ES6 module re-writes
	- `est: Boolean` Enables ES6 template string re-writes
	- `loads: Array<Object, String>` Adds load objects or strings such as non route components
		- `load: Object, String`
			- `url: String` Path to a web component JS url
			- `esm: Boolean` Enables ES6 module re-writes on individually
			- `est: Boolean` Enables ES6 template string re-writes individually

### Oxe.http
- `options: Object`
	- `request: Function` Intercepts the request. If the return value is false the fetch will not be triggered
		- `xhr: Object` The xhr going to be used for the request.
		- `opt: Object` The options going to be used for the request.
		- `data: Object|String` The data to be sent as either payload or parameters.
	- `response: Function` Intercepts the request. If the return value is false the fetch success and error will not be triggered
		- `statusCode: Number` The xhr.status.
		- `statusText: String` The xhr.statusText.
		- `xhr: Object` The xhr used for the request.
		- `opt: Object` The options used for the request.
		- `data: Object|String` The response transformed by resonseType.
	- `mime: Object`
	- `serialize: Function`
	- `fetch: Function` A fetch request.
		- `options: Object`
			- `username: String`
			- `password: String`
			- `withCredentials: Boolean`
			- `method: String` (default: GET)
			- `cache: Boolean` (default: false)
			- `url: String` (default: window.location.href)
			- `error: Function` The Error Handler
				- `result: Object`
					- `statusCode: Number` The xhr.status.
					- `statusText: String` The xhr.statusText.
					- `xhr: Object` The xhr used for the request.
					- `opt: Object` The options used for the request.
					- `data: Object|String` The response transformed by resonseType.
			- `success: Function` The Success handler
				- `result: Object`
					- `statusCode: Number` The xhr.status.
					- `statusText: String` The xhr.statusText.
					- `xhr: Object` The xhr used for the request.
					- `opt: Object` The options used for the request.
					- `data: Object|String` The response transformed by resonseType.
			- `data: Object` If method is GET than data is concatenated to the url as parameters.
			- `type: String` A shortcut for setting the contentType, acceptType, and responseType. Example setting the value to 'json' will set the `contentType=application/json, text/json, text/plain`, `acceptType=application/json, text/json, text/plain`, and `responseType=json`.
			- `contentType: String` The header Content-Type of the data being posted to the server. (default: text)
				- `*` Any string
				- `xml` 'text/xml; charset=utf-8'
				- `text` 'text/text; charset=utf-8'
				- `html` 'text/html; charset=utf-8'
				- `json` 'application/json; charset=utf-8'
				- `js` 'application/javascript; charset=utf-8'
			- `acceptType: String` The header Accept type to expect from the server. (default: text)
				- `*` Any string
				- `xml` 'text/xml; charset=utf-8'
				- `text` 'text/text; charset=utf-8'
				- `html` 'text/html; charset=utf-8'
				- `json` 'application/json; charset=utf-8'
				- `js` 'application/javascript; charset=utf-8'
			- `responseType: String` [XMLHttpRequest.responseType](https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/responseType). Added json support for non supported browsers. Blob support for older browsers is still needed. (default: text)
				- `*` Any string
				- `arraybuffer`
				- `document`
				- `blob`
				- `json`
				- `text`
			- `mimeType: String` Override the MIME type of the response.
			- `headers: Object` A Map of String to be directly applied to the the XHR header.

### Oxe.global
A global object for you.

### Oxe.query(String: querySelector)
The result of a querySelector in the **current** document `document.currentScript.ownerDocument.querySelector()`

- Returns: `document.currentScript.ownerDocument.querySelector()`

### Oxe.script()
- Returns: `document.currentScript`

### Oxe.document()
- Returns: `document.currentScript.ownerDocument`

## Authors
- [AlexanderElias](https://github.com/AlexanderElias)

## License
[Why You Should Choose MPL-2.0](http://veldstra.org/2016/12/09/yoo-should-choose-mpl2-for-your-opensource-project.html)
This project is licensed under the MPL-2.0 License
