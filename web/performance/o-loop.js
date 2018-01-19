
Oxe.component.define({
	name: 'o-loop',
	model: {
		items: [
			{ number: 0 },
		]
	},
	created: function () {
		var self = this;

		for (var i = 0; i < 1000; i++) {
			self.model.items.push({ number: self.model.items.length });
		}

	},
	template: `
		<div o-each-item="items">
			<div class="box">
				<div o-text="item.number"></div>
				<input type="text" o-value="item.number">
			</div>
		</div>
	`,
});
