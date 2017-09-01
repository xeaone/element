import Say from '/say.js';

var home = Jenie.escape(`
	<template>
		<h1 j-text="title"></h1>
	</template>
	<script>
		Jenie.component(
			name: "v-home"
			template: "template"
			model: {
				title: "Old Title"
			}
			created: function () {
				this.model.title = "New Title"
			}
		}
	</script>
`);

var index = Jenie.escape(`
	<script src="jenie.min.js" defer></script>
	<j-view></j-view>
	<script>
		Jenie.setup({
			http: {
				request: function (options, xhr) {
					// false will cancel the http.fetch
					return true;
				},
				response: function (options, xhr) {
					// false will cancel the http.fetch handlers
					return true;
				}
			},
			module: {
				modules: [
					{
						name: "num",
						method: function () {
							return function () { return 1; };
						}
					}
			},
			router: {
				routes: [
					{
						path: "/",
						component: "v-home",
						componentUrl: "v-home.html"
					}
				]
			}
		});
	</script>
`);

var template = `
	<h2>Overview</h2>

	<strong>Synopsis</strong>
	<p>
		Jenie is a light weight web components framework/library.
	</p>

	<strong>Breaking Changes</strong>
	<ul>
		<li>1.4: removed Jenie.component.template as comment.</li>
		<li>1.4: j-on binder events have been moved from Jenie.controller.model to Jenie.controller.events.</li>
	</ul>

	<strong>Support</strong>
	<ul>
		<li>IE10~</li>
		<li>IE11</li>
		<li>Chrome</li>
		<li>Firefox</li>
		<li>Safari 7</li>
		<li>Mobile Safari</li>
		<li>Chrome Android</li>
	</ul>

	<strong>Install</strong>
	<ul>
		<li><strong>npm install jenie --save</strong></li>
		<li>UMD <i>"dist/jenie.min.js"</i></li>
		<li>Web Component Pollyfill included UMD <i>"dist/jenie.polly.min.js"</i></li>
		<li>Web Component Pollyfill <i>"dist/webcomponents-lite.min.js"</i></li>
	</ul>

	<h2>Example</h2>
	<pre>
		<code class="language-html">${home}</code>
	</pre>
	<pre>
		<code class="language-html">${index}</code>
	</pre>
`;

Jenie.component({
	name: 'v-root',
	template: template,
	attached: function () {
		// Prism.highlightAll();
		Say('hello world');
	}
});
