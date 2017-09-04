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
- Web Component Pollyfill included UMD `dist/jenie.polly.min.js`
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

```html
<html>
<head>
	<base href="/">
	<script src="jenie.min.js" defer></script>
</head>
<body>
	<j-view></j-view>
	<script>
		Jenie.setup({
			http: {
				request: function (fetchOptions) {
					return true; // false will cancel the http.fetch
				},
				response: function (fetchOptions, xhrResponse) {
					return true; // false will cancel the http.fetch handlers
				}
			},
			loader: {
				esm: true
			},
			router: {
				routes: [
					{
						path: '/',
						component: 'v-home',
						file: 'views/v-home.js'
					}
				]
			}
		});

	</script>
</body>
</html>
```

## API

### Jenie.setup(options)
The recommend entry point. This allows you to setup Jenie and automatically starts the router.

- `options: Object`
	- `http: Object` Jenie.http options.
	- `module: Object` Jenie.module options.
	- `router: Object` Jenie.router options.

### Jenie.component(options)
Returns a new Jenie component and defines a new web component.

- `options: Object`
	- `name: String` **Required** the tag name
	- `file: String` path to js component script.
	- `template: Element, String, Query` **Required** (If using string do not include template)
	- `model: Object<Any>` See Jenie.controller().model
	- `modifiers: Object<Function>` See Jenie.controller().modifiers
	- `events: Object<Function>` See Jenie.controller().events
	- `created: Function` Triggered once on creation.
	- `attached: Function` Triggered on each dom attachment.
	- `detached: Function` Triggered on each dom detachment.
	- `attributed: Function` Triggered on changed.

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

### Jenie.router
- `options: Object`
	- `hash: Boolean` Hash url mode. Default is false.
	- `trailing: Boolean` Trailing slash. Default is false.
	- `container: Element` Sets the click listener for hrefs to the container. Default is window.
	- `routes: Array`
		- `route: Object`
			- `path: String` Any path.
				- `parameters: String` Named '/account/{user}', or catchalls '{\*}',
			- `title: String` The title for the page.
			- `component: String` The name of a component.
			- `componentUrl: String` The url path to a component. Appends the html or js file to the head.
	- `external` If true then the response will not be handle by the router. If false then the router will handle the response.
		- `RegExp`
		- `String`
		- `Function` Argument provided is the request path. Expects a boolean return.

- `run: Function` Must be called after <j-view></j-view> is created
- `redirect: Function`
- `add: Function`
	- `path: String`
- `remove: Function`
	- `path: String`
- `get: Function`
	- `path: String` Exact path matching, route path variables are not taken into account.
- `find: Function` Approximate path matching, route path variables are taken into account.
	- `path: String`
- `findRoutes: Function`
	- `route.path: RegExp`
- `navigate: Function`
- `on: EventEmitter`
	- `navigated: Event`

### Jenie.loader
ES6 import export support. Imports currently must be absolute. Also `export default` is the only export format supported for now.
- `options: Object`
	- `esm: Boolean` enable es6 module support for scripts.
<!-- ### Jenie.module
- `options: Object` The setup options for Jenie.setup.
	- `modules: Array`
		- `module: Object`
			- `name: String` module name.
			- `dependencies: Array` optional array of dependencies.
			- `method: Function` module function to export.

- `load: Function` Downloads module scripts async but executes sync.
	- `paths: Array<String>` The src path to the module.
- `export: Function` Sets the module.
	- `name: String` The module name.
	- `dependencies: Array` The module dependencies.
		- `name: String` The module name.
	- `method: Function` The module method.
- `import: Function` Gets the module.
	- `name: String` The module name. -->

### Jenie.http
- `options: Object` The setup options for Jenie.setup.
	- `request: Function` Intercepts the request. If the return value is false the fetch will not be triggered.
		- `fetchOptions: Object`
	- `response: Function` Intercepts the request. If the return value is false the fetch success and error will not be triggered.
		- `fetchOptions: Object`
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
