import { Virtual } from './x-element.js';
import Highlight from './modules/highlight.js';
import Color from './modules/color.js';

const {
    style, button,
    section, h3, p, pre, div, select, option, br, input
} = Virtual;

const inputComponenet = (v, c) => [
    div(c.input),
    input().value(c.input).oninput((e) => c.input = e.target.value),
];
const inputCode = Highlight(inputComponenet.toString());

const mapComponenet = (v, c) => [
    ...c.fruits.map((fruit, index) => div(`${index}: ${fruit}`))
];
const mapCode = Highlight(mapComponenet.toString());

const checkComponent = (v, c) => [
    div(c.checked ? 'Is Checked' : 'Is Not Checked'),
    input().type('checkbox').checked(c.checked).oninput((e) => c.checked = e.target.checked),
];
const checkCode = Highlight(checkComponent.toString());

const radioComponenet = (v, c) => [
    div(c.radioShared),
    input().type('radio').name('radio').checked(c.radioShared === c.radioOne).oninput(() => c.radioShared = 'one'),
    input().type('radio').name('radio').checked( c.radioShared === c.radioTwo).oninput(() => c.radioShared = 'two'),
];
const radioCode = Highlight(radioComponenet.toString());

const styleComponenet = (v, c) => [
    div('Look at my style').style(`color: ${c.color}`),
    button('Change Color').onclick(() => c.color = Color()),
];
const styleCode = Highlight(styleComponenet.toString());

const classComponenet = (v, c) => [
    div('Look at my class').class(c.active ? 'default class-color' : 'default'),
    button('Toggle Class').onclick(() => c.active = !c.active),
];
const classCode = Highlight(classComponenet.toString());

const fruitsComponenet = (v, c) => [
    div(c.fruit),
    select(
        ...c.fruits.map((fruit) =>
            option(fruit).value(fruit)
        )
    ).value(c.fruit).oninput((e) => c.fruit = e.target.value),
];
const fruitsCode = Highlight(fruitsComponenet.toString());

const selectBooleanComponenet = (v, c) => [
    div(c.boolean),
    select(
        option('yes').value(true),
        option('no').value(false),
    ).value(c.boolean).oninput((e) => c.boolean = JSON.parse(e.target.value)),
];
const selectBooleanCode = Highlight(selectBooleanComponenet.toString());

const selectNumberComponenet = (v, c) => [
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

// const dateComponenet = (v, c) => [
//     div(c.stamp),
//     input().type('time').value(c.stamp).oninput((e) => c.stamp = e.target.valueAsNumber),
//     input().type('date').value(c.stamp).oninput((e) => c.stamp = e.target.valueAsNumber),
//     input().type('month').value(c.stamp).oninput((e) => c.stamp = e.target.valueAsNumber),
//     input().type('datetime-local').value(c.stamp).oninput((e) => c.stamp = e.target.valueAsNumber),
// ];
// const dateCode = Highlight(dateComponenet.toString());

export const context = () => ({

    // stamp: Date.now(),

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

    inputHtml: '',

})

export const component = (v, c) => [

    style(`
    .default {
        border: solid 5px transparent;
    }
    .class-color {
        border-color: var(--accent);
    }
    `),

    section(
        h3('Input'),
        pre().html(inputCode),
        pre(...inputComponenet(v, c)).onframe((t) => c.inputHtml = Highlight(t.innerHTML, 'html')),
        pre().html(c.inputHtml),
    ).id('input'),

    section(
        h3('Map'),
        pre().html(mapCode),
        pre(...mapComponenet(v, c)).onframe((t) => c.mapHtml = Highlight(t.innerHTML, 'html')),
        pre().html(c.mapHtml),
    ).id('map'),

    section(
        h3('Check'),
        p('Boolean html attributes will treated as Boolean paramters and toggle the attribute.'),
        pre().html(checkCode),
        pre(...checkComponent(v, c)).onframe((t) => c.checkHtml = Highlight(t.innerHTML, 'html')),
        pre().html(c.checkHtml),
    ).id('check'),

    section(
        h3('Radio'),
        p('Boolean html attributes will treated as Boolean paramters and toggle the attribute.'),
        pre().html(radioCode),
        pre(...radioComponenet(v, c)).onframe((t) => c.radioHtml = Highlight(t.innerHTML, 'html')),
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
        pre(...classComponenet(v, c)).onframe((t) => c.classHtml = Highlight(t.innerHTML, 'html')),
        pre().html(c.classHtml),
    ).id('class'),

    section(
        h3('Style'),
        pre().html(styleCode),
        pre(...styleComponenet(v, c)).onframe((t) => c.styleHtml = Highlight(t.innerHTML, 'html')),
        pre().html(c.styleHtml),
    ).id('style'),

    section(
        h3('Select'),

        pre().html(fruitsCode),
        pre(...fruitsComponenet(v, c)).onframe((t) => c.fruitsHtml = Highlight(t.innerHTML, 'html')),
        pre().html(c.fruitsHtml),

        br(),

        pre().html(selectBooleanCode),
        pre(...selectBooleanComponenet(v, c)).onframe((t) => c.selectBooleanHtml = Highlight(t.innerHTML, 'html')),
        pre().html(c.selectBooleanHtml),

        br(),

        pre().html(selectNumberCode),
        pre(...selectNumberComponenet(v, c)).onframe((t) => c.selectNumberHtml = Highlight(t.innerHTML, 'html')),
        pre().html(c.selectNumberHtml),

    ).id('select'),

   section(
        h3('HTML'),
        pre().html(htmlCode),
        pre(...htmlComponent(v, c)).onframe((t) => c.htmlHtml = Highlight(t.innerHTML, 'html')),
        pre().html(c.htmlHtml),
    ).id('html'),

    section(
        h3('Routing'),
        pre().html(routeCode),
    ).id('routing')

]
