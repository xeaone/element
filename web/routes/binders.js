import Code from '../../modules/code.js';
import Color from '../../modules/color.js';

const { Component } = Oxe;

export default class BindersRoute extends Component {

    title = 'Binders';

    data = {

        // text
        text: 'Hello World',

        // checkbox
        // check: 'checked',
        // checked: false,
        // checkResult: checked => checked ? 'checked' : '',
        // checkInput () { console.log(this.checked); },

        // // style
        // color: Color(),
        // styleChange: () => this.color = Color(),

        // // class
        // active: true,
        // lightblue: active => active ? 'lightblue' : '',
        // classToggle: () => this.active = !this.active,

        // value: {
        //     out: '',
        //     text: 'hello world',
        //     upper (text) { return text?.toUpperCase(); },
        // },

        // fruits: [
        //     { name: 'apple' },
        //     { name: 'orange' },
        //     { name: 'tomato' }
        // ],

        // selectResult: undefined,
        // // selectResult: 'tree',
        // // selectResult: 'cactus',

        // radio: false,
        // agree: false,
        // submit (event, data) {
        //     console.log(data);
        // },

        // firstName: '',
        // lastName: '',

    };

    css = /*css*/`
        .default {
            border: solid 5px transparent;
        }
        .lightblue {
            border-color: lightblue;
        }
    `;

    html = /*html*/ `

        <section id="text">
            <h3>Text Binder</h3>
            <pre>${Code(`<span>{{text}}</span>`, true)}</pre>
            <pre>${Code(`<span>{{text}}</span>`)}</pre>
        </section>

        <!--
        <section id="checked">
            <h3>Checked Binder</h3>
            <br>
            <pre>${Code(`<input value="{{checked}}" checked="{{checked}}" type="checkbox">`, true)}</pre>
            <pre>${Code(`<input value="{{checked}}"{{checked ? ' checked' : ''}} type="checkbox">`)}</pre>
            <br>
            <input value="{{checked}}" checked="{{checked}}" type="checkbox" oninput="{{checkInput()}}">
            <i>checked boolean value and checked attribute</i>
        </section>

        <section id="style">
            <h2>Style Binder</h2>
            <br>
            <pre style="color: {{color}}">${Code(`<div style="color: {{color}}">Look at my style</div>`, true)}</pre>
            <pre style="color: {{color}}">${Code(`<div style="color: {{color}}">Look at my style</div>`)}</pre>
            <br>
            <button onclick="{{styleChange()}}">Change Color</button>
        </section>

        <section id="class">
            <h3>Class Binder</h3>
            <br>
            <pre class="default {{lightblue(active)}}">${Code(`class="default {{lightblue(active)}}"`, true)}</pre>
            <pre class="default {{lightblue(active)}}">class="default {{lightblue(active)}}"</pre>
            <br>
            <button onclick="{{classToggle()}}">Toggle Active</button>
        </section>

        <section id="value">
            <h3>Value Binder</h3>
            <br>
            <pre style="white-space: pre-line;">${Code(`
                <div>{{value.text}}</div>
                <input value="{{value.text}}" oninput="{{value.upper(value.text)}}">
            `, true)}</pre>
            <br>
            <div>{{value.out}}</div>
            <div>{{value.text}}</div>
            <br>
            <input value="{{value.out = $value.toUpperCase()}}">
            <input value="{{value.out = value.upper($event?.target.value ?? '')}}">
            <input value="{{value.upper($value)}}">
        </section>

        <!--
        <section id="select">
            <h3>Select Binder</h3>
            <br>
            <div>{{selectResult}}</div>
            <select value="{{selectResult = $value}}">
                <option value="tree">Tree</option>
                <option value="cactus">Cactus</option>
            </select>
            <br>
            <div>{{multipleSelectResult}}</div>
            <select value="{{multipleSelectResult}}" multiple>
                <option value="volvo">Volvo</option>
                <option value="saab">Saab</option>
                <option value="opel">Opel</option>
                <option value="audi">Audi</option>
            </select>
            <br>
            <div>{{selectForResult}}</div>
            <select value="{{selectForResult}}" each="{{fruit of fruits}}">
                <option value="{{fruit.name}}">{{fruit.name}}</option>
            </select>
        </section>

        <section id="each">
            <h3>Each Binder</h3>
            <br>
            <pre>${Code(`Fruits: each="{{key, index, fruit of fruits}}"`, true)}</pre>
            <div each="{{key, index, fruit of fruits}}">
                <div id="{{fruit.name}}">
                    <strong>Key: </strong>{{key}},
                    <strong>Index: </strong>{{index}},
                    <strong>Value: </strong>{{fruit.name}}
                </div>
            </div>
        </section>

        <section>
            <h3>Submit Binder</h3>
            <br>
            <form onsubmit="{{submit}}">
                <input name="name.first" value="{{firstName = $v}}" placeholder="first name">
                <input name="name.last" value="{{lastName = $v}}" placeholder="last name">
                <br>
                <br>
                <input type="checkbox" name="agree" value="{{agree}}" checked="{{agree}}">Agree?
                <br>
                <br>
                <input type="radio" name="radio" value="one" checked="{{radio}}">One
                <br>
                <input type="radio" name="radio" value="two" checked="{{radio}}">Two
                <br>
                <br>
                <input type="submit" value="submit">
            </form>
        </section>
        -->

    `;

};




