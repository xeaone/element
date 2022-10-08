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
    <span>{{text}}</span>
</template>
<pre html="{{highlight('#text-template')}}"></pre>
<pre html="{{result('#text-template')}}"></pre>
</section>

<section id="checked">
<h3>Checked Binder</h3>
<template id="checked-template">
    <input type="checkbox" value="{{checked}}" checked="{{checked = $checked}}"> Checkbox {{checked ? 'checked' : ''}}
</template>
<pre html="{{highlight('#checked-template')}}"></pre>
<pre  html="{{result('#checked-template')}}"></pre>
<template id="radio-template">
    <input type="radio" name="radio" value="one" checked="{{radioOne = $checked}}"> Radio One {{radioOne ? 'checked' : ''}}
    <input type="radio" name="radio" value="two" checked="{{radioTwo = $checked}}"> Radio Two {{radioTwo ? 'checked' : ''}}
</template>
<pre html="{{highlight('#radio-template')}}"></pre>
<pre html="{{result('#radio-template')}}"></pre>
</section>

<section id="style">
<h3>Style Binder</h3>
<template id="style-template">
    <span style="{{'color:' + color}}">Look at my style</span>
    <button onclick="{{colorChange()}}">Change Color</button>
</template>
<pre html="{{highlight('#style-template')}}"></pre>
<pre html="{{result('#style-template')}}"></pre>
</section>

<section id="class">
<h3>Class Binder</h3>
<template id="class-template">
    <span class="{{active ? 'default class-color' : 'default'}}">Look at my class</span>
    <button onclick="{{classToggle()}}">Toggle Active</button>
</template>
<pre html="{{highlight('#class-template')}}"></pre>
<pre html="{{result('#class-template')}}"></pre>
</section>

<section id="value">
<h3>Value Binder</h3>
<template id="value-template">
    <span>{{value.text}}</span>

    <input value="{{ this.value = this.value || value.text }}" oninput="">

    <input value="{{ (value.text = $value)?.toUpperCase() }}">
    <input value="{{ value.text = this.value?.toUpperCase() }}">

    <input value="{{ value.text = this.value?.toLowerCase() }}">
    <input value="{{ (value.text = this.value)?.toLowerCase() }}">

    <!--
    <input value="{{ value.text = this.value?.toUpperCase() }}">

    <input value="{{ $value = (value.text = $value)?.toUpperCase() }}">
    <input value="{{(value.text = this.value)?.toUpperCase()}}">

    <input value="{{(value.text = $value)?.toLowerCase()}}">
    <input value="{{(value.text = this.value)?.toLowerCase()}}">
    -->

</template>
<pre html="{{highlight('#value-template')}}"></pre>
<pre html="{{result('#value-template')}}"></pre>
</section>

<section id="each">
<h3>Each Binder</h3>
<template id="each-template">
    <div each="{{[ fruits, 'ff', 'key', 'index' ]}}">
        <div id="{{ff}}">
            <strong>Key: </strong>{{key}},
            <strong>Index: </strong>{{index}},
            <strong>Value: </strong>{{ff}}
        </div>
    </div>
</template>
<pre html="{{highlight('#each-template')}}"></pre>
<pre html="{{result('#each-template')}}"></pre>
</section>

<section id="select">
<h3>Select Binder</h3>
<template id="plant-template">
    <span>{{plant}}</span>
    <select value="{{plant = $value}}">
        <option value="tree">Tree</option>
        <option value="cactus">Cactus</option>
    </select>
</template>
<pre html="{{highlight('#plant-template')}}"></pre>
<pre html="{{result('#plant-template')}}"></pre>
<template id="fruit-template">
    <span>{{fruit}}</span>
    <select value="{{fruit = $value}}" each="{{[fruits, 'f']}}">
        <option value="{{f}}">{{f}}</option>
    </select>
</template>
<pre html="{{highlight('#fruit-template')}}"></pre>
<pre html="{{result('#fruit-template')}}"></pre>
<template id="cars-template">
    <span>{{cars}}</span>
    <select value="{{cars = $value}}" multiple>
        <option value="volvo">Volvo</option>
        <option value="saab">Saab</option>
        <option value="opel">Opel</option>
        <option value="audi">Audi</option>
    </select>
</template>
<pre html="{{highlight('#cars-template')}}"></pre>
<pre html="{{result('#cars-template')}}"></pre>
</section>

<section id="html">
<h3>HTML Binder</h3>
<template id="html-template">
    <div html="{{'<strong>Hyper Text Markup Language</strong>'}}"></div>
</template>
<pre html="{{highlight('#html-template')}}"></pre>
<pre html="{{result('#html-template')}}"></pre>
</section>

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

`;

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
        console.log(this.favoriteNumber);
        this.form = JSON.stringify(form, null, '\t');
        console.log(form);
        console.log(this);
    }

    highlight (query, type) {
        type = type ?? 'html';
        let result = this.querySelector(query).innerHTML;
        if (type === 'html') result = result.replace(/^(\t{4}|\s{16})/mg, '').slice(1);
        result = Highlight(result, type);
        if (type === 'html') result = result.replace(/{{/g, '{&zwnj;{').replace(/}}/g, '}&zwnj;}');
        return result;
    }

    result (query) {
        return this.querySelector(query);
    }

    async connectedCallback () {
        if (!this.hasChildNodes()) this.innerHTML = html;
        await super.connectedCallback();
        this.shadowRoot.innerHTML = '<slot></slot>';
    }

    async disconnectedCallback () {
        this.shadowRoot.innerHTML = '';
        await super.disconnectedCallback();
    }

}

