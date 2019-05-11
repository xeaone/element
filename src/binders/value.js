import Utility from '../utility.js';

export default function (binder, caller) {
    const self = this;
    const type = binder.target.type;
    const name = binder.target.nodeName;

    if (binder.meta.busy) {
        return;
    }

    if (name === 'SELECT' || name.indexOf('-SELECT') !== -1) {
        return {
            read () {
                binder.meta.busy = true;

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
                    const optionBinder = self.get('attribute', option, 'o-value');
                    const value = optionBinder ? optionBinder.data : option.value;

                    let index, match;

                    if (this.multiple) {
                        index = Utility.index(this.data, value);
                        match = index !== -1;
                    } else {
                        match = Utility.compare(this.data, value);
                    }

                    // if (caller === 'view') {
                    //     if (selected) {
                    //         if (this.multiple) {
                    //             binder.data.push(value);
                    //         } else {
                    //             this.selected = true;
                    //             binder.data = value;
                    //         }
                    //     } else {
                    //         if (this.multiple) {
                    //             binder.data.splice(index, 1);
                    //         } else {
                    //             if (!this.selected) {
                    //                 binder.data = null;
                    //             }
                    //         }
                    //     }
                    // } else {
                    //     // if (this.multiple) {
                    //     if (match) {
                    //         option.selected = true;
                    //     } else {
                    //         option.selected = false;
                    //     }
                    //     // }
                    //     console.log(this.data);
                    // }

                    if (selected && !match) {

                        if (caller === 'view') {

                            if (this.multiple) {
                                binder.data.push(value);
                            } else if (!this.selected) {
                                this.selected = true;
                                binder.data = value;
                            }

                        } else {

                            if (this.multiple) {
                                option.selected = false;
                            } else if (!this.selected) {
                                this.selected = true;
                                option.selected = false;
                            }

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

                binder.meta.busy = false;
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
