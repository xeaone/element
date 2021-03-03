import Color from '../../modules/color.js';

export default class BinderStyleRoute extends Oxe.Component {

    title = 'Style Binder'

    static created() {
        // setInterval(() => this.model.b = Color(), 1000);
    }

    static model = {
        b: 'blue',
        c: 'red',
        change() {
            this.model.c = Color();
            this.model.b = Color();
            console.log(this.model);
        }
    }

    static template = /*html*/`

        <h2>Style Binder</h2>
        <hr>

        <br>
        <br>
        <div style="color: {{c}}">style="color: {{c}}"</div>

        <br>
        <br>
        <button style="border: solid 0.5rem {{b}}" onclick="{{change}}">Change Colors</button>

    `

}
