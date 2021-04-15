
import Color from '../../modules/color.js';

const { Component } = Oxe;

export default class BindersRoute extends Component {

    title = 'Binders';

    data = {
        text: '{{text}}',

        checked: false,
        checkboxInput () { console.log(this.data.checked); },

        fontColor: 'blue',
        borderColor: 'red',
        styleChange () {
            this.data.fontColor = Color();
            this.data.borderColor = Color();
        },

        class: {
            active: true,
            update: active => active ? 'active' : '',

            toggle: () => this.data.class.active = !this.data.class.active,
        },
        classBoolean: true,
        classString: 'string',


    };

    css = /*css*/`
        .default {
            border: solid 2px black;
        }
        .active {
            background: lightblue;
        }
        .string {
            background: lightgreen;
        }
    `;

    html = /*html*/`

        <section id="text">
            <h3>Text Binder</h3>
            <strong>Text</strong>
            <pre>{{text}}</pre>
        </section>

        <section id="checked">
            <h3>Checked Binder</h3>
            <strong>Checked</strong>
            <pre>checked="{{checked}}"</pre>

            <br>
            <input checked="{{checked}}" type="checkbox" oninput="{{checkboxInput}}">
            <i>checked attribute linked to boolean on model with no value attribute.</i>

            <br>
            <input value="{{checked}}" checked="{{checked}}" type="checkbox" oninput="{{checkboxInput}}">
            <i>checked boolean value and checked attribute</i>
        </section>

        <section id="style">
            <h2>Style Binder</h2>

            <br>
            <div style="color: {{fontColor}}">style="color: {{fontColor}}"</div>

            <br>
            <button style="border: solid 0.5rem {{borderColor}}" onclick="{{styleChange}}">style="border: solid 0.5rem {{borderColor}}"</button>
        </section>

        <section id="class">
            <h2>Class Binder</h2>

            <div class="default {{classString}}">class="default {{classString}}"</div>
            <div class="{{class.active}}">class="{{class.active}}"</div>
            <div class="default {{class.active}}">class="default {{class.active}}"</div>
            <div class="default {{class.update(class.active)}}">class="default {{class.update(class.active)}}"</div>
            <button onclick="{{class.toggle}}">Toggle Class</button>
        </section>

    `;

};

