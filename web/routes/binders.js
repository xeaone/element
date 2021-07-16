import Code from '../../modules/code.js';
import Color from '../../modules/color.js';

const { Component } = Oxe;

export default class BindersRoute extends Component {

    static attributes = [ 'test' ];
    async attributed () { console.log(arguments); }

    async connected () { console.log('binders connected'); }

    title = 'Binders';

    data = {

        text: 'Hello World',

        checked: true,
        check: 'checked',
        checkResult: checked => checked ? 'checked' : '',
        checkInput () { console.log(this.checked); },

        color: Color(),
        colorChange () { this.color = Color(); },

        active: true,
        lightblue: active => active ? 'lightblue' : '',
        classToggle () { this.active = !this.active; },

        value: {
            text: 'hello world',
            upper: text => text?.toUpperCase(),
        },

        fruits: [
            { name: 'apple' },
            { name: 'orange' },
            { name: 'tomato' }
        ],

        selectedPlant: null,
        selectEachResult: 'orange',

        radio: false,
        agree: true,
        firstName: 'james',
        lastName: 'bond',
        submit (form) { console.log(form); }

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

        <section id="checked">
            <h3>Checked Binder</h3>
            <br>
            <pre>${Code(`<input type="checkbox" value="{{checked}}" checked="{{checked = $checked}}">`, true)}</pre>
            <pre>${Code(`<input type="checkbox" value="{{checked}}"{{checked ? ' checked' : ''}}>`)}</pre>
            <br>
            <label>
                <input value="{{checked}}" checked="{{checked = $checked}}" type="checkbox" onchange="{{checkInput()}}"> Checkbox
            </label>
            <br>
            <pre>${Code(`
            <input type="radio" name="radio" value="one">
            <input type="radio" name="radio" value="two">
            `, true)}</pre>
            <pre>${Code(`
            <input type="radio" name="radio" value="one"{{r1 ? ' checked': ''}}>
            <input type="radio" name="radio" value="two"{{r2 ? ' checked': ''}}>
            `)}</pre>
            <br>
            <label>
                <input type="radio" name="radio" value="one" checked="{{r1=$c}}"> Radio One
            </label>
            <label>
                <input type="radio" name="radio" value="two" checked="{{r2=$c}}"> Radio Two
            </label>
        </section>

        <section id="style">
            <h2>Style Binder</h2>
            <br>
            <pre style="color: {{color}}">${Code(`<div style="color: {{color}}">Look at my style</div>`, true)}</pre>
            <pre style="color: {{color}}">${Code(`<div style="color: {{color}}">Look at my style</div>`)}</pre>
            <br>
            <button onclick="{{colorChange()}}">Change Color</button>
        </section>

        <section id="class">
            <h3>Class Binder</h3>
            <br>
            <pre class="default {{lightblue(active)}}">${Code(`class="default {{lightblue(active)}}"`, true)}</pre>
            <pre class="default {{lightblue(active)}}">${Code(`class="default {{lightblue(active)}}"`)}</pre>
            <pre class="default {{active ? 'lightblue' : ''}}">${Code(`class="default {{active ? 'lightblue' : ''}}"`, true)}</pre>
            <pre class="default {{active ? 'lightblue' : ''}}">${Code(`class="default {{active ? 'lightblue' : ''}}"`)}</pre>
            <br>
            <button onclick="{{classToggle()}}">Toggle Active</button>
        </section>

        <section id="value">
            <h3>Value Binder</h3>
            <br>
            <pre>${Code(`
            <strong>{{value.text}}</strong>
            <input value="{{value.text = $value.toUpperCase() }}">
            <input value="{{(value.text = $value).toLowerCase()}}">`, true)}</pre>
            <br>
            <strong>{{value.text}}</strong>
            <br>
            <input value="{{value.text = $value.toUpperCase() }}">
            <input value="{{(value.text = $value).toLowerCase()}}">
        </section>

        <section id="each">
            <h3>Each Binder</h3>
            <br>
            <pre>${Code(`
            <div each="{{key, index, fruit of fruits}}">
                <div id="{{fruit.name}}">
                    <strong>Key: </strong>{{key}},
                    <strong>Index: </strong>{{index}},
                    <strong>Value: </strong>{{fruit.name}}
                </div>
            </div>`, true)}</pre>
            <br>
            <div each="{{key, index, fruit of fruits}}">
                <div id="{{fruit.name}}">
                    <strong>Key: </strong>{{key}},
                    <strong>Index: </strong>{{index}},
                    <strong>Value: </strong>{{fruit.name}}
                </div>
            </div>
        </section>

        <section id="select">
            <h3>Select Binder</h3>
            <br>
            <pre>${Code(`
            <div>{{selectResult}}</div>
            <select value="{{selectedPlant = $value}}">
                <option value="tree">Tree</option>
                <option value="cactus">Cactus</option>
            </select>`, true)}</pre>
            <br>
            <div>{{selectedPlant}}</div>
            <select value="{{selectedPlant = $value}}">
                <option value="tree">Tree</option>
                <option value="cactus">Cactus</option>
            </select>
            <br>
            <pre>${Code(`
            <div>{{selectEachResult}}</div>
            <select value="{{selectEachResult = $value}}" each="{{fruit of fruits}}">
                <option value="{{fruit.name}}">{{fruit.name}}</option>
            </select>`, true)}</pre>
            <br>
            <div>{{selectEachResult}}</div>
            <select value="{{selectEachResult = $value}}" each="{{fruit of fruits}}">
                <option value="{{fruit.name}}">{{fruit.name}}</option>
            </select>
            <br>
            <pre>${Code(`
            <div>{{multipleSelectResult}}</div>
            <select value="{{multipleSelectResult = $value}}" multiple>
                <option value="volvo">Volvo</option>
                <option value="saab">Saab</option>
                <option value="opel">Opel</option>
                <option value="audi">Audi</option>
            </select>`, true)}</pre>
            <br>
            <div>{{multipleSelectResult}}</div>
            <select value="{{multipleSelectResult = $value}}" multiple>
                <option value="volvo">Volvo</option>
                <option value="saab">Saab</option>
                <option value="opel">Opel</option>
                <option value="audi">Audi</option>
            </select>
        </section>

        <section>
            <h3>Submit Binder</h3>
            <br>
            <form onsubmit="{{submit($form)}}">
                <div>{{firstName}}</div>
                <input name="name.first" value="{{firstName = $v}}" placeholder="first name">
                <div>{{lastName}}</div>
                <input name="name.last" value="{{$v ?? lastName}}" placeholder="last name">
                <br>
                <br>
                <input type="checkbox" name="agree" value="{{agree?'yes':'no'}}" checked="{{agree=$c}}">Agree? {{agree?'yes':'no'}}
                <br>
                <br>
                <strong>Animal:</strong>
                <input type="radio" name="animal" value="{{'dogs'}}" checked="{{$c}}">Dogs
                <input type="radio" name="animal" value="cats" checked="{{$c}}">Cats
                <br>
                <br>
                <div>{{favoriteNumber}}</div>
                <input name="favoriteNumber" type="number" value="{{favoriteNumber = $value}}">
                <br>
                <br>
                <input type="submit" value="submit">
            </form>
        </section>

    `;

};




