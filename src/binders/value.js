import Utility from '../utility.js';

export default function (binder) {
    const type = binder.target.type;
    const name = binder.target.nodeName;

    if (name === 'SELECT' || name.indexOf('-SELECT') !== -1) {
        return {
            read () {
                this.data = binder.data;

                this.nodes = binder.target.options;
                this.multiple = Utility.multiple(binder.target);

                if (this.multiple && (!this.data || this.data.constructor !== Array)) {
                    throw new Error(`Oxe - invalid o-value ${binder.keys.join('.')} multiple select requires array`);
                }

            },
            write () {
                for (let i = 0, l = this.nodes.length; i < l; i++) {
                    const node = this.nodes[i];
                    const value = Utility.value(node, binder.container.model);

                    if (this.multiple) {
                        if (node.selected) {

                            if (!node.disabled && !Utility.includes(this.data, value)) {
                                binder.data.push(value);
                            }

                        } else if (this.data !== undefined && Utility.includes(this.data, value)) {
                            node.selected = true;
                        }
                    } else {
                        if (node.selected) {

                            if (!node.disabled && !Utility.compare(this.data, value)) {
                                binder.data = value;
                            }

                            break;
                        } else if (this.data !== undefined && Utility.compare(this.data, value)) {
                            node.selected = true;
                            break;
                        }
                    }
                }
            }
        };
    } else if (type === 'radio') {
        return {
            read () {
                this.data = binder.data;

                if (typeof this.data !== 'number') {
                    // this.data = 0;
                    return false;
                }

                this.nodes = binder.container.querySelectorAll(
                    'input[type="radio"][o-value="' + binder.value + '"]'
                );

            },
            write () {
                let checked = false;

                for (let i = 0, l = this.nodes.length; i < l; i++) {
                    const node = this.nodes[i];

                    if (i === this.data) {
                        checked = true;
                        node.checked = true;
                        node.setAttribute('checked', '');
                    } else {
                        node.checked = false;
                        node.removeAttribute('checked');
                    }

                }

                if (!checked) {
                    this.nodes[0].checked = true;
                    this.nodes[0].setAttribute('checked', '');
                    // binder.data = 0;
                }

            }
        };

    } else if (type === 'checkbox' || name.indexOf('-CHECKBOX') !== -1) {
        return {
            read () {
                this.data = binder.data;

                if (typeof this.data !== 'boolean') {
                    // this.data = false;
                    return false;
                }

            },
            write () {

                binder.target.checked = this.data;

                if (this.data) {
                    binder.target.setAttribute('checked', '');
                } else {
                    binder.target.removeAttribute('checked');
                }

            }
        };
    } else {
        return {
            read () {
                this.data = binder.data;

                if (this.data === binder.target.value) {
                    return false;
                }

            },
            write () {
                binder.target.value = this.data === undefined || this.data === null ? '' : this.data;
            }
        };
    }
}
