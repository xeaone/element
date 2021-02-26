const { Component } = Oxe;

export default class BinderClassRoute extends Component {

    title = 'Class Binder';

    static model = {
        title: 'Class',
        boolean: true,
        string: 'string',
        toggle() { this.model.boolean = !this.model.boolean; }
    };

    static css = /*css*/`
        .default {
            border: solid 0.3rem black;
        }
        .boolean {
            background: lightblue;
        }
        .string {
            background: lightgreen;
        }
    `;

    static template = /*html*/`

        <h2>{{title}}</h2>
        <hr>

        <br>
        <br>

        <div class="default {{string}}">class="default {{string}}"</div>

        <div class="default {{boolean}}">class="default {{boolean}}"</div>
        <button onclick="{{toggle}}">Toggle Class</button>

    `;

}
