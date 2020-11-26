
export default new class Css {

    #data = new Map();
    #style = document.createElement('style');
    #support = !window.CSS || !window.CSS.supports || !window.CSS.supports('(--t: black)');

    constructor () {
        this.#style.appendChild(document.createTextNode(':not(:defined){visibility:hidden;}'));
        this.#style.setAttribute('title', 'oxe');
        document.head.appendChild(this.#style);
    }

    scope (name, text) {
        return text 
            .replace(/\t|\n\s*/g, '')
            .replace(/(^\s*|}\s*|,\s*)(\.?[a-zA-Z_-]+)/g, `$1${name} $2`)
            .replace(/:host/g, name);
    }

    transform (text) {

        if (!this.#support) {
            const matches = text.match(/--\w+(?:-+\w+)*:\s*.*?;/g) || [];
    
            for (let i = 0; i < matches.length; i++) {
                const match = matches[i];
                const rule = match.match(/(--\w+(?:-+\w+)*):\s*(.*?);/);
                const pattern = new RegExp('var\\('+rule[1]+'\\)', 'g');
                text = text.replace(rule[0], '');
                text = text.replace(pattern, rule[2]);
            }
    
        }
    
        return text;
    }
    
    detach (name) {

        const item = this.#data.get(name);
        if (!item || item.count === 0) return;

        item.count--;

        if (item.count === 0) this.#style.removeChild(item.node);

    }

    attach (name, text) {

        if (this.#data.has(name)) {
            this.#data.get(name).count++;
        } else {
            const node = this.node(name, text);
            this.#data.set(name, { count: 1, node });
            this.#style.appendChild(node);
        }


    }

    node (name, text) {
        return document.createTextNode(this.scope(name, this.transform(text || '')));
    }

    // append (data) {
    //     this.#style.appendChild(document.createTextNode(this.scope(this.transform(data || ''))));
    // }

}