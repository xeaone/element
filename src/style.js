
const style = document.createElement('style');
const sheet = style.sheet;

style.setAttribute('title', 'oxe');
style.setAttribute('type', 'text/css');

const add = function (data) {
    this.sheet.insertRule(data);
};

const append = function (data) {

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

    this.style.appendChild(document.createTextNode(data));
};

const setup = async function (option) {
    option = option || {};

    if (option.style) {
        this.append(option.style);
    }

    document.head.appendChild(this.style);
};

export default Object.freeze({
    style, sheet, add, append, setup
});
