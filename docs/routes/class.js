
export default {
    title: 'Class',
    path: '/class',
    component: {
        name: 'r-style',
        model: {
            c: 'default',
            ca: false,
            title: 'Class'
        },
        methods: {
            overwrite: function () {
                this.model.c = 'overwrite';
            },
            toggle: function () {
                this.model.ca = !this.model.ca;
            }
        },
        style: /*css*/`
            .default {
                border: solid 0.3rem black;
            }
            .overwrite {
                border: solid 0.3rem red;
            }
            .active {
                background: lightgray;
            }
        `,
        template: /*html*/`

			<h2>{{title}}</h2>
			<hr>

            <br>
            <br>
			<div o-class="c">o-class="{{c}}"</div>
            <button o-on-click="overwrite">Overwrite Class</button>

            <br>
            <br>
			<div class="default" o-class-active="ca">o-class-active="{{ca}}"</div>
            <button o-on-click="toggle">Toggle Class</button>
		`
    }
};
