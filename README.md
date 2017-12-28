**Beta API Can Change**

# Oxe
A mighty tinny web components framework/library.

### Features
- Small
- Robust
- Routing
- Auth handling
- Module loading
- In browser ES6/ESM Module and Template String pollyfill support (only export default)

### Support
- IE10~
- IE11
- Chrome
- Firefox
- Safari 7
- Mobile Safari
- Chrome Android

### Overview
Live examples [https://alexanderelias.github.io/oxe/](https://alexanderelias.github.io/oxe/).

Loader uses XHR and new Function to load modules on-demand. If your worried about security please read the linked articles. In summary it is okay to use new Function/eval but only if your not to trying to process client input. So as long as your only importing your packages/modules then any safety concern is eliminated.

**Resources:**
- http://2ality.com/2014/01/eval.html
- https://www.nczonline.net/blog/2013/06/25/eval-isnt-evil-just-misunderstood/


### Install
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
	},
	loader: {
		type: 'es', // Enables ES6 module and template string re-write support
		loads: [
			'/components/e-menu.js'
		]
	},
	router: {
		auth: true, // enables keeper for all routes
		routes: [
			{
				auth: false, // individually disable/eneable auth
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
- location
- ownerDocument
- currentScript
- document
- window
- head
- body
- global

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
		- `shadow: Boolean` **Default: false** uses shadow DOM
		- `name: String` **Required** the tag name
		- `html: String` An HTML string
		- `template: Element` A Element
		- `query: String` Attempts currentScript.ownerDocument otherwise will use the document
		- `model: Object<Any>` See Oxe.controller.model
		- `events: Object<Function>` See Oxe.controller.events
		- `modifiers: Object<Function>` See Oxe.controller.modifiers
		- `properties: Object` Property descriptors added to the element prototype
		- `created: Function` Triggered once on DOM creation
		- `attached: Function` Triggered on each DOM attachment
		- `detached: Function` Triggered on each DOM detachment
		- `attributed: Function` Triggered attribute change

### Oxe.loader
ES6 import and export module support. Currently `export default` is the only import/export format supported. Can handle css file loading.
- `options: Object`
	- `type: String` The method in which the loader will load files.
		- `module` Appends a module script tag **default**
		- `script` Appends a standard script tag
		- `es` Enables ES6 module and template string re-writes uses XHR
		- `esm` Enables ES6 module re-writes uses XHR (Note: default export/import only)
		- `est` Enables ES6 template string re-writes uses XHR (Note: Any backtick will be re-writen)
	- `loads: Array<Object, String>` Adds load objects or strings such as non route components
		- `load: Object, String`
			- `url: String` Path to file resources
			- `type: String` If not defined uses the default type
- `setup: Function`
	- `options: Object` Accepts the above options
- `load: Function`

### Oxe.keeper
Keeper is an auth module. It can handle the sign-in, sigh-out, Fetcher request, and Router changes.
- `options: Object`
	- `type: String` Token storage type
		- `local`
		- `session`
	- `scheme: String` (default: bearer) Any valid authentication scheme
	- `forbidden: String, Function` If string Router.navigate other wise call the function
	- `unauthorized: String, Function` If string Router.navigate other wise call the function
	- `authenticated: String, Function` If string Router.navigate other wise call the function
	- `unauthenticated: String, Function` If string Router.navigate other wise call the function
- `setup: Function`
	- `options: Object` Accepts the above options
- `token: String` Readable only token
- `user: String` Readable only user
- `setToken: String` Sets the token
- `setUser: Object` Sets the user
- `removeToken: String` Removes the token
- `removeUser: String` Removes the user
- `authenticate: Function` Adds a token
	- `token: String` The token to add
	- `user: Object` The user data to add
- `unauthenticate: Function` Removes the token and user data
- `encode: Function` Wraps window.btoa
- `decode: Function` Wraps window.atob

### Oxe.router
Automatically use the default action for non origin matching hrefs
- `options: Object`
	- `auth: Boolean` (default: false) Enables Oxe.Keeper
	- `hash: Boolean` (default: false) Hash URL mode
	- `trailing: Boolean` (default: false) Trailing slash
	- `external: String, RegExp, Function` Filters URL requests. If true or match Oxe.router will not handle request
	- `container: Element` Contains all href clicks to the container. Default is window. Good for embedding especially
	- `routes: Array`
		- `route: Object`
			- `auth: Boolean` (default: false) Enables Oxe.Keeper
			- `path: String` Any path.
				- `parameters: String` Named '/account/{user}', or catchalls '{\*}'
			- `title: String` The title for the page
			- `handler: Function` Overrieds the default render method
			- `component: String` The name of a component to insert into o-view
			- `url: Object, String` URL path to JS web-component or a Oxe.loader.load Object
- `setup: Function`
	- `options: Object` Accepts the above options
- `location: Object` Similar to imitates window.location but for the Router
	- `base: String` Base href or origin
	- `hash: String`
	- `href: String`
	- `host: String`
	- `route: Object` The current route
	- `title: String`
	- `query: Object` Key value pairs of search/query
	- `origin: String`
	- `search: String`
	- `basename: String` Base without the origin
	- `hostname: String`
	- `pathname: String` A pathname even when using hash urls
	- `protocol: String`
	- `username: String`
	- `password: String`
	- `parameters: Object` Key value pairs of the route params (dynamic route paths)
- `run: Function` Must be called after <o-view></o-view> is created
- `render: Function` Will render a route object it is usefull if your using route has a handler
- `redirect: Function` Uses window.location.href which is treated like a 301 redirect for SEO
	- `path: String`
- `add: Function`
	- `path: String`
- `remove: Function`
	- `path: String`
- `get: Function`
	- `path: String` Strict path matching, route path variables are not taken into account
- `find: Function`
	- `path: String` Loose path matching, route path variables, url base, and hash urls, are taken into account
- `navigate: Function` Navgiates to path
	- `path: String` Path to navigate
	- `options: Object`
		- `replace: Boolean` (deafult: false) replace or push state
		- `query: Object` Converts a key value pair to a query/search string and appends to the path
- `on: EventEmitter`
	- `navigated: Event`

### Oxe.fetcher
Uses XHR
- `options: Object`
	- `auth: Boolean` Enables Oxe.Keeper (default: false)
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
- `setup: Function`
	- `options: Object` Accepts Fetcher options
- `fetch: Function` A fetch request.
	- `options: Object`
		- `username: String`
		- `password: String`
		- `withCredentials: Boolean`
		- `method: String` (default: GET)
		<!-- - `cache: Boolean` (default: false) -->
		- `url: String` (default: window.location.href)
		- `success: Function` The Success handler
			- `result: Object`
				- `statusCode: Number` The xhr.status
				- `statusText: String` The xhr.statusText
				- `xhr: Object` The xhr used for the request
				- `opt: Object` The options used for the request
				- `data: Object|String` The response transformed by resonseType
		- `error: Function` The Error Handler
			- `result: Object`
				- `statusCode: Number` The xhr.status
				- `statusText: String` The xhr.statusText
				- `xhr: Object` The xhr used for the request
				- `opt: Object` The options used for the request
				- `data: Object|String` The response transformed by resonseType
		- `handler: Function` Called if no success or error handler
			- `result: Object` The result
				- `statusCode: Number` The xhr.status
				- `statusText: String` The xhr.statusText
				- `xhr: Object` The xhr used for the request
				- `opt: Object` The options used for the request
				- `data: Object|String` The response transformed by resonseType
				- `error: Boolean` If status >= 200 && status < 300 || status == 304 will be false otherwise true
		- `data: Object` If method is GET than data is concatenated to the url as parameters
		- `type: String` A shortcut for setting the contentType, acceptType, and responseType
		- `contentType: String` (default: text) The header Content-Type of the data being posted to the server
			- `*` Any string
			- `xml` 'text/xml; charset=utf-8'
			- `text` 'text/text; charset=utf-8'
			- `html` 'text/html; charset=utf-8'
			- `json` 'application/json; charset=utf-8'
			- `js` 'application/javascript; charset=utf-8'
		- `acceptType: String` The header Accept type to expect from the server (default: text)
			- `*` Any string
			- `xml` 'text/xml; charset=utf-8'
			- `text` 'text/text; charset=utf-8'
			- `html` 'text/html; charset=utf-8'
			- `json` 'application/json; charset=utf-8'
			- `js` 'application/javascript; charset=utf-8'
		- `responseType: String` Blob support for older browsers is still needed (default: text)
			- `*` Any string
			- `arraybuffer`
			- `document`
			- `blob`
			- `json`
			- `text`
		- `mimeType: String` Override the MIME type of the response
		- `headers: Object` A Map of String to be directly applied to the the XHR header
- `get: Function`
	- `options: Object` Uses fetch options
- `put`
	- `options: Object` Uses fetch options
- `post: Function`
	- `options: Object` Uses fetch options
- `head: Function`
	- `options: Object` Uses fetch options
- `delete: Function`
	- `options: Object` Uses fetch options
- `patch: Function`
	- `options: Object` Uses fetch options
- `options: Function`
	- `options: Object` Uses fetch options
- `connect: Function`
	- `options: Object` Uses fetch options
- `mime: Object`
- `serialize: Function`

### Oxe.location
Alias for `Oxe.router.location`

### Oxe.ownerDocument
Alias for `window.document.currentScript.ownerDocument`

### Oxe.currentScript
Alias for `window.document.currentScript`

### Oxe.document
Alias for `window.document`

### Oxe.window
Alias for `window`

### Oxe.head
Alias for `window.document.head`

### Oxe.body
Alias for `window.document.body`

### Oxe.global
A global object for you

## Authors
[AlexanderElias](https://github.com/AlexanderElias)

## License
[Why You Should Choose MPL-2.0](http://veldstra.org/2016/12/09/you-should-choose-mpl2-for-your-opensource-project.html)
This project is licensed under the MPL-2.0 License
