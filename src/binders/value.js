import Utility from '../utility.js';

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

                    // !disabled &&

                    if (this.multiple) {
                        index = Utility.index(this.data, value);
                        match = index !== -1;
                    } else {
                        match = Utility.compare(this.data, value);
                    }


                    if (selected && !match) {

                        if (caller === 'view') {

                            if (this.multiple) {
                                binder.data.push(value);
                            } else {
                                binder.data = value;
                            }

                        } else {
                            option.selected = false;
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
    } else if (type === 'radio' || name.indexOf('-RADIO') !== -1) {
        return {
            read () {

                this.form = binder.target.form || binder.container;
                this.query = `input[type="radio"][o-value="${binder.value}"]`;
                this.nodes = this.form.querySelectorAll(this.query);
                this.radios = Array.prototype.slice.call(this.nodes);

                if (caller === 'view') {
                    binder.data = this.radios.indexOf(binder.target);
                    return false;
                }

                this.data = binder.data;

                if (typeof this.data !== 'number') {
                    return false;
                }

            },
            write () {
                for (let i = 0, l = this.radios.length; i < l; i++) {
                    const radio = this.radios[i];

                    if (i === this.data) {
                        radio.checked = true;
                    } else {
                        radio.checked = false;
                    }

                }
            }
        };

    } else if (type === 'checkbox' || name.indexOf('-CHECKBOX') !== -1) {
        return {
            read () {

                if (caller === 'view') {
                    binder.data = binder.target.checked;
                    return false;
                }

                this.data = binder.data;

                if (typeof this.data !== 'boolean') {
                    return false;
                }

            },
            write () {
                binder.target.checked = this.data;
            }
        };
    } else {
        return {
            read () {

                if (caller === 'view') {
                    binder.data = binder.target.value;
                    return false;
                }

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
