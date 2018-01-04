
Oxe.component.define({
	name: 'v-loop',
	model: {
		items: [
			{ number: 0 },
		]
	},
	created: function () {
		var self = this;
		window.self = self;

		for (var i = 0; i < 2600; i++) {
			self.model.items.push({ number: self.model.items.length });
		}


	},
	html: `
		<div o-each-item="items">
			<div class="box">
				<div o-text="item.number"></div>
				<input type="text" o-value="item.number">
			</div>
		</div>
	`,
});
