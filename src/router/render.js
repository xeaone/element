
module.exports = function (route) {
	var self = this;
	var component = null;

	if (route.title) document.title = route.title;

	if (typeof route.component === 'string') {
		component = self.components[route.component];
		if (!component) {
			component = self.components[route.component] = document.createElement(route.component);
		}
	} else {
		component = route.component;
	}

	if (self.view.firstChild) self.view.removeChild(self.view.firstChild);
	self.view.appendChild(component);
	window.scroll(0, 0);

	// execute scripts
	// var scripts = data.content.match(/<script>[\s\S]+<\/script>/g);
	//
	// if (scripts) {
	// 	scripts.forEach(function (script) {
	// 		script = script.replace(/(<script>)|(<\/script>)/g, '');
	// 		eval(script);
	// 	});
	// }

};
