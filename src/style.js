
export default class Style {

    static support = !window.CSS || !window.CSS.supports || !window.CSS.supports('(--t: black)');

    constructor (name, data) {
        if (!name) throw new Error('Oxe.style - name required');

        this.name = name;
        this.data = this.scope(this.transform(data || ''));

        // const text = ':not(:defined) { visibility: hidden; }';
        const style = document.createElement('style');
        const node = document.createTextNode(this.data);
        // const sheet = style.sheet;

        style.setAttribute('title', this.name);
        // style.setAttribute('type', 'text/css');
        style.appendChild(node);

        document.head.appendChild(style);
    }

    scope (data) {
        data 
            .replace(/\n|\r|\t/g, '')
            .replace(/:host/g, this.name);
    }

    transform (data) {

        if (!this.support) {
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
    }

    remove () {
        document.head.querySelector(`style[title="${this.name}"]`);
    }

}
