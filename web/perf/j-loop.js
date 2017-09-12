
Jenie.component({
	name: 'j-loop',
	template: `
		<style>
			html, body, j-loop {
				width: 100%;
				display: block;
			}
			[j-text] {
				margin: 5px;
				padding: 5px;
				/*background: grey;*/
				display: inline-block;
			}
		</style>

		<div j-each-item="items">
			<button j-on-click="click">
				<div j-text="item.number"></div>
			</button>
		</div>
	`,
	model: {
		items: [
			{ number: 0 },
		]
	},
	events: {
		click: function (e) {
			console.log(e);
			console.log('click');
		}
	},
	created: function () {
		var self = this;

		window.self = self;

		// setTimeout(function () {
		// 	self.model.items.push({ number: self.model.items.length });
		// 	setTimeout(function () {
		// 		self.model.items.pop();
		// 	}, 1000);
		// }, 1000);

		setTimeout(function () {

			var increaseInterval = setInterval(function () {

				if (self.model.items.length === 2600) { // 2600
					clearInterval(increaseInterval);

					var decreaseInterval = setInterval(function () {

						if (self.model.items.length === 5) {
							clearInterval(decreaseInterval);
						}

						self.model.items.pop();

					}, 0);
				}

				self.model.items.push({ number: self.model.items.length });

			}, 0);

		}, 1000);

	}
});
