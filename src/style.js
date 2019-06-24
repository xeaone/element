
const DEFAULT = document.createTextNode('o-router, o-router > :first-child { display: block; }');
const STYLE = document.createElement('style');
const SHEET = STYLE.sheet;

STYLE.setAttribute('title', 'oxe');
STYLE.setAttribute('type', 'text/css');
STYLE.appendChild(DEFAULT);

export default {

    get style () { return STYLE; },
    get sheet () { return SHEET; },

    add (data) {
        this.sheet.insertRule(data);
    },

    append (data) {
        this.style.appendChild(document.createTextNode(data));
    },

    async setup (option) {
        option = option || {};

        if (option.style) {
            this.append(option.style);
        }

        document.head.appendChild(this.style);
    }

};
