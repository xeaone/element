var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
import { html, update } from '../source/index.ts';
var items = [0, 1, 2];
var connected = function () {
    console.log('connected');
    setTimeout(function () {
        // items.push(3, 4, 5, 6, 7, 8, 9);
        items.push(3, 4, 5, 6, 7, 8, 9, 10, 11);
        update();
        setTimeout(function () {
            items.splice(5, 5);
            console.log(items);
            update();
        }, 2000);
    }, 1000);
};
var a = function () {
    return items[0]++;
};
html(templateObject_2 || (templateObject_2 = __makeTemplateObject(["\n\n    <main onConnected=", " onAnimation=", ">\n\n        <ul>", "</ul>\n\n    </main>\n\n"], ["\n\n    <main onConnected=", " onAnimation=", ">\n\n        <ul>", "</ul>\n\n    </main>\n\n"])), connected, a, function () { return items.map(function (item) { return html(templateObject_1 || (templateObject_1 = __makeTemplateObject(["<li>", "</li>"], ["<li>", "</li>"])), function () { return item; }); }); })(document.body);
var templateObject_1, templateObject_2;
// const token = () => Math.random().toString(36).substring(2, 5);
// const items = Array.from({ length: 500 }, (_, index) => ({ name: token(), id: index }));
// const rename = () => {
//     items.forEach(item => item.name = token());
//     update().then(() => setTimeout(() => rename(), 10));
// };
// const connected = () => {
//     rename();
// };
// html`
//     <style>
//         body {
//             color: lightgray;
//             background: black;
//             box-sizing: border-box;
//         }
//         main {
//             box-sizing: border-box;
//         }
//         ul {
//             box-sizing: border-box;
//             display: flex;
//             flex-wrap: wrap;
//             padding: 0;
//             margin: 0;
//         }
//         li {
//             display: block;
//             width: 10%;
//             padding: 5px;
//             box-sizing: border-box;
//             border: 1px solid lightgray;
//         }
//     </style>
//     <main onConnected=${connected}>
//         <ul>${() => items.map(
//             item => html`<li>${() => item.name}</li>`
//         )}</ul>
//     </main>
// `(document.body);
