import XElement from './x-element.js';
import Highlight from './highlight.js';
import Color from './modules/color.js';

export default class XGuide extends XElement {

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

    async highlight (query) {
       return Highlight(this.querySelector(query).innerHTML, 'html')
            .replace(/{{/g, '{&zwnj;{').replace(/}}/g, '}&zwnj;}').replace(/^(\t{4}|\s{16})/mg, '').slice(1);
    }

    result (query) {
        return this.querySelector(query);
    }

    constructor () {
        super();
        this.shadowRoot.innerHTML = '<slot></slot>';
    }

    connectedCallback () {
        if (this.innerHTML) return;
        this.innerHTML = this.#html;
        // document.body.style.opacity = 1;
        // const expression = document.createExpression(".//*[contains(@*,'{{') or contains(text(),'{{')]");
        // const matches = expression.evaluate(this);
        // console.log(matches);
        // let match;
        // while(match = matches.iterateNext()){
        //     console.log(match)
        // }
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
            <template id="text-template">
                <span>{{text}}</span>
            </template>
            <code html="{{highlight('#text-template')}}"></code>
            <div html="{{result('#text-template')}}"></div>
        </pre>
    </section>

    <section id="checked">
        <h3>Checked Binder</h3>
        <pre>
            <template id="checked-template">
                <input type="checkbox" value="{{checked}}" checked="{{checked = $checked}}"> Checkbox {{checked ? 'checked' : ''}}
            </template>
            <code html="{{highlight('#checked-template')}}"></code>
            <div  html="{{result('#checked-template')}}"></div>
        </pre>
        <pre>
            <template id="radio-template">
                <input type="radio" name="radio" value="one" checked="{{radioOne = $checked}}"> Radio One {{radioOne ? 'checked' : ''}}
                <input type="radio" name="radio" value="two" checked="{{radioTwo = $checked}}"> Radio Two {{radioTwo ? 'checked' : ''}}
            </template>
            <code html="{{highlight('#radio-template')}}"></code>
            <div html="{{result('#radio-template')}}"></div>
        </pre>
    </section>

    <section id="style">
        <h3>Style Binder</h3>
        <pre>
            <template id="style-template">
                <span style="{{'color:' + color}}">Look at my style</span>
                <button onclick="{{colorChange()}}">Change Color</button>
            </template>
            <code html="{{highlight('#style-template')}}"></code>
            <div html="{{result('#style-template')}}"></div>
        </pre>
    </section>

    <section id="class">
        <h3>Class Binder</h3>
        <pre>
            <template id="class-template">
                <span class="{{active ? 'default class-color' : 'default'}}">Look at my class</span>
                <button onclick="{{classToggle()}}">Toggle Active</button>
            </template>
            <code html="{{highlight('#class-template')}}"></code>
            <div html="{{result('#class-template')}}"></div>
        </pre>
    </section>

    <section id="value">
        <h3>Value Binder</h3>
        <pre>
            <template id="value-template">
                <span>{{value.text}}</span>
                <input value="{{value.text = $value.toUpperCase()}}">
                <input value="{{value.text = $value.toLowerCase()}}">
            </template>
            <code html="{{highlight('#value-template')}}"></code>
            <div html="{{result('#value-template')}}"></div>
        </pre>
    </section>

    <section id="each">
        <h3>Each Binder</h3>
        <pre>
            <template id="each-template">
                <div each="{{[ fruits, 'ff', 'key', 'index' ]}}">
                    <div id="{{ff}}">
                        <strong>Key: </strong>{{key}},
                        <strong>Index: </strong>{{index}},
                        <strong>Value: </strong>{{ff}}
                    </div>
                </div>
            </template>
            <code html="{{highlight('#each-template')}}"></code>
            <div html="{{result('#each-template')}}"></div>
        </pre>
    </section>

    <section id="select">
        <h3>Select Binder</h3>
        <pre>
            <template id="plant-template">
                <span>{{plant}}</span>
                <select value="{{plant = $value}}">
                    <option value="tree">Tree</option>
                    <option value="cactus">Cactus</option>
                </select>
            </template>
            <code html="{{highlight('#plant-template')}}"></code>
            <div html="{{result('#plant-template')}}"></div>
        </pre>
        <pre>
            <template id="fruit-template">
                <span>{{fruit}}</span>
                <select value="{{fruit = $value}}" each="{{[fruits, 'f']}}">
                    <option value="{{f}}">{{f}}</option>
                </select>
            </template>
            <code html="{{highlight('#fruit-template')}}"></code>
            <div html="{{result('#fruit-template')}}"></div>
        </pre>
        <pre>
            <template id="cars-template">
                <span>{{cars}}</span>
                <select value="{{cars = $value}}" multiple>
                    <option value="volvo">Volvo</option>
                    <option value="saab">Saab</option>
                    <option value="opel">Opel</option>
                    <option value="audi">Audi</option>
                </select>
            </template>
            <code html="{{highlight('#cars-template')}}"></code>
            <div html="{{result('#cars-template')}}"></div>
        </pre>
    </section>

    <section id="html">
        <h3>HTML Binder</h3>
        <pre>
            <template id="html-template">
                <div html="{{'<strong>Hyper Text Markup Language</strong>'}}"></div>
            </template>
            <code html="{{highlight('#html-template')}}"></code>
            <div html="{{result('#html-template')}}"></div>
        </pre>
    </section>

    <section id="submit">
        <h3>Submit Binder</h3>
        <pre>
            <template id="submit-template">
                <form onsubmit="{{submit($form)}}" reset>
                    <div>{{firstName}}</div>
                    <input disabled="{{disabled}}" name="name.first" value="{{firstName = $value}}" placeholder="first name">
                    <div>{{lastName}}</div>
                    <input name="name.last" value="{{$value ?? lastName}}" placeholder="last name">
                    <br>
                    <input type="checkbox" name="agree" value="{{agree ? 'yes' : 'no'}}" checked="{{agree = $checked}}">Agree? {{agree ? 'yes': 'no'}}
                    <br>
                    <strong>Animal:</strong>
                    <input type="radio" name="animal" value="{{'dogs'}}" checked="{{$checked}}">Dogs
                    <input type="radio" name="animal" value="cats" checked="{{$checked}}">Cats
                    <br>
                    <div>{{favoriteNumber}}</div>
                    <input name="favoriteNumber" type="number" value="{{favoriteNumber = $value ?? NaN}}">
                    <br>
                    <input type="submit" value="submit">
                </form>
            </template>
            <code html="{{highlight('#submit-template')}}"></code>
        </pre>
        <div html="{{result('#submit-template')}}"></div>
        <pre>{{form}}</pre>
    </section>

    `;

}

