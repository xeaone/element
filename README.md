# Jenie

**Beta API Can Change**
The Web Components Framework/Library

**1.5 Breaking Changes**
- Jenie.module replaced with loader and es6 module support

**1.4 Breaking Changes**
- Jenie.router.route.componentUrl changed to Jenie.router.route.load
- Jenie.router.contain removed and changed to Jenie.router.container<Element>
- Jenie.router.external<String> no longer converts to RegExp
- removed Jenie.component.template as comment.
- j-on binder events have been moved from Jenie.controller.model to  Jenie.controller.events.

**Use NPM for the latest stable version**

## Support
- IE10~
- IE11
- Chrome
- Firefox
- Safari 7
- Mobile Safari
- Chrome Android

## Install
- `npm install jenie --save`
- UMD `dist/jenie.min.js`
- UMD with Web Component Pollyfill `dist/jenie.polly.min.js`
- Web Component Pollyfill `dist/webcomponents-lite.min.js`

## Example

```JavaScript
	Jenie.component({
		name: 'v-home',
		template: `
			<h1 j-text="title"></h1>
		`,
		model: {
			title: 'Old Title'
		},
		created: function () {
			this.model.title = 'New Title';
		}
	});
```

```JavaScript
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
		esm: true,
		loads: [

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
```

```html
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
```

## API

### Jenie.component(options)
Returns a new Jenie web component and defines/registers a custom web component.
- `options: Object`
	- `name: String` **Required** the tag name
	- `file: String` path to JS component script.
	- `template: Element, String, Query` **Required**
	- `model: Object<Any>` See Jenie.controller.model
	- `events: Object<Function>` See Jenie.controller.events
	- `modifiers: Object<Function>` See Jenie.controller.modifiers
	- `created: Function` Triggered once on creation.
	- `attached: Function` Triggered on each DOM attachment.
	- `detached: Function` Triggered on each DOM detachment.
	- `attributed: Function` Triggered attribute change.

### Jenie.setup(options)
The recommend entry point. This allows you to setup Jenie and automatically starts the router
- `options: Object`
	- `http: Object` Jenie.http options.
	- `loader: Object` Jenie.loader options.
	- `router: Object` Jenie.router options.

### Jenie.router
- `options: Object`
	- `hash: Boolean` Hash URL mode. Default is false.
	- `trailing: Boolean` Trailing slash. Default is false.
	- `external: String, RegExp, Function` Filters URL requests. If true or match Router will not handle request.
	- `container: Element` Sets the event listeners for HREFs to the container. Default is window. Jenie use event delegation.
	- `routes: Array`
		- `route: Object`
		- `title: String` The title for the page.
		- `component: String` The name of a component.
		- `file: String, Object` A path or LoadObject to a component JS file (Uses loader).
			- `path: String` Any path.
				- `parameters: String` Named '/account/{user}', or catchalls '{\*}',

- `run: Function` Must be called after <j-view></j-view> is created
- `redirect: Function` Uses window.location.href which is treated like a 301 redirect for SEO.
<!-- - `findRoutes: Function`
- `route.path: RegExp` -->
- `add: Function`
	- `path: String`
- `remove: Function`
	- `path: String`
- `get: Function`
	- `path: String` Exact path matching, route path variables are not taken into account.
- `find: Function` Approximate path matching, route path variables are taken into account.
	- `path: String`
- `navigate: Function` Changes to a new page.
	- `path: String` Path to navigate.
- `on: EventEmitter`
	- `navigated: Event`

### Jenie.loader
ES6 import export support. Imports must be absolute from the domain (for now). Also `export default` is the only export format supported (for now). Please do not use Loader.interpret to handle user input.
- `options: Object`
	- `esm: Boolean` enable es6 module support for scripts.
	- `loads: Array<Object, String>`

### Jenie.http
- `options: Object`
	- `request: Function` Intercepts the request. If the return value is false the fetch will not be triggered.
		- `options: Object`
		- `xhr: Object`
	- `response: Function` Intercepts the request. If the return value is false the fetch success and error will not be triggered.
		- `options: Object`
		- `xhr: Object`

- `mime: Object`
- `serialize: Function`
- `fetch: Function` A fetch request.
	- `options: Object`
		- `action: String` Resource action url. **Required**
		- `success: Function` **Required** The fetch response.
		- `error: Function` **Required** The fetch response.

		- `method: String` Valid methods get, post, put, delete
		- `data: Object` If method is `GET` than data is concatenated to the `action/url` as parameters.

		- `requestType: String` Converts the request data before sending.
			- `script` 'text/javascript, application/javascript, application/x-javascript'
			- `json` 'application/json' stringify `options.data`
			- `xml` 'application/xml, text/xml'
			- `html` 'text/html'
			- `text` 'text/plain'
			- DEFAULT 'application/x-www-form-urlencoded' serialized `options.data`

		- `responseType: String` Converts the response data after sending.
			- `script` 'text/javascript, application/javascript, application/x-javascript'
			- `json` 'application/json'
			- `xml` 'application/xml, text/xml'
			- `html` 'text/html'
			- `text` 'text/plain'

		- `contentType: String` Short hand to set the Content-Type Headers. (For request)
		- `accept: String` Short hand to set the Accept Headers. (For response)

		- `mimeType: String` Overwrites return type.
		- `username: String`
		- `password: String`
		- `withCredentials: Boolean`
		- `headers: Object` A low level headers object it will map directly to the XHR header. The Will overwrite any above options.

### Jenie.controller(options, callback)
Returns an instance of a new controller.
- `options: Object`
	- `name`
	- `view`
	- `events: Object<Function>` j-on-[event name]= binder
	- `modifiers: Object<Function>` j-[\*]="\* | modifier name"
	- `model` Copies the provided and observes it's properties. Setting a property to `undefined` will delete or splice it's self.
		- `Array` Object to be observed.
			- `splice` Triggers the callback.
			- `push` Triggers the callback.
			- `shift` Triggers the callback.
			- `pop` Triggers the callback.
			- `unshift` Triggers the callback.
		- `Object` Object to be observed.
			- `$remove` Function attached deep removes/deletes a property and triggers the callback.
			- `$set` Function attached deeply sets or adds a new property to be observed triggers the callback.
		- `Function` Async return of the model. Argument provided `resolve(Object: model)`.
- `callback: Function`

### Jenie.global
A global object for you.

### Jenie.query(String: querySelector)
The result of a querySelector in the **current** document `document.currentScript.ownerDocument.querySelector()`

- Returns: `document.currentScript.ownerDocument.querySelector()`

### Jenie.script()
- Returns: `document.currentScript`

### Jenie.document()
- Returns: `document.currentScript.ownerDocument`


## Authors
**Alexander Elias** - [AlexanderElias](https://github.com/AlexanderElias)

## License
This project is licensed under the MPL-2.0 License - [LICENSE.md](LICENSE.md)
[Why You Should Cheose MPL-2.0](http://veldstra.org/2016/12/09/you-should-choose-mpl2-for-your-opensource-project.html)
