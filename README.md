# Jene

**Beta**

Lightweight powerful web components framework. Web components, data-binding, front-end routing, and more.

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
- Pollyfills not included `node_modules/jenie/dist/jenie.min.js`
- Pollyfills are included `node_modules/jenie/dist/jenie.polly.min.js`
- Pollyfills `node_modules/jenie/dist/webcomponents-lite.min.js`

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
			title: 'Home Component'
		}
	});
</script>
```

```javascript
// index.js
Jenie.router({
	routes: [
		{
			path: '/',
			component: 'j-home'
		}
	]
});
```

```html
<!-- index.html -->
<html>
<head>
	<script src="node_modules/dist/jenie.polly.min.js"></script>
	<script src="index.js"></script>
	<link rel="import" href="j-home.html">
</head>
<body>
	<j-view></j-view>
</body>
</html>
```

## API

### Jenie.component(Object: options)
Returns a Jenie component and defines a web component.

#### Options
- `name` **Required**
- `template` **Required**
- `model` After the model is returned by the binder there are helper functions deeply attached i.e. `model.del(String, Number: key)` and `model.ins(String, Number: key, Any: value)`. Also setting a property to `udnefined` will delete or splice it.
	- `Array` Object to be observed.
	- `Object` Object to be observed.
	- `Function` Async task to return the model in argument `resolve(Object: model)` provided.
- `modifiers`
- `controller`
- `created`
- `attached`
- `detached`
- `attributed`

### Jenie.router(Object: options) || Jenie.router
After initialized `Jenie.router` is no longer a Function but a router instance.

#### Options
- `hash: Boolean` Hash url mode. The default is `false`.
- `base: String` Defines the base for relative urls. Can also use the html base tag.
- `routes: Array` Should contain route objects.
	- `route: Object`
		- `path: String` An absolute path.
		- `cache: Boolean` Default is true.
		- `title: String` the title for the page.
		- `component: String` The name of a `Jenie.component`.
- `external` - If `true` then the response will not be handle by the router. If `false` then the router will handle the response.
	- `RegExp`
	- `String` - Converted to a `RegExp`.
	- `Function` - Argument provided is the request path. Expects a boolean return.

### Jenie.binder(Object: options, Function: callback)
Returns an instance of a new binder.

#### Options
- `name`
- `view`
- `model` After the model is returned by the binder there are helper functions deeply attached i.e. `model.del(String, Number: key)` and `model.ins(String, Number: key, Any: value)`. Also setting a property to `udnefined` will delete or splice it.
	- `Array` Object to be observed.
	- `Object` Object to be observed.
	- `Function` Async task to return the model in argument `resolve(Object: model)` provided.
- `modifiers`

### Jenie.http
- `mime`
- `fetch`
- `serialize`

### Jenie.services
An `object` to store `functions`. Basically a module system. This might change to `Jenie.module` and or might be come more of a robust system.

### Jenie.query(String: querySelector)
Returns the result of a querySelector in the **current** document `document.currentScript.ownerDocument.querySelector()`

### Jenie.script()
Returns `document.currentScript`

### Jenie.document()
Returns `document.currentScript.ownerDocument`

## Authors
**Alexander Elias** - [AlexanderElias](https://github.com/AlexanderElias)

## License
This project is licensed under the MPL-2.0 License - [LICENSE.md](LICENSE.md)
