import Color from '../modules/color.js';

var title = 'Style';

export default {
    title: title,
    path: '/style',
    component: {
        name: 'r-style',
        model: {
            title: title,
            c: '',
            b: '',
            s: '',
            bc: ''
        },
        methods: {
            change: function () {
                this.model.b = Color();
                this.model.c = Color();
                this.model.s = 'background: ' + Color() + '; color: ' + Color() + ';';
            }
        },
        created: function () {
            const self = this;
            setInterval(function () {
                self.model.bc = Color();
            }, 1000);
        },
        template: /*html*/`

			<h2 o-text="title"></h2>
			<hr>

            <br>
            <br>
			<div o-style="s">o-style="{{s}}"</div>
			<div o-style-color="c" o-style-background-color="b">o-style-color="{{c}}", o-style-background-color="{{b}}"</div>
            <br>
            <br>
            <button style="border: solid 0.5rem red" o-style-border-color="bc" o-on-click="change">Change Colors</button>
		`
    }
};
