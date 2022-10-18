import XElement from './x-element.js';
import Highlight from './highlight.js';
import Color from './modules/color.js';

const html = /*html*/`

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
    <template id="text-template">
        <span text="{{text}}"></span>
        <span>One: {{text}} Two: {{text}}</span>
    </template>
    <pre html="{{highlight('#text-template')}}"></pre>
    <article html="{{result('#text-template')}}"></article>
</section>

<section id="checked">
<h3>Checked Binder</h3>
    <template id="checked-template">
        <input type="checkbox" checked="{{ checked = event ? this.checked : checked }}" value="{{ checked }}" />
        <span>Checkbox {{ checked ? 'checked' : '' }}</span>
    </template>
    <pre html="{{highlight('#checked-template')}}"></pre>
    <article html="{{result('#checked-template')}}"></article>

    <template id="radio-template">
        <span>Value: {{radioValue}}</span>

        <input type="radio" name="radio" value="{{ radioValue = radioOne ? 'one' : radioValue }}" checked="{{ radioOne = event ? this.checked : radioOne }}" />
        <span> Radio One </span>
        <span text="{{radioOne ? 'checked' : ''}}"></span>

        <input type="radio" name="radio" value="{{ radioValue = radioTwo ? 'two' : radioValue }}" checked="{{ radioTwo = event ? this.checked : radioTwo }}" />
        <span> Radio Two </span>
        <span text="{{radioTwo ? 'checked' : ''}}"></span>
    </template>
    <pre html="{{highlight('#radio-template')}}"></pre>
    <article html="{{result('#radio-template')}}"></article>
</section>

<section id="style">
    <h3>Style Binder</h3>
    <template id="style-template">
        <span style="{{ 'color:' + color }}">Look at my style</span>
        <button onclick="{{colorChange()}}">Change Color</button>
    </template>
    <pre html="{{highlight('#style-template')}}"></pre>
    <article html="{{result('#style-template')}}"></article>
</section>

<section id="class">
    <h3>Class Binder</h3>
    <template id="class-template">
        <span class="{{ active ? 'default class-color' : 'default' }}">Look at my class</span>
        <button onclick="{{classToggle()}}">Toggle Active</button>
    </template>
    <pre html="{{highlight('#class-template')}}"></pre>
    <article html="{{result('#class-template')}}"></article>
</section>

<section id="value">
    <h3>Value Binder</h3>
    <template id="value-template">
        <input value="{{ value.text = $value ?? value.text }}" >
        <input value="{{ value.text = event ? this.value : value.text }}" >
        <span>{{value.text}}</span>
    </template>
    <pre html="{{highlight('#value-template')}}"></pre>
    <article html="{{result('#value-template')}}"></article>
</section>

<section id="each">
    <h3>Each Binder</h3>
    <template id="each-template">
        <div each="{{[ fruits, 'value', 'key', 'index' ]}}">
            <div id="{{fruit}}">
                <strong>Key: </strong>{{key}},
                <strong>Index: </strong>{{index}},
                <strong>Value: </strong>{{value}}
            </div>
        </div>
    </template>
    <pre html="{{highlight('#each-template')}}"></pre>
    <article html="{{result('#each-template')}}"></article>
</section>

<section id="select">
    <h3>Select Binder</h3>

    <template id="plant-template">
        <select value="{{plant = $value ?? plant}}">
            <option value="tree">Tree</option>
            <option value="cactus">Cactus</option>
        </select>
        <span>{{plant}}</span>
    </template>
    <pre html="{{highlight('#plant-template')}}"></pre>
    <article html="{{result('#plant-template')}}"></article>

    <template id="fruit-template">
        <select value="{{fruit = $value ?? fruit}}" each="{{[ fruits, 'value' ]}}">
            <option value="{{value}}">{{value}}</option>
        </select>
        <span>{{fruit}}</span>
    </template>
    <pre html="{{highlight('#fruit-template')}}"></pre>
    <article html="{{result('#fruit-template')}}"></article>

    <template id="cars-template">
        <select value="{{cars = $value ?? cars}}" multiple>
            <option value="volvo">Volvo</option>
            <option value="saab">Saab</option>
            <option value="opel">Opel</option>
            <option value="audi">Audi</option>
        </select>
        <span>{{cars}}</span>
    </template>
    <pre html="{{highlight('#cars-template')}}"></pre>
    <article html="{{result('#cars-template')}}"></article>
</section>

<section id="html">
    <h3>HTML Binder</h3>
        <template id="html-template">
        <div html="{{'<strong>Hyper Text Markup Language</strong>'}}"></div>
    </template>
    <pre html="{{highlight('#html-template')}}"></pre>
    <article html="{{result('#html-template')}}"></article>
</section>

<!--
<section id="submit">
<h3>Submit Binder</h3>
<template id="submit-template">
    <form onsubmit="{{submit($form)}}">
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
        <input name="favoriteNumber" type="number" value="{{favoriteNumber = $value}}">
        <br>
        <input type="submit" value="submit">
    </form>
</template>
<pre html="{{highlight('#submit-template')}}"></pre>
<div html="{{result('#submit-template')}}"></div>
<pre>{{form}}</pre>
</section>

<section id="routing">
<h3>Routing</h3>
<template id="routing-template">
    import XElement from './x-element.js';

    window.navigation.addEventListener('navigate', function () { console.log('nav before'); });

    XElement.navigation('/', './root.js');
    XElement.navigation('/guide', './guide.js');
    XElement.navigation('/*', './all.js');

    window.navigation.addEventListener('navigate', function () { console.log('nav after'); });
</template>
<pre html="{{highlight('#routing-template', 'js')}}"></pre>
</section>
-->
`;

export default class XGuide extends XElement {

    title = 'Guide';
    text = 'Hello World';

    checked = true;

    radioOne = undefined;
    radioTwo = undefined;
    radioValue = undefined;

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
    test = [];

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

    highlight (query, type) {
        type = type ?? 'html';
        let result = this.querySelector(query).innerHTML;
        result = result.replace(/\s*\n+$/gm, '');
        result = result.replace(/^\s*\n+/gm, '');
        result = result.replace(/^[ ]{4}/gm,'');
        result = Highlight(result, type);
        if (type === 'html') result = result.replace(/{{/g, '{&zwnj;{').replace(/}}/g, '}&zwnj;}');
        return result;
    }

    result (query) {
        // console.log('result', this);
        return this.querySelector(query);
    }

    constructor () {
        super();
        this.shadowRoot.innerHTML = '<slot></slot>';
        // this.innerHTML = html;
    }

    async connectedCallback () {
        if (!this.hasChildNodes()) this.innerHTML = html;
        this.shadowRoot.innerHTML = '<slot></slot>';
        await super.connectedCallback();
    }

    async disconnectedCallback () {
        this.shadowRoot.innerHTML = '';
        await super.disconnectedCallback();
    }

}

