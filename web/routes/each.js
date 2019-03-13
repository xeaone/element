
export default {
	title: 'Each',
	path: '/each',
	component: {
		name: 'r-each',
		model: {
			title: 'Each',
			items: [
				{ it: { val: 0 } }, { it: { val: 1 } }
			]
		},
		created: function () {
			var self = this;

			setTimeout(function () {
				var increaseInterval = setInterval(function () {

					if (self.model.items.length === 20) {
						clearInterval(increaseInterval);

						var decreaseInterval = setInterval(function () {
							if (self.model.items.length === 10) {
								clearInterval(decreaseInterval);
							} else {
								self.model.items.pop();
							}
						}, 50);

					} else {
						self.model.items.push({ it: { val: self.model.items.length } });
					}

				}, 50);
			}, 3000);

		},
		template: /*html*/`

			<h2 o-text="title"></h2>
			<hr>

			<div o-text="items.0.it.val"></div>

			<input type="text" o-value="items.0.it.val">

			<div o-each-item="items">
				<span>
					<span>{{$item}}</span>
					<span o-text="$item.it.val"></span>
					<span>,</span>
				</span>
			</div>

		`
	}
};
