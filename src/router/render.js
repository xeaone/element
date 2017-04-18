
function Render (data) {
	if (data.title !== null && data.title !== undefined) document.title = data.title;
	if (data.type === 'text') document.querySelector(data.query).innerText = data.content;
	else if (data.type === 'html') document.querySelector(data.query).innerHTML = data.content;
	else document.querySelector(data.query).innerText = '505 Router Error';

	window.scroll(0, 0);

	// execute scripts
	var scripts = data.content.match(/<script>[\s\S]+<\/script>/g);

	if (scripts) {
		scripts.forEach(function (script) {
			script = script.replace(/(<script>)|(<\/script>)/g, '');
			eval(script);
		});
	}

}

module.exports = Render;
