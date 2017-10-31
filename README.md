**Beta API Can Change**

# Oxe
A mighty tinny web components framework/library.

## Features
- Routing
- Module loading system
- Authorization handling
- Really Small 8.09KB gzipped and 27.08KB uncompressed
- In browser ES6/ESM module and template strings support (currently only supporting export default)

## Support
- IE10~
- IE11
- Chrome
- Firefox
- Safari 7
- Mobile Safari
- Chrome Android

## Note
Loader uses `XHR` and `new Function` to load modules on-demand. If your worried about security please read the linked articles. In summary it is okay to use new Function/eval but only if your not to trying to process client input. So as long as your only importing your packages/modules then any safety concern is eliminated.

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
	keeper: {
		unauthorized: '/sign-in', // string or function
	},
	fetcher: {
		auth: true, // enables keeper for all fetches
		request: function (opt, xhr) {
			return true; // false will cancel the fetcher.fetch
		},
		response: function (opt, xhr) {
			return true; // false will cancel the fetcher.fetch handlers
		}
	},
	loader: {
		esm: true, // Enables ES6 module re-writes support for all loads
		est: true, // Enables ES6 template string re-writes support for all loads
		loads: [
			{
				url: '/components/e-menu.js'
			}
		]
	},
	router: {
		auth: true, // enables keeper for all routes
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

- setup
- component
- loader
- keeper
- router
- fetcher
- global
- query
- script
- document

### Oxe.setup(options)
The recommend entry point. This allows you to setup Oxe and automatically starts the router
- `options: Object`
	- `loader: Object` Oxe.loader options
	- `keeper: Object` Oxe.keeper options
	- `router: Object` Oxe.router options
	- `fetcher: Object` Oxe.fetcher options

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
- `setup: Function`
	- `options: Object` Accepts the above options
- `load: Function`

### Oxe.keeper
Keeper is an auth module. It can handle the sign-in, sigh-out, Fetcher request, and Router changes.
- `options: Object`
	- `type: String` Token storage type
		- `local`
		- `session`
	- `scheme: String` Any valid authentication scheme
		- `bearer`
		- `basic` Will encode the string
	- `forbidden: String, Function` If string Router.navigate other wise call the function
	- `unauthorized: String, Function` If string Router.navigate other wise call the function
	- `authenticate: String, Function` If string Router.navigate other wise call the function
	- `unauthenticate: String, Function` If string Router.navigate other wise call the function
- `setup: Function`
	- `options: Object` Accepts the above options
- `token: String` Readable only token
- `authenticate: Function` Adds a token
	- `token: String` The token to add
- `unauthenticate: Function` Remove a token

### Oxe.router
Automatically use the default action for non origin matching hrefs
- `options: Object`
	- `auth: Boolean` (default: false) Enables Oxe.Keeper
	- `hash: Boolean` (default: false) Hash URL mode
	- `trailing: Boolean` (default: false) Trailing slash
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
- `setup: Function`
	- `options: Object` Accepts the above options
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

### Oxe.fetcher
- `options: Object`
	- `auth: Boolean` (default: false) Enables Oxe.Keeper
	- `request: Function` Intercepts the request if the return value is false the fetch will not continue
		- `xhr: Object` The xhr going to be used for the request
		- `opt: Object` The options going to be used for the request
		- `data: Object|String` The data to be sent as either payload or parameters
	- `response: Function` Intercepts the request if the return value is false the fetch will not continue
		- `statusCode: Number` The xhr.status
		- `statusText: String` The xhr.statusText
		- `xhr: Object` The xhr used for the request
		- `opt: Object` The options used for the request
		- `data: Object|String` The response transformed by resonseType
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
					- `statusCode: Number` The xhr.status
					- `statusText: String` The xhr.statusText
					- `xhr: Object` The xhr used for the request
					- `opt: Object` The options used for the request
					- `data: Object|String` The response transformed by resonseType
			- `success: Function` The Success handler
				- `result: Object`
					- `statusCode: Number` The xhr.status
					- `statusText: String` The xhr.statusText
					- `xhr: Object` The xhr used for the request
					- `opt: Object` The options used for the request
					- `data: Object|String` The response transformed by resonseType
			- `data: Object` If method is GET than data is concatenated to the url as parameters
			- `type: String` A shortcut for setting the contentType, acceptType, and responseType
			- `contentType: String` (default: text) The header Content-Type of the data being posted to the server
				- `*` Any string
				- `xml` 'text/xml; charset=utf-8'
				- `text` 'text/text; charset=utf-8'
				- `html` 'text/html; charset=utf-8'
				- `json` 'application/json; charset=utf-8'
				- `js` 'application/javascript; charset=utf-8'
			- `acceptType: String` (default: text) The header Accept type to expect from the server
				- `*` Any string
				- `xml` 'text/xml; charset=utf-8'
				- `text` 'text/text; charset=utf-8'
				- `html` 'text/html; charset=utf-8'
				- `json` 'application/json; charset=utf-8'
				- `js` 'application/javascript; charset=utf-8'
			- `responseType: String` (default: text) Blob support for older browsers is still needed
				- `*` Any string
				- `arraybuffer`
				- `document`
				- `blob`
				- `json`
				- `text`
			- `mimeType: String` Override the MIME type of the response
			- `headers: Object` A Map of String to be directly applied to the the XHR header
- `setup: Function`
	- `options: Object` Accepts the above options

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
