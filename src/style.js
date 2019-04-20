
const STYLE = document.createElement('style');
const SHEET = STYLE.sheet;

STYLE.setAttribute('title', 'oxe');
STYLE.setAttribute('type', 'text/css');

export default {

    get style () { return STYLE; },
    get sheet () { return SHEET; },

    add (data) {
        this.sheet.insertRule(data);
    },

    append (data) {
        this.style.appendChild(document.createTextNode(data));
    },

    async setup () {

        this.append(`
			*[hidden] {
				display: none !important;
			}
			o-router, o-router > :first-child {
				display: block;
				animation: o-transition var(--o-transition) ease-in-out;
			}
			@keyframes o-transition {
				0% { opacity: 0; }
				100% { opacity: 1; }
			}
		`);

        document.head.appendChild(this.style);
    }

};
