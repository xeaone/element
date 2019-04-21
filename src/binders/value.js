import Utility from '../utility.js';

// export default function (binder) {
export default function (binder, caller) {
    const type = binder.target.type;
    const name = binder.target.nodeName;

    if (name === 'SELECT' || name.indexOf('-SELECT') !== -1) {
        return {
            read () {
                this.data = binder.data;
                this.model = binder.model;
                this.options = binder.target.options;
                this.multiple = Utility.multiple(binder.target);

                if (this.multiple && (!this.data || this.data.constructor !== Array)) {
                    throw new Error(`Oxe - invalid o-value ${binder.keys.join('.')} multiple select requires array`);
                }

            },
            write () {
                for (let i = 0, l = this.options.length; i < l; i++) {

                    const option = this.options[i];
                    const selected = option.selected;
                    const value = Utility.value(option, this.model);
                    let index, match;

                    if (this.multiple) {
                        index = Utility.index(this.data, value);
                        match = index !== -1;
                    } else {
                        match = Utility.compare(this.data, value);
                    }

                    // !disabled &&

                    if (selected && !match) {
                        console.log('selected && !match');
                        if (this.multiple) {
                            binder.data.push(value);
                        } else {
                            binder.data = value;
                        }
                    } else if (!selected && match) {
                        if (caller === 'view') {
                            if (this.multiple) {
                                binder.data.splice(index, 1);
                            } else {
                                binder.data = null;
                            }
                        } else {
                            option.selected = true;
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
                    return false;
                }

                if (caller === 'view') {
                    binder.data = binder.target.checked || false;
                }

            },
            write () {
                binder.target.checked = this.data;
            }
        };
    } else {
        return {
            read () {
                this.data = binder.data;

                if (this.data === binder.target.value) {
                    return false;
                }

                if (caller === 'view') {
                    binder.data = binder.target.value;
                    return false;
                }

            },
            write () {
                binder.target.value = this.data === undefined || this.data === null ? '' : this.data;
            }
        };
    }
}
