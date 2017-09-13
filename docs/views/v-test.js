import Say from 'say.js';

var model = {
	mcar: 'mcar',
	car: '',
	cars: [],
	numRadio: 0,
	isChecked: true,
	text: 'Hello from model',
	items: [{ it: { val: 0 } }, { it: { val: 1 } }, { it: { val: 2 } }],
	html: '<h3 j-text="text"></h3>'
};

Jenie.component({
	name: 'v-test',
	model: model,
	modifiers: {
		lower: function lower(text) {
			return text.toLowerCase();
		},
		upper: function upper(text) {
			return text.toUpperCase();
		}
	},
	events: {
		foo: function foo() {
			console.log('foo');
		},
		say: Say
	},
	created: function created() {
		var self = this;

		window.SELF = self;

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
	},
	html: '\n\t\t<style>\n\t\t\t[j-each-item] {\n\t\t\t\tmin-height: 150px;\n\t\t\t}\n\t\t</style>\n\n\t\t<p j-text="text | upper"></p>\n\t\t<p j-text="text | lower"></p>\n\t\t<input type="text" j-value="text | lower" placeholder="text">\n\t\t<input type="text" j-value="text | upper" placeholder="text">\n\n\t\t<br>\n\t\t<br>\n\n\t\t<div j-text="isChecked"></div>\n\t\t<input type="checkbox" j-value="isChecked">\n\n\t\t<br>\n\t\t<br>\n\n\t\t<div j-text="initiallyNotOnModel">initiallyNotOnModel</div>\n\t\t<input type="checkbox" j-value="initiallyNotOnModel">\n\n\t\t<br>\n\t\t<br>\n\n\t\t<div j-text="numRadio"></div>\n\t\t<input type="radio" j-value="numRadio">\n\t\t<input type="radio" j-value="numRadio">\n\n\t\t<br>\n\t\t<br>\n\n\t\t<div j-text="car"></div>\n\t\t<select j-value="car">\n\t\t\t<option value="audi">Audi</option>\n\t\t\t<option value="saab">Saab</option>\n\t\t\t<option value="volvo">Volvo</option>\n\t\t\t<option value="mercedes">Mercedes</option>\n\t\t</select>\n\n\t\t<br>\n\t\t<br>\n\n\t\t<div j-text="cars"></div>\n\t\t<select j-value="cars" multiple>\n\t\t\t<option value="audi">Audi</option>\n\t\t\t<option value="saab">Saab</option>\n\t\t\t<option value="volvo">Volvo</option>\n\t\t\t<option value="mercedes">Mercedes</option>\n\t\t</select>\n\n\t\t<br>\n\t\t<br>\n\n\t\t<input type="text" j-value="items.0.it.val">\n\t\t<div j-each-item="items">\n\t\t\t<span>\n\t\t\t\t<span j-on-click="foo" j-text="item.it.val"></span>\n\t\t\t\t<span>,</span>\n\t\t\t</span>\n\t\t</div>\n\n\n\t\t<button j-on-click="say">Say Alert</button>\n\t\t<input type="text" j-value="none.nope">\n\t\t<input type="button" value="button">\n\t\t<input type="reset" value="reset">\n\n\t\t<br>\n\n\t\t<ul>\n\t\t\t<li>\n\t\t\t\t<a href="test/">test</a>\n\t\t\t</li>\n\t\t\t<li>\n\t\t\t\t<a href="js">js</a>\n\t\t\t</li>\n\t\t\t<li>\n\t\t\t\t<a href="js/?name=ferret&color=purple#hash">js/?name=ferret&amp;color=purple#hash</a>\n\t\t\t</li>\n\t\t\t<li>\n\t\t\t\t<a href="https://google.com/">google</a>\n\t\t\t</li>\n\t\t\t<li>\n\t\t\t\t<a href="https://google.com/" external>google external</a>\n\t\t\t</li>\n\t\t\t<li>\n\t\t\t\t<a href="https://google.com/" target="_blank">google target_blank</a>\n\t\t\t</li>\n\t\t</ul>\n\n\t\t<div j-html="html"></div>\n\t'
});