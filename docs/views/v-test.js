
var template = '\n\t<style>\n\t\t[j-each-item] {\n\t\t\tmin-height: 150px;\n\t\t}\n\t</style>\n\n\t<p j-text="text | upper"></p>\n\t<p j-text="text | lower"></p>\n\t<input type="text" j-value="text | lower" placeholder="text">\n\t<input type="text" j-value="text | upper" placeholder="text">\n\n\t<br>\n\t<br>\n\n\t<div j-text="isChecked"></div>\n\t<input type="checkbox" j-value="isChecked">\n\n\t<br>\n\t<br>\n\n\t<div j-text="initiallyNotOnModel">initiallyNotOnModel</div>\n\t<input type="checkbox" j-value="initiallyNotOnModel">\n\n\t<br>\n\t<br>\n\n\t<div j-text="numRadio"></div>\n\t<input type="radio" j-value="numRadio">\n\t<input type="radio" j-value="numRadio">\n\n\t<br>\n\t<br>\n\n\t<div j-text="car"></div>\n\t<select j-value="car">\n\t\t<option value="audi">Audi</option>\n\t\t<option value="saab">Saab</option>\n\t\t<option value="volvo">Volvo</option>\n\t\t<option value="mercedes">Mercedes</option>\n\t</select>\n\n\t<br>\n\t<br>\n\n\t<div j-text="cars"></div>\n\t<select j-value="cars" multiple>\n\t\t<option value="audi">Audi</option>\n\t\t<option value="saab">Saab</option>\n\t\t<option value="volvo">Volvo</option>\n\t\t<option j-value="mcar">Mercedes</option>\n\t</select>\n\n\t<br>\n\t<br>\n\n\t<input type="text" j-value="items.0.it.val">\n\t<div j-each-item="items">\n\t\t<span>\n\t\t\t<span j-on-click="foo" j-text="item.it.val"></span><span>,</span>\n\t\t</span>\n\t</div>\n\n\n\t<button j-on-click="say">Say Hello</button>\n\t<input type="text" j-value="none.nope">\n\t<input type="button" value="button">\n\t<input type="reset" value="reset">\n\n\t<br>\n\n\t<ul>\n\t\t<li>\n\t\t\t<a href="test/">test</a>\n\t\t</li>\n\t\t<li>\n\t\t\t<a href="js">js</a>\n\t\t</li>\n\t\t<li>\n\t\t\t<a href="js/?name=ferret&color=purple#hash">js/?name=ferret&amp;color=purple#hash</a>\n\t\t</li>\n\t\t<li>\n\t\t\t<a href="https://google.com/">google</a>\n\t\t</li>\n\t\t<li>\n\t\t\t<a href="https://google.com/" external>google external</a>\n\t\t</li>\n\t\t<li>\n\t\t\t<a href="https://google.com/" target="_blank">google target_blank</a>\n\t\t</li>\n\t</ul>\n\n\t<div j-html="html"></div>\n';

var model = {
	mcar: 'Mercedes',
	car: '',
	cars: [],
	numRadio: 0,
	isChecked: true,
	text: 'Hello from html test',
	items: [{ it: { val: 0 } }],
	// jhtml: 'j-html Binder',
	html: '<h3 j-text="text"></h3>'
};

Jenie.component({
	name: 'v-test',
	template: template,
	model: model,
	modifiers: {
		lower: function lower() {
			return this.toLowerCase();
		},
		upper: function upper() {
			return this.toUpperCase();
		}
	},
	events: {
		foo: function foo() {
			console.log('foo');
		},
		say: function say(e) {
			console.log(e);
			window.alert('hello from button');
		}
	},
	created: function created() {
		var self = this;

		window.SELF = self;

		// self.model = m;

		setTimeout(function () {
			var increaseInterval = setInterval(function () {

				if (self.model.items.length === 100) {
					clearInterval(increaseInterval);

					var decreaseInterval = setInterval(function () {

						if (self.model.items.length === 5) {
							clearInterval(decreaseInterval);
						}

						self.model.items.pop();
					}, 10);
				}

				self.model.items.push({ it: { val: self.model.items.length } });
			}, 10);
		}, 1000);
	}
});