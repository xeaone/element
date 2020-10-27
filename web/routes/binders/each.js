const { Component } = Oxe;

export default class RouteBinderEach extends Component {

    title = 'Each Binder'

    static model = {
        title: 'Each Binder',
        as: [
            { it: { val: 'zero' } },
            { it: { val: 'one' } }
        ],
        os: {
            keyOne: 'valueOne',
            keyTwo: 'valueTwo',
            keyThree: 'valueThree',
            keyFour: 'valueFour'
        }
    }

    // methods: {
    //     click: function () {
    //         console.log(arguments);
    //     }
    // }

    static created () {

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

    }

    static template = /*html*/`

		<h2>{{title}}</h2>
		<hr>
        
		<div o-text="as.0.it.val"></div>
		<input o-value="as.0.it.val">

		<br>
		<br>
		<strong>Array: o-each-a-i-k="as"</strong>
		<div o-each-a-i-k="as">
			<div name="{{a.it.val}}">
				<strong>Value: </strong>{{a.it.val}}
				<strong>Index: </strong>{{i}},
				<strong>Key: </strong>{{k}},
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
