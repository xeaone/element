
export default {
    title: 'Each',
    path: '/each',
    component: {
        name: 'r-each',
        model: {
            title: 'Each',
            as: [
                { it: { val: 'zero' } }, { it: { val: 'one' } }
            ],
            os: {
                keyOne: 'valueOne',
                keyTwo: 'valueTwo',
                keyThree: 'valueThree',
                keyFour: 'valueFour'
            }
        },
        methods: {
            click: function () {
                console.log(arguments);
            }
        },
        created: function () {

            // setTimeout(function () {
            // 	var increaseInterval = setInterval(function () {
            //
            // 		if (self.model.items.length === 20) {
            // 			clearInterval(increaseInterval);
            //
            // 			var decreaseInterval = setInterval(function () {
            // 				if (self.model.items.length === 10) {
            // 					clearInterval(decreaseInterval);
            // 				} else {
            // 					self.model.items.pop();
            // 				}
            // 			}, 50);
            //
            // 		} else {
            // 			self.model.items.push({ it: { val: self.model.items.length } });
            // 		}
            //
            // 	}, 50);
            // }, 3000);

        },
        template: /*html*/`

			<h2>{{title}}</h2>
			<hr>

			<div o-text="as.0.it.val"></div>
			<input type="text" o-value="as.0.it.val">

			<br>
			<br>
			<strong>Array: o-each-a="as"</strong>
			<div o-each-a-i-k="as">
				<div o-name="[a].it.val">
					<strong>Index: </strong>{{[i]}},
					<strong>Key: </strong>{{[k]}},
					<strong>Value: </strong>{{[a].it.val}}
				</div>
			</div>

			<!-- <br>
			<br>
			<strong>Object: o-each-o="os"</strong>
			<div o-each-o="os" o-index="i" o-key="k">
				<div o-name="o" o-on-click="click | o">
					<strong>Index: </strong>{{i}},
					<strong>Key: </strong>{{k}},
                    <strong>Value: </strong>{{o}}
				</div>
            </div>

			<br>
			<br>
			<strong>Array: o-each-a="as"</strong>
			<div o-each-a="as" o-index="i" o-key="k">
                <strong>Index: </strong>{{i}},
                <strong>Key: </strong>{{k}},
                <strong>Value: </strong>{{a.it.val}}
                <br>
			</div> -->

		`
    }
};
