# Jenie

**Beta**
Lightweight powerful web components framework. Web components, data-binding, front-end routing, and more.

**1.4 important Changes**
- removed Jenie.component.template as comment.
- j-on binder events have been moved from Jenie.controller.model to  Jenie.controller.events.

## Support
- IE10 (flaky)
- IE11
- Chrome
- Firefox
- Safari 7
- Mobile Safari
- Chrome Android

## Installing
- `npm install jenie --save`
- UMD `node_modules/jenie/dist/jenie.min.js`
- Web Component Pollyfills included UMD `node_modules/jenie/dist/jenie.polly.min.js`
- Web Component Pollyfill `node_modules/jenie/dist/webcomponents-lite.min.js`

## Example

```html
<!-- j-home.html -->
<template>
	<h1 j-text="title"></h1>
</template>
<script>
	Jenie.component({
		name: 'j-home',
		template: 'template',
		model: {
			title: 'Old Title'
		},
		created: function () {
			this.model.title = 'New Title';
		}
	});
</script>
```

```html
<!-- index.html -->
<html>
<head>
	<script src="node_modules/dist/jenie.min.js"></script>
	<script src="index.js"></script>
	<link rel="import" href="j-home.html">
</head>
<body>
	<j-view></j-view>
	<script>
		Jenie.setup({
			router: {
				routes: [
					{
						path: '/',
						component: 'j-home'
					}
				]
			}
		});
	</script>
</body>
</html>
```

## API

### Jenie.setup(options, callback)
Is the recommend entry point.

- `options: Object`
	- `module: Array` parameters for each module to export.
		- `name: String` module name.
		- `dependencies: Array` optional array of dependencies.
		- `method: Function` module function to export.
	- `router: Object` router options please see Jenie.router.

### Jenie.component(options)
Returns a Jenie component and defines a web component.

- `options: Object`
	- `name: String` **Required** the tag name
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
Custom element router.

- `hash: Boolean` Hash url mode. The default is `false`.
- `contain: Boolean` Sets the click listener for hrefs to the j-view element if `true`. Defaults to `false` which is window.
- `base: String` Sets the base for all urls the order of append is Origin + Base + Root.
- `routes: Array`
	- `route: Object`
		- `path: String` An absolute path.
		- `title: String` The title for the page.
		- `component: String` The name of a component.
		- `componentUrl: String` The url path to a component. Appends the html or js file to the head.
- `external` If `true` then the response will not be handle by the router. If `false` then the router will handle the response.
	- `RegExp`
	- `String` Converted to a `RegExp`.
	- `Function` Argument provided is the request path. Expects a boolean return.
- `listen: Function` Called to start listening.
	- `options: Object` Same as Jenie.router options.
	- `callback: Function` Called after routing is ready and DOMContentLoaded.
- `normalize: Function`
- `join: Function`
- `scroll: Function`
- `url: Function`
- `render: Function`
- `redirect: Function`
- `add: Function`
- `remove: Function`
- `get: Function`
- `navigate: Function`
- `on: EventEmitter`
	- `navigated: Event`

### Jenie.module
Light weight mostly sync module system.

- Returns: `Object`
	- `load: Function` Downloads module scripts async but executes sync.
		- `paths: Array<String>` The src path to the module.
	- `export: Function` Sets the module.
		- `name: String` The module name.
		- `dependencies: Array` Injects the dependencies.
		- `method: Function` The module method.
	- `import: Function` Gets the module.
		- `name: String` The module name.

### Jenie.http
- Returns: `Object`
	- `mime: Object`
	- `serialize: Function`
	- `fetch: Function`
		- `options: Object`
			- `action: String` Resource action url. **Required**
			- `success: Function` **Required**
			- `error: Function` **Required**

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
			- `headers: Object`    A low level headers object it will map directly to the XHR header. The Will overwrite any above options.


### Jenie.query(String: querySelector)
The result of a querySelector in the **current** document `document.currentScript.ownerDocument.querySelector()`

- Returns: `document.currentScript.ownerDocument.querySelector()`

### Jenie.script()
- Returns: `document.currentScript`

### Jenie.document()
- Returns: `document.currentScript.ownerDocument`

### Jenie.services DEPRECATED
- Returns: `Object` to store values.

## Authors
**Alexander Elias** - [AlexanderElias](https://github.com/AlexanderElias)

## License
This project is licensed under the MPL-2.0 License - [LICENSE.md](LICENSE.md)
[Why You Should Cheose MPL-2.0](http://veldstra.org/2016/12/09/you-should-choose-mpl2-for-your-opensource-project.html)
