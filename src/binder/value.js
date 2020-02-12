import Index from '../utility/index.js';
import Match from '../utility/match.js';
import Includes from '../utility/includes.js';
import Multiple from '../utility/multiple.js';

export default function (binder, data, e) {
    const self = this;
    const type = binder.target.type;

    if (binder.meta.busy) return;
    else binder.meta.busy = true;

    if (!binder.meta.setup) {
        binder.meta.setup = true;
        binder.target.addEventListener('input', (e) => {
            this.render(binder, data, e);
        }, false);
    }

    console.log(e);

    if (type === 'select-one' || type === 'select-multiple') {
        return {
            read () {

                this.options = binder.target.options;
                this.multiple = Multiple(binder.target);

                if (this.multiple && binder.data instanceof Array === false) {
                    binder.data = [];
                    // binder.meta.busy = false;
                    // throw new Error(`Oxe - invalid o-value ${binder.keys.join('.')} multiple select requires array`);
                }

            },
            write () {

                const fallback = [];
                const multiple = this.multiple;
                const options = this.options;
                for (let i = 0; i < options.length; i++) {

                    const option = options[i];
                    const selected = option.selected;
                    const optionBinder = self.get(option, 'value');
                    const value = optionBinder ? optionBinder.data : option.value;

                    if (option.hasAttribute('selected')) {
                        fallback.push({ option, value });
                    }

                    console.log(binder.data, value, binder.data===value);

                    if (e) {
                        if (multiple) {
                            if (selected) {
                                const includes = Includes(binder.data, value);
                                if (!includes) {
                                    binder.data.push(value);
                                }
                            } else {
                                const index = Index(binder.data, value);
                                if (index !== -1) {
                                    binder.data.splice(index, 1);
                                }
                            }
                        } else {
                            if (selected) {
                                binder.data = value;
                                break;
                            }
                        }
                    } else {
                        if (multiple) {
                            const includes = Includes(binder.data, value);
                            if (includes) {
                                option.selected = true;
                            } else {
                                option.selected = false;
                            }
                        } else {
                            const match = Match(binder.data, value);
                            if (match) {
                                option.selected = true;
                                break;
                            }
                        }
                    }
                }

                if (this.selectedIndex === -1) {
                    if (multiple) {
                        for (let i = 0; i < fallback.length; i++) {
                            const { option, value } = fallback[i];
                            if (e) {
                                binder.data.push(value);
                            } else {
                                option.selected = true;
                            }
                        }
                    } else {
                        // const { option, value } = fallback[0] || this.options[0];
                        // if (e) {
                        //     binder.data = value;
                        // } else {
                        //     option.selected = true;
                        // }
                    }
                }

                binder.meta.busy = false;
            }
        };
    } else if (type === 'radio') {
        return {
            read () {

                this.form = binder.target.form || binder.container;
                this.query = `input[type="radio"][o-value="${binder.value}"]`;
                this.nodes = this.form.querySelectorAll(this.query);
                this.radios = Array.prototype.slice.call(this.nodes);

                if (e) {
                    binder.data = this.radios.indexOf(binder.target);
                    binder.meta.busy = false;
                    return this.write = false;
                }

                if (typeof binder.data !== 'number') {
                    binder.meta.busy = false;
                    return this.write = false;
                }

            },
            write () {
                for (let i = 0, l = this.radios.length; i < l; i++) {
                    const radio = this.radios[i];

                    if (i === binder.data) {
                        radio.checked = true;
                    } else {
                        radio.checked = false;
                    }

                }

                binder.meta.busy = false;
            }
        };
    } else if (type === 'checkbox') {
        return {
            read () {

                if (e) {
                    binder.data = binder.target.checked;
                    binder.meta.busy = false;
                    return this.write = false;
                }

                if (typeof binder.data !== 'boolean') {
                    binder.meta.busy = false;
                    return this.write = false;
                }

            },
            write () {
                binder.target.checked = binder.data;
                binder.meta.busy = false;
            }
        };
    } else if (type === 'file') {
        return {
            read () {
                this.multiple = Multiple(binder.target);
                binder.data = this.multiple ? Array.prototype.slice.call(binder.target.files) : binder.target.files[0];
                binder.meta.busy = false;
            }
        };
    } else {
        return {
            read () {

                if (binder.data === binder.target.value) {
                    binder.meta.busy = false;
                    return this.write = false;
                }

                if (e) {
                    binder.data = binder.target.value;
                    binder.meta.busy = false;
                    return this.write = false;
                }

            },
            write () {
                binder.target.value = binder.data === undefined || binder.data === null ? '' : binder.data;
                binder.meta.busy = false;
            }
        };
    }
}
