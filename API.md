
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
	- `loader: Object` Oxe.loader options
	- `keeper: Object` Oxe.keeper options
	- `router: Object` Oxe.router options
	- `batcher: Object` Oxe.batcher options
	- `fetcher: Object` Oxe.fetcher options

### Oxe.component
- `define: Function` Defines a custom web component
	- `options: Object`
		- `name: String` **Required** the tag name
		- `model: Object<Any>`
		- `methods: Object<Function>`
		- `template: String, Function, Element`
		- `style: String, Function` Rewrites CSS variables and :scope if browser support is lacking
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
- Commented import/export will still be re-written and loaded
- Template string re-writes may not handle nested backtick/template string correctly
- Method type of fetch will use XHR and new Function.

- `options: Object`
	- `transformers: Objcet`
		- `js: String`
			- `es` Enables ES6 module and template string re-writes
			- `esm` Enables ES6 module re-writes uses (Note: only supporting default export/import)
			- `est` Enables ES6 template string re-writes uses (Note: Any backtick will be re-writen)
	- `methods: Objcet`
		- `js: String`
			- `fetch` Fetches the content and executes
			- `script` Appends to header as a standard script tag
			- `attach` Appends to header as a module script tag  **default**
		- `css: String`
			- `fetch` Fetches the content
			- `attach` Appends to header as a link tag **default**
	- `loads: Array` Adds load objects or strings such as non route components
		- `load: Object, String`
			- `url: String` Path to file resources
			- `type: String` If not defined uses the default type
- `setup: Function`
	- `options: Object` Accepts the above options
- `load: Function`
	- `load: Object, String`
		- `url: String` Path to file resources
		- `type: String` If not defined uses the default type
- `on: EventEmitter`
	- `setup`

### Oxe.keeper
Keeper is an auth module. It can handle the sign-in, sigh-out, Fetcher request, and Router changes.
- `options: Object`
	- `type: String` Token storage type
		- `local`
		- `session`
	- `scheme: String` (default: bearer) Any valid authentication scheme
	- `forbidden: String, Function` If string Router.route other wise call the function
	- `unauthorized: String, Function` If string uses Router.route other wise call the function
	- `authenticated: String, Function` If string uses Router.route other wise call the function
	- `unauthenticated: String, Function` If string uses Router.route other wise call the function
- `setup: Function`
	- `options: Object` Accepts the above options
- `token: String` Readable only token
- `user: String` Readable only user
- `setToken: Function` Sets the token
	- `token: String`
- `setUser: Function` Sets the user
	- `user: Object`
- `removeToken: Function` Removes the token
- `removeUser: Function` Removes the user
- `authenticate: Function` Adds a token
	- `token: String` The token to add
	- `user: Object` The user data to add
- `unauthenticate: Function` Removes the token and user data
- `encode: Function` Wraps window.btoa
- `decode: Function` Wraps window.atob

### Oxe.router
- `options: Object`
	- `element: String, Element` (default: 'o-router') The container to render route changes
	- `auth: Boolean` (default: false) Enables Oxe.Keeper
	- `hash: Boolean` (default: false) Hash URL mode
	- `trailing: Boolean` (default: false) Trailing slash mode
	- `external: String, RegExp, Function` Filters URL requests. If true or match Oxe.router will not handle request
	- `container: Element` Contains all href clicks to the container. Default is window. Good for embedding especially
	- `routes: Array`
		- `route: Object`
			- `auth: Boolean` (default: false) Enables Oxe.Keeper
			- `path: String` Any path starting with forward slash
				- `parameters: String` Paths can have parameters `/account/{user}` or catchalls `{\*}`
			- `title: String` The title for the page
			- `handler: Function` Overrides the default render method
			- `component: Object, String` An Oxe.component.define options object or a component name
			- `load: Object, String` An Oxe.loader.load options object or a url
- `setup: Function`
	- `options: Object` Accepts the above options
- `location: Object` Similar to window.location
	- `base: String` Base href or origin
	- `hash: String`
	- `href: String`
	- `host: String`
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
	- `parameters: Object` Key value pairs of the route dynamic route parameters
- `render: Function` Will render a route object it is useful if your using route as a handler
- `redirect: Function` Uses window.location.href which is treated like a 301 redirect for SEO
	- `path: String`
- `add: Function`
	- `path: String`
- `remove: Function`
	- `path: String`
- `get: Function`
	- `path: String` Strict path matching the route path parameters are not considered
- `find: Function`
	- `path: String` Loose path matching the route path parameters are considered
- `route: Function` Routes to the path
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
	- `fps: Number` (default: 1000/60) if set to 0 the total load time decreases but the progress/lazy load is lost.
- `setup: Function`
	- `options: Object`
- `read: Function`
- `write: Function`
- `tick: Function`
- `flush: Function`
- `remove: Function`
- `clear: Function`
- `emit: Function`
- `on: Function`
	- `name: String`
	- `method: Function`
- `events: Object`
	- `error: Array`

### Oxe.fetcher
Uses XHR
- `options: Object`
	- `acceptType: String`
	- `contentType: String`
	- `responseType: String`
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
		- `contentType: String` The header Content-Type of the data being posted to the server
			- `*` Any string
			- `xml` 'text/xml; charset=utf-8'
			- `text` 'text/text; charset=utf-8'
			- `html` 'text/html; charset=utf-8'
			- `json` 'application/json; charset=utf-8'
			- `js` 'application/javascript; charset=utf-8'
		- `acceptType: String` The header Accept type to expect from the server
			- `*` Any string
			- `xml` 'text/xml; charset=utf-8'
			- `text` 'text/text; charset=utf-8'
			- `html` 'text/html; charset=utf-8'
			- `json` 'application/json; charset=utf-8'
			- `js` 'application/javascript; charset=utf-8'
		- `responseType: String` Blob support for older browsers is still needed
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
