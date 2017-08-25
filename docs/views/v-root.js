
var home = Jenie.escape('\n\t// v-home.html\n\t<template>\n\t\t<h1 j-text="title"></h1>\n\t</template>\n\t<script>\n\t\tJenie.component(\n\t\t\tname: "v-home"\n\t\t\ttemplate: "template"\n\t\t\tmodel: {\n\t\t\t\ttitle: "Old Title"\n\t\t\t}\n\t\t\tcreated: function () {\n\t\t\t\tthis.model.title = "New Title"\n\t\t\t}\n\t\t}\n\t</script>\n');

var index = Jenie.escape('\n\t// index.html\n\t<script src="jenie.min.js" defer></script>\n\t<j-view></j-view>\n\t<script>\n\t\tJenie.setup({\n\t\t\thttp: {\n\t\t\t\trequest: function (options, xhr) {\n\t\t\t\t\t// false will cancel the http.fetch\n\t\t\t\t\treturn true;\n\t\t\t\t},\n\t\t\t\tresponse: function (options, xhr) {\n\t\t\t\t\t// false will cancel the http.fetch handlers\n\t\t\t\t\treturn true;\n\t\t\t\t}\n\t\t\t},\n\t\t\tmodule: {\n\t\t\t\tmodules: [\n\t\t\t\t\t{\n\t\t\t\t\t\tname: "num",\n\t\t\t\t\t\tmethod: function () {\n\t\t\t\t\t\t\treturn function () { return 1; };\n\t\t\t\t\t\t}\n\t\t\t\t\t}\n\t\t\t},\n\t\t\trouter: {\n\t\t\t\troutes: [\n\t\t\t\t\t{\n\t\t\t\t\t\tpath: "/",\n\t\t\t\t\t\tcomponent: "v-home",\n\t\t\t\t\t\tcomponentUrl: "v-home.html"\n\t\t\t\t\t}\n\t\t\t\t]\n\t\t\t}\n\t\t});\n\t</script>\n');

var template = '\n\t<h2>Overview</h2>\n\n\t<strong>Synopsis</strong>\n\t<p>\n\t\tJenie is a light weight web components framework/library.\n\t</p>\n\n\t<strong>Breaking Changes</strong>\n\t<ul>\n\t\t<li>1.4: removed Jenie.component.template as comment.</li>\n\t\t<li>1.4: j-on binder events have been moved from Jenie.controller.model to Jenie.controller.events.</li>\n\t</ul>\n\n\t<strong>Support</strong>\n\t<ul>\n\t\t<li>IE10~</li>\n\t\t<li>IE11</li>\n\t\t<li>Chrome</li>\n\t\t<li>Firefox</li>\n\t\t<li>Safari 7</li>\n\t\t<li>Mobile Safari</li>\n\t\t<li>Chrome Android</li>\n\t</ul>\n\n\t<strong>Install</strong>\n\t<ul>\n\t\t<li><strong>npm install jenie --save</strong></li>\n\t\t<li>UMD <i>"dist/jenie.min.js"</i></li>\n\t\t<li>Web Component Pollyfill included UMD <i>"dist/jenie.polly.min.js"</i></li>\n\t\t<li>Web Component Pollyfill <i>"dist/webcomponents-lite.min.js"</i></li>\n\t</ul>\n\n\t<h2>Example</h2>\n\t<pre>\n\t\t<code class="language-html">' + home + '</code>\n\t</pre>\n\t<pre>\n\t\t<code class="language-html">' + index + '</code>\n\t</pre>\n';

Jenie.component({
	name: 'v-root',
	template: template,
	attached: function attached() {
		Prism.highlightAll();
	}
});