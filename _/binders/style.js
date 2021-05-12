import Color from '../../modules/color.js';

export default class BinderStyleRoute extends Oxe.Component {

    title = 'Style Binder'

    data = {
        b: 'blue',
        c: 'red',
        change() {
            this.data.c = Color();
            this.data.b = Color();
        }
    }

    html = /*html*/`

        <h2>Style Binder</h2>
        <hr>

        <br>
        <br>
        <div style="color: {{c}}">style="color: {{c}}"</div>

        <br>
        <br>
        <button style="border: solid 0.5rem {{b}}" onclick="{{change}}">Change Colors</button>

    `
    async connected() {
        // setInterval(() => this.data.b = Color(), 1000);
    }

}
