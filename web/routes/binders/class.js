const { Component } = Oxe;

export default class BinderClassRoute extends Component {

    title = 'Class Binder';

    data = {
        title: 'Class',
        boolean: true,
        string: 'string',
        toggle() { this.data.boolean = !this.data.boolean; }
    };

    css = /*css*/`
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

    html = /*html*/`

        <h2>{{title}}</h2>
        <hr>

        <br>
        <br>

        <div class="default {{string}}">class="default {{string}}"</div>

        <div class="default {{boolean}}">class="default {{boolean}}"</div>
        <button onclick="{{toggle}}">Toggle Class</button>

    `;

}
