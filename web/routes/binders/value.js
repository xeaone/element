const { Component } = Oxe;

const upper = function (text) {
    return text.toUpperCase();
};

export default class BinderValueRoute extends Component {

    title = 'Value Binder'

    data = {

        text: 'Hello World',
        textInput () { console.log(this.data.text); },

        number: 1,
        // number: NaN,
        numberInput () { console.log(this.data.number); },

        checkbox: true,
        // checkbox: false,
        checkboxInput () { console.log(this.data.checkbox); },

        one: 'one',
        radio: 'two',
        radioInput () { console.log(this.data.radio); }

    }

    html = /*html*/`
        <h2>Value Binder</h2>
        <hr>

        <br>

        <strong>type="text" as String</strong>
        <div>{{text}}</div>
        <input value="{{text}}" type="text" oninput="{{textInput}}">

        <br>
        <br>
        <br>

        <strong>type="number" as Number</strong>
        <div>{{number}}</div>
        <input value="{{number}}" type="number" oninput="{{numberInput}}">

        <br>
        <br>
        <br>

        <strong>type="checkbox" As Boolean</strong>
        <div>{{checkbox}}</div>
        <input checked="{{checkbox}}" type="checkbox" oninput="{{checkboxInput}}">
        <i>checked attribute linked to boolean on model with no value attribute.</i>
        <br>
        <input value="{{checkbox}}" checked="{{checkbox}}" type="checkbox" oninput="{{checkboxInput}}">
        <i>checked boolean value and checked attribute</i>

        <br>
        <br>
        <br>

        <strong>type="radio" as String</strong>
        <div>{{radio}}</div>
        <input name="radios" type="radio" value="{{one}}" checked="{{radio}}" oninput="{{radioInput}}">
        <input name="radios" type="radio" value="two" checked="{{radio}}" oninput="{{radioInput}}">
        <input name="radios" type="radio" value="three" checked="{{radio}}" oninput="{{radioInput}}">

    `

};

        // <input value="{{checkbox}}" type="checkbox" oninput="{{checkboxInput}}"></input>