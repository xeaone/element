import Color from '../../modules/color.js';

export default {
    title: 'Style Binder',
    name: 'r-binder-style',
    model: {
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

        <h2>Style Binder</h2>
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
