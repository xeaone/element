
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
The recommend entry or setup method.
- `options: Object`
	- `listener: Object`
		- `before: Function`
		- `after: Function`
	- `path: Object` Oxe.path options
	- `loader: Object` Oxe.loader options
	- `keeper: Object` Oxe.keeper options
	- `router: Object` Oxe.router options
	- `batcher: Object` Oxe.batcher options
	- `fetcher: Object` Oxe.fetcher options

### Oxe.path
- `setup: AsyncFunction`
	- `options: Object`
		- `base: String` Sets or and creates a base tag

### Oxe.component
- `setup: AsyncFunction`
	- `options: Object`
		- `components: Array`
			- `component: Object` A component definition.
- `define: Function` Defines a custom web component.
	- `options: Object`
		- `name: String` **Required** the tag name
		- `model: Object<Any>`
		- `methods: Object<Function>`
		- `template: String`
		- `style: String` Rewrites CSS variables and :scope if browser support is lacking
		- `shadow: Boolean` (default: false) use shadow DOM
		- `properties: Object<Descriptors>` Property descriptors added to the element prototype
		- `created: Function` Triggered once on DOM creation
		- `attached: Function` Triggered on each DOM attachment
		- `detached: Function` Triggered on each DOM detachment
		- `attributed: Function` Triggered attribute change

### Oxe.loader
Loads files and dependencies asynchronously. ES6 import/export module and template string re-write support via transformers.

**Caveats**
- Supported import/export re-writes
	- `import Name from './path'`
	- `import './path'`
	- `export default`
- Commented and string or template string import/export might have issues
- Template string re-writes may not handle nested backtick/template string correctly
- Uses fetch or XHR and new Function until dynamic imports are supported.

- `options: Object`
	- `type: String`
		- `es` Enables ES6 module and template string re-writes
		- `est` Enables ES6 template string re-writes uses
		- `esm` Enables ES6 module re-writes uses (Note: only supporting default export/import)
	- `loads: Array` Adds load objects or strings such as non route components
		- `load: Object, String`
			- `url: String` **Required** Path to file resources
			- `type: String` If not defined uses the default type
- `setup: Function`
	- `options: Object` Accepts the above options
- `load: Function`
	- `load: Object, String`
		- `url: String` **Required** Path to file resources
		- `type: String` If not defined uses the default type based from extension

### Oxe.router
- `options: Object`
	- `folder: String` (default: '/routes') resolves the route is provided a string
	- `mode: String` (default: push) The href option uses `window.location.assign`
		- href
		- push
		- replace
	- `trailing: Boolean` (default: true) Trailing slash mode
	- `element: String, Element` (default: 'o-router') The element to render route changes
	- `contain: Boolean` (default: false) Limits all href clicks to the 'o-router' element
	- `external: String, RegExp, Function` Filters URL requests. If true or match Oxe.router will not handle request
	- `before: AsyncFunction` Invoked before the routed
		- `location: Object` Oxe.router.location argument for the upcoming route
	- `routes: Array`
		- `route: Object, String` Dynamically loads the string based on the Oxe.router.folder and appends .js
			- `load: String` Dynamically loads the content and assigns it to the route object
			- `path: String` Any path starting with forward slash
				- `parameters: String` Paths can have parameters `/account/{user}` or catchalls `{\*}`
			- `title: String` Sets the page title
			- `keywords: String` Sets the page keywords
			- `description: String` Sets the page description
			- `handler: Function` Overrides the default render method
			- `component: Object, String` An Oxe.component.define options object or a component name
- `setup: AsyncFunction`
	- `options: Object` Accepts the above options
- `location: Object` Similar to window.location
	<!-- - `base: String` Base href or origin -->
	- `href: String`
	- `host: String`
	- `hash: String`
	- `port: String`
	- `title: String`
	- `query: Object` Key value pairs of search/query
	- `origin: String`
	- `search: String`
	<!-- - `basename: String` Base without the origin -->
	- `hostname: String`
	- `pathname: String` A pathname even when using hash urls
	- `protocol: String`
	<!-- - `username: String` -->
	<!-- - `password: String` -->
	- `parameters: Object` Key value pairs of the route dynamic route parameters
- `render: Function` Will render a route object it is useful if your using route as a handler
- `redirect: Function` Uses window.location.href which is treated like a 301 redirect for SEO
	- `path: String`
- `create: Function`
	- `route: Object`
- `add: Function`
	- `path: String`
- `remove: Function`
	- `path: String`
- `get: Function`
	- `path: String` Strict path matching the route path parameters are not considered
- `find: Function`
	- `path: String` Loose path matching the route path parameters are considered
- `filter: Function`
	- `path: String, RegExp` Loose path matching the route path parameters are considered or a RegExp.
- `route: AsyncFunction` Routes to the path
	- `path: String` Path to navigate
	- `options: Object`
		- `replace: Boolean` (default: false) replace or push state
		- `query: Object` Converts a key value pair to a query/search string and appends to the path
- `on: EventEmitter`
	- `routing`
	- `routed`

### Oxe.batcher
Batches DOM reads and writes.
- `options: Object`
	- `time: Number` (default: 1000/60)
- `setup: Function`
	- `options: Object`
- `tick: Function`
- `flush: Function`
- `schedule: Function`
- `remove: Function`
- `clear: Function`
- `batch: Function`

### Oxe.fetcher
- `setup: Function`
	- `options: Object` Accepts `window.fetch` options
		- `path: String` The default path for the url options (requires origin)
		- `origin: String` The default origin for url options
		- `header: Object` (default: null) Http headers to be assigned to requests
		- `acceptType: String`  Valid http `Accept-Type` value or a Oxe.fetcher.mime name
		- `contentType: String` Valid http `Content-Type` value or a Oxe.fetcher.mime name
		- `responseType: String` (default: ReadableStream)
			- `arrayBuffer`
			- `document`
			- `blob`
			- `json`
			- `text`
		- `request: Function, AsyncFunction` Intercepts the request. If the return value is false the fetch will stop if the value is a object it will assign/overwrite the current request data.
			- `data: Object` Argument to be sent as the request
		- `response: Function, AsyncFunction` Intercepts the response. If the return value is false the fetch will stop if the value is a object it will assign/overwrite the current response data.
			- `data: Object` Argument to be sent as the response
- `fetch: AsyncFunction` Accepts `window.fetch` options
	- `options: Object`
		- `path: String` The path for the url options (requires origin)
		- `origin: String` The origin for the url options
		- `url: String` An absolute url or the combination of the origin and path
		- `method: String` Required http method
		- `body: Object` If method is GET than body is concatenated to the url as parameters
		- `head: Object`
		- `contentType: String` Overrides the setup contentType.
		- `acceptType: String` Overrides the setup acceptType.
		- `responseType: String` Overrides the setup responseType.
- `get: AsyncFunction`
	- `options: Object` Accepts `Oxe.fetcher.fetch` options
- `put: AsyncFunction`
	- `options: Object` Accepts `Oxe.fetcher.fetch` options
- `post: AsyncFunction`
	- `options: Object` Accepts `Oxe.fetcher.fetch` options
- `head: AsyncFunction`
	- `options: Object` Accepts `Oxe.fetcher.fetch` options
- `delete: AsyncFunction`
	- `options: Object` Accepts `Oxe.fetcher.fetch` options
- `patch: AsyncFunction`
	- `options: Object` Accepts `Oxe.fetcher.fetch` options
- `options: AsyncFunction`
	- `options: Object` Accepts `Oxe.fetcher.fetch` options
- `connect: AsyncFunction`
	- `options: Object` Accepts `Oxe.fetcher.fetch` options
- `serialize: AsyncFunction`
- `mime: Object`
	- `xml` 'text/xml; charset=utf-8'
	- `text` 'text/text; charset=utf-8'
	- `html` 'text/html; charset=utf-8'
	- `json` 'application/json; charset=utf-8'
	- `js` 'application/javascript; charset=utf-8'

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
A global object for random data.
