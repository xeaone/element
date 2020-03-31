
const text = ':not(:defined) { visibility: hidden; }';
const style = document.createElement('style');
const node = document.createTextNode(text);
const sheet = style.sheet;

style.setAttribute('title', 'oxe');
style.setAttribute('type', 'text/css');
style.appendChild(node);

// o-router, o-router > :first-child { display: block; }

document.head.appendChild(style);

const transform = function (data) {

    if (!window.CSS || !window.CSS.supports || !window.CSS.supports('(--t: black)')) {
        const matches = data.match(/--\w+(?:-+\w+)*:\s*.*?;/g) || [];

        for (let i = 0; i < matches.length; i++) {
            const match = matches[i];
            const rule = match.match(/(--\w+(?:-+\w+)*):\s*(.*?);/);
            const pattern = new RegExp('var\\('+rule[1]+'\\)', 'g');
            data = data.replace(rule[0], '');
            data = data.replace(pattern, rule[2]);
        }

    }

    return data;
};

const add = function (data) {
    data = transform(data);
    sheet.insertRule(data);
};

const append = function (data) {
    data = transform(data);
    style.appendChild(document.createTextNode(data));
};

const setup = async function (option = {}) {

    if (option.style) {
        append(option.style);
    }

};

export default Object.freeze({
    style, sheet, add, append, setup
});
