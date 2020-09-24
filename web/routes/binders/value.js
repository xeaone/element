const { Component } = Oxe;

const upper = function (text) {
    return text.toUpperCase();
};

export default class RouteBinderValue extends Component {

    title = 'Value Binder'

    static methods = {
        upper
    }

    static model = {
        text: 'Hello World',
        input (e) {
            console.log(e.target.value);
        }
    }

    static template = /*html*/`
        <h2>Value Binder</h2>
        <hr>

        <div>{{text | upper}}</div>
        <input value="{{text}}" oninput="{{input}}">
    `

};
