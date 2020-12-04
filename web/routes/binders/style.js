import Color from '../../modules/color.js';

export default class BinderStyleRoute extends Oxe.Component {

    title = 'Style Binder'

    static model = {
        c: '',
        b: '',
        s: '',
        bc: '',
        change () {
            this.model.b = Color();
            this.model.c = Color();
            this.model.s = 'background: ' + Color() + '; color: ' + Color() + ';';
        }
    }
    
    static created () {
        setInterval(() => this.model.bc = Color(), 1000);
    }

     static template = /*html*/`

        <h2>Style Binder</h2>
        <hr>

        <br>
        <br>
        <div o-style="s">o-style="{{s}}"</div>
        <div o-style-color="c" o-style-background-color="b">o-style-color="{{c}}", o-style-background-color="{{b}}"</div>

        <br>
        <br>
        <button style="border: solid 0.5rem red" o-style-border-color="bc" onclick="{{change}}">Change Colors</button>

    `

}
