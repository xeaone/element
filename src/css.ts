
export default new class Css {

    #data = new Map();
    #style = document.createElement('style');
    #support = !window.CSS || !window.CSS.supports || !window.CSS.supports('(--t: black)');

    constructor () {
        this.#style.appendChild(document.createTextNode(':not(:defined){visibility:hidden;}'));
        this.#style.setAttribute('title', 'oxe');
        document.head.appendChild(this.#style);
    }

    scope (name:string, text:string) {
        return text 
            .replace(/\t|\n\s*/g, '')
            .replace(/(^\s*|}\s*|,\s*)(\.?[a-zA-Z_-]+)/g, `$1${name} $2`)
            .replace(/:host/g, name);
    }

    transform (text:string = '') {

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
    
    detach (name:string) {
        const item = this.#data.get(name);

        if (!item || item.count === 0) return;
        item.count--;

        if (item.count === 0 && this.#style.contains(item.node)) {
            this.#style.removeChild(item.node);
        }

    }

    attach (name:string, text:string) {
        const item = this.#data.get(name) || { count: 0, node: this.node(name, text) };

        if (item) {
            item.count++;
        } else {
            this.#data.set(name, item);
        }

        if (!this.#style.contains(item.node)) {
            this.#style.appendChild(item.node);
        }

    }

    node (name:string, text:string) {
        return document.createTextNode(this.scope(name, this.transform(text)));
    }

    // append (data) {
    //     this.#style.appendChild(document.createTextNode(this.scope(this.transform(data || ''))));
    // }

}