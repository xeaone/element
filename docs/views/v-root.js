import Escape from 'modules/escape.js';

var home = Escape('\n\tJenie.component({\n\t\tname: \'v-home\',\n\t\thtml: `\n\t\t\t<h1 j-text="title"></h1>\n\t\t`,\n\t\tmodel: {\n\t\t\ttitle: \'Old Title\'\n\t\t},\n\t\tcreated: function () {\n\t\t\tthis.model.title = \'New Title\';\n\t\t}\n\t});\n');

var indexjs = Escape('\n\tJenie.setup({\n\t\thttp: {\n\t\t\trequest: function (opt, xhr) {\n\t\t\t\treturn true; // false will cancel the http.fetch\n\t\t\t},\n\t\t\tresponse: function (opt, xhr) {\n\t\t\t\treturn true; // false will cancel the http.fetch handlers\n\t\t\t}\n\t\t},\n\t\tloader: {\n\t\t\tesm: true, // Enables ES6 import export module support\n\t\t\tloads: [\n\t\t\t\t{\n\t\t\t\t\turl: \'/components/c-menu.js\',\n\t\t\t\t\texecute: true // Since this component is not a route component or imported we must execute.\n\t\t\t\t}\n\t\t\t]\n\t\t},\n\t\trouter: {\n\t\t\troutes: [\n\t\t\t\t{\n\t\t\t\t\tpath: \'/\',\n\t\t\t\t\ttitle: \'Home\',\n\t\t\t\t\tcomponent: \'v-home\',\n\t\t\t\t\turl: \'views/v-home.js\'\n\t\t\t\t}\n\t\t\t]\n\t\t}\n\t});\n');

var indexhtml = Escape('\n\t<html>\n\t<head>\n\t\t<base href="/">\n\t\t<script src="jenie.min.js" defer></script>\n\t\t<script src="index.js" defer></script>\n\t</head>\n\t<body>\n\t\t<j-view></j-view>\n\t</body>\n\t</html>\n');

Jenie.component({
	name: 'v-root',
	attached: function attached() {
		// Prism.highlightAll();
	},
	html: '\n\t\t<h2>Overview</h2>\n\n\t\t<strong>Synopsis</strong>\n\t\t<p>\n\t\t\tA small but mighty web components framework/library.\n\t\t</p>\n\n\t\t<strong>Support</strong>\n\t\t<ul>\n\t\t\t<li>IE10~</li>\n\t\t\t<li>IE11</li>\n\t\t\t<li>Chrome</li>\n\t\t\t<li>Firefox</li>\n\t\t\t<li>Safari 7</li>\n\t\t\t<li>Mobile Safari</li>\n\t\t\t<li>Chrome Android</li>\n\t\t</ul>\n\n\t\t<strong>Install</strong>\n\t\t<ul>\n\t\t\t<li><strong>npm install jenie --save</strong></li>\n\t\t\t<li>UMD <i>"dist/jenie.min.js"</i></li>\n\t\t\t<li>UMD with Web Component Pollyfill <i>"dist/jenie.polly.min.js"</i></li>\n\t\t\t<li>Web Component Pollyfill <i>"dist/webcomponents-lite.min.js"</i></li>\n\t\t</ul>\n\n\t\t<h2>Example</h2>\n\t\t<pre>\n\t\t\t<code class="language-js">' + home + '</code>\n\t\t</pre>\n\t\t<pre>\n\t\t\t<code class="language-js">' + indexjs + '</code>\n\t\t</pre>\n\t\t<pre>\n\t\t\t<code class="language-html">' + indexhtml + '</code>\n\t\t</pre>\n\t'
});