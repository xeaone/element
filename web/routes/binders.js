
import Color from '../../modules/color.js';

const { Component } = Oxe;

export default class BindersRoute extends Component {

    title = 'Binders';

    data = {
        text: '{{text}}',

        checked: false,
        checkboxInput () { console.log(this.data.checked); },

        style: {
            color: Color(),
            change: () => this.data.style.color = Color(),
        },

        class: {
            active: true,
            lightgreen: 'lightgreen',
            lightblue: active => active ? 'lightblue' : '',
            toggle: () => this.data.class.active = !this.data.class.active,
        },

    };

    css = /*css*/`
        .default {
            border: solid 5px transparent;
        }
        .lightblue {
            border-color: lightblue;
        }
        .lightgreen {
            border-color: lightgreen;
        }
    `;

    html = /*html*/ `

        <section id="text">
            <h3>Text Binder</h3>
            <strong>Text</strong>
            <pre>{{text}}</pre>
        </section>

        <section id="checked">
            <h3>Checked Binder</h3>
            <strong>Checked</strong>
            <pre>checked="{ {checked} }"</pre>
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
            <pre style="color: {{style.color}}">style="color: { {style.color} }"</pre>
            <br>
            <button onclick="{{style.change}}">Change Color</button>
        </section>

        <section id="class">
            <h3>Class Binder</h3>
            <br>
            <pre class="default {{class.lightgreen}}">class="default { {class.lightgreen} }"</pre>
            <br>
            <pre class="default {{class.lightblue(class.active)}}">class="default { {class.lightblue(class.active)} }"</pre>
            <br>
            <button onclick="{{class.toggle}}">Toggle Active</button>
        </section>

    `;

};
