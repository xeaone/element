
var model = {
    text: 'Hello World'
};

var template = /*html*/`
    <h2>Value Binder</h2>
    <hr>

    <div>{{text | upper}}</div>
    <input o-value="text">
`;

var upper = function (text) {
    return text.toUpperCase();
};

var methods = { upper };

export default {
    title: 'Value Binder',
    name: 'r-binder-value',
    model, template, methods
}
