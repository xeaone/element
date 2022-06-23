import XElement from './x-element.js';
import Highlight from './highlight.js';
import Color from './modules/color.js';

export default class XGuide extends XElement {

    static observedProperties = [
        'highlight',

        'title', 'text',
        'checked',
        'radioOne', 'radioTwo',
        'color', 'colorChange',
        'active', 'lightblue', 'classToggle',
        'value',
        'fruit', 'fruits', 'plant', 'cars',

        'form', 'agree', 'disabled', 'lastName', 'firstName', 'favoriteNumber', 'submit'
    ];


    title = 'Guide';
    text = 'Hello World';

    checked = true;

    radioOne = undefined;
    radioTwo = undefined;

    color = Color();
    colorChange () { this.color = Color(); }

    active = true;
    lightblue = active => active ? 'lightblue' : '';
    classToggle () { this.active = !this.active; }

    value = { text: 'hello world' };

    fruit = 'Orange';
    fruits = [ 'Apple', 'Orange', 'Tomato' ];

    plant = undefined;
    cars = [];

    form = '';
    agree = true;
    disabled = false;
    lastName = 'bond';
    firstName = 'james';
    favoriteNumber = undefined;
    submit (form) {
        this.form = JSON.stringify(form, null, '\t');
        console.log(form);
        console.log(this);
    }

    highlight (query) {
        return Highlight(this.querySelector(query).innerHTML, 'html')
            .replace(/{{/g, '{&zwnj;{').replace(/}}/g, '}&zwnj;}').replace(/^(\t{4}|\s{16})/mg, '').slice(1);
    }

    constructor () {
        super();
        this.shadowRoot.innerHTML = '<slot></slot>';
    }

    connectedCallback () {
        if (this.innerHTML) return;
        this.innerHTML = this.#html;
        document.body.style.opacity = 1;
    }

    #html = /*html*/`
    <style>
        .default {
            border: solid 5px transparent;
        }
        .class-color {
            border-color: var(--accent);
        }
    </style>

    <section id="text">
        <h3>Text Binder</h3>
        <pre>
            <code html="{{highlight('#text-demo')}}"></code>
            <div id="text-demo">
                <span>{{text}}</span>
            </div>
        </pre>
    </section>

    <section id="checked">
        <h3>Checked Binder</h3>
        <pre>
            <code html="{{highlight('#checked-demo')}}"></code>
            <div id="checked-demo">
                <input type="checkbox" value="{{checked}}" checked="{{checked = $checked}}"> Checkbox {{checked ? 'checked' : ''}}
            </div>
        </pre>
        <pre>
            <code html="{{highlight('#radio-demo')}}"></code>
            <div id="radio-demo">
                <input type="radio" name="radio" value="one" checked="{{radioOne = $checked}}"> Radio One {{radioOne ? 'checked' : ''}}
                <input type="radio" name="radio" value="two" checked="{{radioTwo = $checked}}"> Radio Two {{radioTwo ? 'checked' : ''}}
            </div>
        </pre>
    </section>

    <section id="style">
        <h3>Style Binder</h3>
        <pre>
            <code html="{{highlight('#style-demo')}}"></code>
            <div id="style-demo">
                <span style="color: {{color}}">Look at my style</span>
                <button onclick="{{colorChange()}}">Change Color</button>
            </div>
        </pre>
    </section>

    <section id="class">
        <h3>Class Binder</h3>
        <pre>
            <code html="{{highlight('#class-demo')}}"></code>
            <div id="class-demo">
                <span class="default {{active ? 'class-color' : ''}}">Look at my class</span>
                <button onclick="{{classToggle()}}">Toggle Active</button>
            </div>
        </pre>
    </section>

    <section id="value">
        <h3>Value Binder</h3>
        <pre>
            <code html="{{highlight('#value-demo')}}"></code>
            <div id="value-demo">
                <input value="{{value.text = $value.toUpperCase()}}">
                <input value="{{value.text = $value.toLowerCase()}}">
                <span>{{value.text}}</span>
            </div>
        </pre>
    </section>

    <section id="each">
        <h3>Each Binder</h3>
        <pre>
            <code html="{{highlight('#each-demo')}}"></code>
            <div id="each-demo">
                <div each="{{[ fruits, 'fruit', 'key', 'index' ]}}">
                    <div id="{{fruit}}">
                        <strong>Key: </strong>{{key}},
                        <strong>Index: </strong>{{index}},
                        <strong>Value: </strong>{{fruit}}
                    </div>
                </div>
            </div>
        </pre>
    </section>

    <section id="select">
        <h3>Select Binder</h3>
        <pre>
            <code html="{{highlight('#plant-demo')}}"></code>
            <div id="plant-demo">
                <select value="{{plant = $value}}">
                    <option value="tree">Tree</option>
                    <option value="cactus">Cactus</option>
                </select>
                <span>{{plant}}</span>
            </div>
        </pre>
        <pre>
            <code html="{{highlight('#fruit-demo')}}"></code>
            <div id="fruit-demo">
                <select value="{{fruit = $value}}" each="{{[fruits, 'fruit']}}">
                    <option value="{{fruit}}">{{fruit}}</option>
                </select>
                <span>{{fruit}}</span>
            </div>
        </pre>
        <pre>
            <code html="{{highlight('#cars-demo')}}"></code>
            <div id="cars-demo">
                <select value="{{cars = $value}}" multiple>
                    <option value="volvo">Volvo</option>
                    <option value="saab">Saab</option>
                    <option value="opel">Opel</option>
                    <option value="audi">Audi</option>
                </select>
                <span>{{cars}}</span>
            </div>
        </pre>
    </section>

    <section id="html">
        <h3>HTML Binder</h3>
        <pre>
            <code html="{{highlight('#html-demo')}}"></code>
            <div id="html-demo">
                <div html="{{'<strong>Hyper Text Markup Language</strong>'}}"></div>
            </div>
        </pre>
    </section>

    <section id="submit">
        <h3>Submit Binder</h3>
        <br>
        <form onsubmit="{{submit($form)}}">
            <div>{{firstName}}</div>
            <input disabled="{{disabled}}" name="name.first" value="{{firstName = $value}}" placeholder="first name">
            <div>{{lastName}}</div>
            <input name="name.last" value="{{$value ?? lastName}}" placeholder="last name">
            <br>
            <br>
            <input type="checkbox" name="agree" value="{{agree ? 'yes' : 'no'}}" checked="{{agree = $checked}}">Agree? {{agree ? 'yes': 'no'}}
            <br>
            <br>
            <strong>Animal:</strong>
            <input type="radio" name="animal" value="{{'dogs'}}" checked="{{$checked}}">Dogs
            <input type="radio" name="animal" value="cats" checked="{{$checked}}">Cats
            <br>
            <br>
            <div>{{favoriteNumber}}</div>
            <input name="favoriteNumber" type="number" value="{{favoriteNumber = $value ?? NaN}}">
            <br>
            <br>
            <input type="submit" value="submit">
        </form>
        <br>
        <pre>{{form}}</pre>
    </section>

    `;

}

