import { Virtual } from './x-element.js';
import Highlight from './modules/highlight.js';
import Color from './modules/color.js';

const {
    style, button, section, h1, h3, p, pre, div, select, option, br, input
} = Virtual;

const inputComponenet = (c) => [
    div(c.input),
    input().value(c.input).oninput((e) => c.input = e.target.value),
];
const inputCode = Highlight(inputComponenet.toString());

const mapComponenet = (c) => [
    ...c.fruits.map((fruit, index) => div(`${index}: ${fruit}`))
];
const mapCode = Highlight(mapComponenet.toString());

const checkComponent = (c) => [
    div(c.checked ? 'Is Checked' : 'Is Not Checked'),
    input().type('checkbox').checked(c.checked).oninput((e) => c.checked = e.target.checked),
];
const checkCode = Highlight(checkComponent.toString());

const radioComponenet = (c) => [
    div(c.radioShared),
    input().type('radio').name('radio').checked(c.radioShared === c.radioOne).oninput(() => c.radioShared = 'one'),
    input().type('radio').name('radio').checked( c.radioShared === c.radioTwo).oninput(() => c.radioShared = 'two'),
];
const radioCode = Highlight(radioComponenet.toString());

const styleComponenet = (c) => [
    div('Look at my style').style(`color: ${c.color}`),
    button('Change Color').onclick(() => c.color = Color()),
];
const styleCode = Highlight(styleComponenet.toString());

const classComponenet = (c) => [
    div('Look at my class').class(c.active ? 'default class-color' : 'default'),
    button('Toggle Class').onclick(() => c.active = !c.active),
];
const classCode = Highlight(classComponenet.toString());

const fruitsComponenet = (c) => [
    div(c.fruit),
    select(...c.fruits.map((fruit) =>
        option(fruit).value(fruit)
    )).value(c.fruit).oninput((e) => c.fruit = e.target.value),
];
const fruitsCode = Highlight(fruitsComponenet.toString());

const carsComponenet = (c) => [
    div(c.car),
    select(...c.cars.map((car) =>
        option(car).value(car).selected(c.car.includes(car))
    )).multiple(true).oninput((e) => c.car = [...e.target.selectedOptions].map(o => o.value)),
];
const carsCode = Highlight(carsComponenet.toString());

const selectBooleanComponenet = (c) => [
    div(c.boolean),
    select(
        option('yes').value(true),
        option('no').value(false),
    ).value(c.boolean).oninput((e) => c.boolean = JSON.parse(e.target.value)),
];
const selectBooleanCode = Highlight(selectBooleanComponenet.toString());

const selectNumberComponenet = (c) => [
    div(c.number),
    select(
        option('zero').value(0),
        option('one').value(1),
        option('two').value(2),
    ).value(c.number).oninput((e) => c.number = JSON.parse(e.target.value)),
];
const selectNumberCode = Highlight(selectNumberComponenet.toString());

const htmlComponent = () => [
    div().html('&#x1F480; This is HTML')
];
const htmlCode = Highlight(htmlComponent.toString());

const routeCode = Highlight(`
import { Router } from './x-element.js';

const main = document.querySelector('main');

const RootContext = () => ({
    title: 'Root Route'
})

const RootComponent = ({ h1 }, { title }) => [
    h1(title)
];

Router('/', main, RootComponent, RootContext);
`);

// const dateComponenet = (c) => [
//     div(c.stamp),
//     input().type('time').value(c.stamp).oninput((e) => c.stamp = e.target.valueAsNumber),
//     input().type('date').value(c.stamp).oninput((e) => c.stamp = e.target.valueAsNumber),
//     input().type('month').value(c.stamp).oninput((e) => c.stamp = e.target.valueAsNumber),
//     input().type('datetime-local').value(c.stamp).oninput((e) => c.stamp = e.target.valueAsNumber),
// ];
// const dateCode = Highlight(dateComponenet.toString());

export const context = () => ({
    waitOne: '',
    waitTwo: '',

    input: 'hello world',
    checked: true,
    color: Color(),
    active: true,
    radioShared: 'two',
    radioOne: 'one',
    radioTwo: 'two',
    boolean: true,
    number: 1,
    fruit: 'Orange',
    fruits: ['Apple', 'Orange', 'Tomato'],
    car: ['ford'],
    cars: [ 'tesla', 'ford', 'chevy' ],

    async connect() {
        console.log('before connect');
        // await new Promise(resolve => setTimeout(()=> resolve(), 2000));
        // let count = 0;
        // let id = setInterval(()=> {
        //     console.log(count);
        //     this.waitOne = count++;
        //     if (count === 50) clearInterval(id);
        // }, 100);
    },
    upgrade() { console.log('before upgrade'); },
    upgraded() { console.log('after upgraded'); },
    connected() {
        console.log('after connected');
        this.inputHtml = Highlight(document.querySelector('#inputComponent').innerHTML, 'html');
        this.mapHtml = Highlight(document.querySelector('#mapComponent').innerHTML, 'html');
        this.checkHtml = Highlight(document.querySelector('#checkComponent').innerHTML, 'html');
        this.radioHtml = Highlight(document.querySelector('#radioComponent').innerHTML, 'html');
        this.classHtml = Highlight(document.querySelector('#classComponent').innerHTML, 'html');
        this.styleHtml = Highlight(document.querySelector('#styleComponent').innerHTML, 'html');
        this.fruitsHtml = Highlight(document.querySelector('#fruitsComponent').innerHTML, 'html');
        this.carsHtml = Highlight(document.querySelector('#carsComponent').innerHTML, 'html');
        this.selectBooleanHtml = Highlight(document.querySelector('#selectBooleanComponent').innerHTML, 'html');
        this.selectNumberHtml = Highlight(document.querySelector('#selectNumberComponent').innerHTML, 'html');
        this.htmlHtml = Highlight(document.querySelector('#htmlComponent').innerHTML, 'html');
    },
    disconnect() { console.log('before disconnect'); },
    disconnected() { console.log('after disconnected'); },
});

const contextCode = Highlight(`
const context = () => ({
    connect() { console.log('before connect'); },
    upgrade() { console.log('before upgrade'); },
    upgraded() { console.log('after upgraded'); },
    connected() { console.log('after connected'); },
    disconnect() { console.log('before disconnect'); },
    disconnected() { console.log('after disconnected'); },
});
`)

export const component = (v, c) => [

    style(`
    .default {
        border: solid 5px transparent;
    }
    .class-color {
        border-color: var(--accent);
    }
    `),
    h1(c.waitOne),
    h1(c.waitTwo),

    section(
        h3('Context'),
        pre().html(contextCode)
    ),

    section(
        h3('Input'),
        pre().html(inputCode),
        pre(...inputComponenet(c)).id('inputComponent'),
        pre().html(c.inputHtml),
    ).id('input'),

    section(
        h3('Map'),
        pre().html(mapCode),
        pre(...mapComponenet(c)).id('mapComponent'),
        pre().html(c.mapHtml),
    ).id('map'),

    section(
        h3('Check'),
        p('Boolean html attributes will treated as Boolean paramters and toggle the attribute.'),
        pre().html(checkCode),
        pre(...checkComponent(c)).id('checkComponent'),
        pre().html(c.checkHtml),
    ).id('check'),

    section(
        h3('Radio'),
        p('Boolean html attributes will treated as Boolean paramters and toggle the attribute.'),
        pre().html(radioCode),
        pre(...radioComponenet(c)).id('radioComponent'),
        pre().html(c.radioHtml),
    ).id('radio'),


    // section(
    //     h3('Date'),
    //     p('Inputs with type "date", "month", "time", "datetime-local", and a value attribute with paramater of type Number will be converted to ISO Local time format.'),
    //     pre().html(dateCode),
    //     pre(...dateComponenet(v, c)),
    // ).id('date'),


    section(
        h3('Class'),
        pre().html(classCode),
        pre(...classComponenet(c)).id('classComponent'),
        pre().html(c.classHtml),
    ).id('class'),

    section(
        h3('Style'),
        pre().html(styleCode),
        pre(...styleComponenet(c)).id('styleComponent'),
        pre().html(c.styleHtml),
    ).id('style'),

    section(
        h3('Select'),

        pre().html(fruitsCode),
        pre(...fruitsComponenet(c)).id('fruitsComponent'),
        pre().html(c.fruitsHtml),

        br(),

        pre().html(carsCode),
        pre(...carsComponenet(c)).id('carsComponent'),
        pre().html(c.carsHtml),

        br(),

        pre().html(selectBooleanCode),
        pre(...selectBooleanComponenet(c)).id('selectBooleanComponent'),
        pre().html(c.selectBooleanHtml),

        br(),

        pre().html(selectNumberCode),
        pre(...selectNumberComponenet(c)).id('selectNumberComponent'),
        pre().html(c.selectNumberHtml),

    ).id('select'),

   section(
        h3('HTML'),
        pre().html(htmlCode),
        pre(...htmlComponent(c)).id('htmlComponent'),
        pre().html(c.htmlHtml),
    ).id('html'),

    section(
        h3('Routing'),
        pre().html(routeCode),
    ).id('routing')

];