import highlight from './modules/highlight.js';
import Color from './modules/color.js';
import { html } from '../source/index';

let input = 'hello world';
let checked = true;
let color = Color();
let active = true;
let radioShared = 'two';
let radioOne = 'one';
let radioTwo = 'two';
let boolean = true;
let number = 1;
let fruit = 'Orange';
let fruits = [ 'Apple', 'Orange', 'Tomato' ];
let car = [ 'ford' ];
let cars = [ 'tesla', 'ford', 'chevy' ];
// let tag = 'div';

// deno-fmt-ignore
const inputComponent = () => html`
<div>${() => input}</div>
<input value=${() => input} oninput=${e => input = e.target.value} />
`;

// deno-fmt-ignore
const checkComponent = () => html`
<div>${() => checked ? 'Is Checked' : 'Is Not Checked'}</div>
<input type="checkbox"
    ${() => checked ? 'checked' : ''}
    oninput=${e => checked = e.target.checked}
/>
`;

// deno-fmt-ignore
const radioComponent = () => html`
<div>${() => radioShared}</div>

<input type="radio" name="radio"
    value="one"
    oninput=${(e) => radioShared = e.target.value}
    checked=${(e) => radioShared === e.target.value}
/>

<input type="radio" name="radio"
    value="two"
    oninput=${(e) => radioShared = e.target.value}
    ${(e) => radioShared === e.target.value ? 'checked' : ''}
/>
`;

// deno-fmt-ignore
const classComponent = () => html`
<div class=${() => active ? 'default class-color' : 'default'}>Look at my class</div>
<button onclick=${() => active = !active}>Toggle Class</button>
`;

// deno-fmt-ignore
const styleComponent = () => html`
<div style=${() => `color: ${color}`}>Look at my style</div>
<button onclick=${() => color = Color()}>Change Color</button>
`;

// deno-fmt-ignore
const mapComponent = () => html`
<ul>${fruits.map((fruit) => html`
    <li>${() => fruit}</li>
`)}</ul>
`;

// deno-fmt-ignore
const fruitsComponent = () => html`
<div>${() => fruit}</div>
<select value=${() => fruit} oninput=${(e) => fruit = e.target.value}>
    ${fruits.map(fruit => html`
        <option value=${() => fruit}>${() => fruit}</option>
    `)}
</select>
`;

// deno-fmt-ignore
const carsComponent = () => html`
<div>${() => car}</div>
<select oninput=${e => car = Array.from(e.target.selectedOptions).map(o => o.value)} multiple>
    ${cars.map(car => html`
        <option value=${car}>${car}</option>
    `)}
</select>
`;

// deno-fmt-ignore
const selectBooleanComponent = () => html`
<div>${() => boolean}</div>
<select value=${() => boolean} oninput=${e => boolean = JSON.parse(e.target.value)}>
    <option value="true">yes</option>
    <option value="false">no</option>
</select>
`;

// deno-fmt-ignore
const selectNumberComponent = () => html`
<div>${() => number}</div>
<select value=${() => number} oninput=${e => number = JSON.parse(e.target.value)}>
    <option value="0">zero</option>
    <option value="1">one</option>
    <option value="2">two</option>
</select>
`;

// const connected = () => { console.log('connected'); };
// const disconnected = () => { console.log('disconnected'); };

export default html`

    <style>
        .default {
            border: solid 5px transparent;
        }
        .class-color {
            border-color: var(--accent);
        }
    </style>

    <section id="input">
        <h3>Input</h3>
        <p>Attributes starting with <code>on</code> will be removed and will set/remove an EventListener.</p>
        <pre id="inputCode">${highlight(inputComponent.toString())}</pre>
        <pre id="inputComponent">${inputComponent()}</pre>
        <pre id="inputSource">${({ query }) => highlight(query('#inputComponent'))}</pre>
    </section>

    <section id="check">
        <h3>Check</h3>
        <p>Dynamic attributes are allowed which can be used to toggle the attribute.</p>
        <pre id="checkCode">${highlight(checkComponent.toString())}</pre>
        <pre id="checkComponent">${checkComponent()}</pre>
        <pre id="checkSource">${() => highlight(checkComponent())}</pre>
    </section>

    <section id="radio">
        <h3>Radio</h3>
        <p>Attribute values will be converted to Strings but set the Element property with the original type.</p>
        <pre id="radioCode">${highlight(radioComponent.toString())}</pre>
        <pre id="radioComponent">${radioComponent()}</pre>
        <pre id="radioSource">${() => highlight(radioComponent())}</pre>
    </section>

    <section id="class">
        <h3>Class</h3>
        <pre id="classCode">${highlight(classComponent.toString())}</pre>
        <pre id="classComponent">${classComponent()}</pre>
        <pre id="classSource">${() => highlight(classComponent())}</pre>
    </section>

    <section id="style">
        <h3>Style</h3>
        <pre id="styleCode">${highlight(styleComponent.toString())}</pre>
        <pre id="styleComponent">${styleComponent()}</pre>
        <pre id="styleSource">${() => highlight(styleComponent())}</pre>
    </section>

    <section id="map">
        <h3>Map</h3>
        <pre id="mapCode">${highlight(mapComponent.toString())}</pre>
        <pre id="mapComponent">${mapComponent()}</pre>
        <pre id="mapSource">${() => highlight(mapComponent())}</pre>
    </section>

    <section id="select">
        <h3>Select</h3>

        <pre id="fruitsCode">${highlight(fruitsComponent.toString())}</pre>
        <pre id="fruitsComponent">${fruitsComponent()}</pre>
        <pre id="fruitsSource">${() => highlight(fruitsComponent())}</pre>

        <br>
        <pre id="carsCode">${highlight(carsComponent.toString())}</pre>
        <pre id="carsComponent">${carsComponent()}</pre>
        <pre id="carsSource">${() => highlight(carsComponent())}</pre>

        <br>
        <pre id="selectBooleanCode">${highlight(selectBooleanComponent.toString())}</pre>
        <pre id="selectBooleanComponent">${selectBooleanComponent()}</pre>
        <pre id="selectBooleanSource">${() => highlight(selectBooleanComponent())}</pre>

        <br>
        <pre id="selectNumberCode">${highlight(selectNumberComponent.toString())}</pre>
        <pre id="selectNumberComponent">${selectNumberComponent()}</pre>
        <pre id="selectNumberSource">${() => highlight(selectNumberComponent())}</pre>
    </section>

`('main');

/*
    <section id="dynamic">
        <h3>Dynamic</h3>
        <p>Safe and efficient Dynamic tag/elements and attributes.</p>
        <pre id="dynamicCode"></pre>
        <pre id="dynamicComponent">${dynamicComponent()}</pre>
        <pre id="dynamicSource"></pre>
    </section>



*/
