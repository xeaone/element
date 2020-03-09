
var model = {
    text: 'Hello World',
    input: function (e) {
       console.log(e.target.value);
    }
};

var template = /*html*/`
    <h2>Value Binder</h2>
    <hr>

    <div>{{text | upper}}</div>
    <div>{{ upper(text) }}</div>
    <!-- <input o-value="text"> -->
    <input value="{{text}}" oninput="{{input}}">
`;

var upper = function (text) {
    return text.toUpperCase();
};

var methods = { upper };

export default {
    title: 'Value Binder',
    name: 'r-binder-value',
    model, template, methods
};
