import Index from '../utility/index.js';
import Match from '../utility/match.js';
import Includes from '../utility/includes.js';
import Multiple from '../utility/multiple.js';

export default function (binder, caller) {
    const self = this;
    const type = binder.target.type;
    let data;

    if (binder.meta.busy) return;
    else binder.meta.busy = true;

    if (!binder.meta.setup) {
        binder.meta.setup = true;
        binder.target.addEventListener('input', function () {
            self.render(binder, 'view');
            // binder.data = binder.target.value;
        }, false);
        // binder.target.addEventListener('change', function () {
        //     console.log('change');
        // });
    }

    if (type === 'select-one' || type === 'select-multiple') {
        return {
            read() {

                this.data = binder.data;
                this.model = binder.model;
                this.options = binder.target.options;
                this.multiple = Multiple(binder.target);

                if (this.multiple && (!this.data || this.data.constructor !== Array)) {
                    binder.meta.busy = false;
                    throw new Error(`Oxe - invalid o-value ${binder.keys.join('.')} multiple select requires array`);
                }

            },
            write() {
                let fallback = false;
                let fallbackSelectedAtrribute = false;
                let fallbackValue = this.multiple ? [] : null;
                let fallbackOption = this.multiple ? [] : null;

                for (let i = 0, l = this.options.length; i < l; i++) {

                    const option = this.options[i];
                    const selected = option.selected;
                    const optionBinder = self.get('attribute', option, 'o-value');
                    const optionValue = optionBinder ? optionBinder.data : option.value;
                    const selectedAtrribute = option.hasAttribute('selected');

                    if (this.multiple) {
                        if (selectedAtrribute) {
                            fallback = true;
                            fallbackOption.push(option);
                            fallbackValue.push(optionValue);
                        }
                    } else {
                        if (i === 0 || selectedAtrribute) {
                            fallback = true;
                            fallbackOption = option;
                            fallbackValue = optionValue;
                            fallbackSelectedAtrribute = selectedAtrribute;
                        }
                    }

                    if (caller === 'view') {
                        if (selected) {
                            if (this.multiple) {
                                const includes = Includes(this.data, optionValue);
                                if (!includes) {
                                    this.selected = true;
                                    binder.data.push(optionValue);
                                }
                            } else if (!this.selected) {
                                this.selected = true;
                                binder.data = optionValue;
                            }
                        } else {
                            if (this.multiple) {
                                const index = Index(this.data, optionValue);
                                if (index !== -1) {
                                    binder.data.splice(index, 1);
                                }
                            } else if (!this.selected && i === l - 1) {
                                binder.data = null;
                            }
                        }
                    } else {
                        if (this.multiple) {
                            const includes = Includes(this.data, optionValue);
                            if (includes) {
                                this.selected = true;
                                option.selected = true;
                            } else {
                                option.selected = false;
                            }
                        } else {
                            if (!this.selected) {
                                const match = Match(this.data, optionValue);
                                if (match) {
                                    this.selected = true;
                                    option.selected = true;
                                } else {
                                    option.selected = false;
                                }
                            } else {
                                option.selected = false;
                            }
                        }
                    }

                }

                if (!this.selected && fallback) {
                    if (this.multiple) {
                        for (let i = 0, l = fallbackOption.length; i < l; i++) {
                            fallbackOption[i].selected = true;
                            binder.data.push(fallbackValue[i]);
                        }
                    } else if (fallbackSelectedAtrribute || this.nodeName === 'OPTION') {
                        binder.data = fallbackValue;
                        fallbackOption.selected = true;
                    }
                }

                binder.meta.busy = false;
            }
        };
    } else if (type === 'radio') {
        return {
            read() {

                this.form = binder.target.form || binder.container;
                this.query = `input[type="radio"][o-value="${binder.value}"]`;
                this.nodes = this.form.querySelectorAll(this.query);
                this.radios = Array.prototype.slice.call(this.nodes);

                if (caller === 'view') {
                    binder.data = this.radios.indexOf(binder.target);
                    binder.meta.busy = false;
                    return this.write = false;
                }

                if (typeof binder.data !== 'number') {
                    binder.meta.busy = false;
                    return this.write = false;
                }

            },
            write() {
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
            read() {

                if (caller === 'view') {
                    binder.data = binder.target.checked;
                    binder.meta.busy = false;
                    return this.write = false;
                }

                if (typeof binder.data !== 'boolean') {
                    binder.meta.busy = false;
                    return this.write = false;
                }

            },
            write() {
                binder.target.checked = binder.data;
                binder.meta.busy = false;
            }
        };
    } else if (type === 'file') {
        return {
            read() {
                this.multiple = Multiple(binder.target);
                binder.data = this.multiple ? Array.prototype.slice.call(binder.target.files) : binder.target.files[0];
                binder.meta.busy = false;
            }
        };
    } else {
        return {
            read() {
                data = binder.data;

                if (data === binder.target.value) {
                    binder.meta.busy = false;
                    return this.write = false;
                }

                if (caller === 'view') {
                    binder.data = binder.target.value;
                    binder.meta.busy = false;
                    return this.write = false;
                }

            },
            write() {
                binder.target.value = data === undefined || data === null ? '' : data;
                binder.meta.busy = false;
            }
        };
    }
}
