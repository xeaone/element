import Utility from '../utility.js';

export default function (binder, caller) {
    const self = this;
    const type = binder.target.type;
    const name = binder.target.nodeName;

    if (binder.meta.busy) return;
    else binder.meta.busy = true;

    if (type === 'select-one' || type === 'select-multiple') {
        return {
            read () {

                this.data = binder.data;
                this.model = binder.model;
                this.options = binder.target.options;
                this.multiple = Utility.multiple(binder.target);
				// this.defaults = this.multiple ? binder.querySelectorAll('[selected]') : binder.querySelector('[selected]') || this.options[0];

                if (this.multiple && (!this.data || this.data.constructor !== Array)) {
                    throw new Error(`Oxe - invalid o-value ${binder.keys.join('.')} multiple select requires array`);
                }

            },
            write () {
				let fallback;
                for (let i = 0, l = this.options.length; i < l; i++) {

                    const option = this.options[i];
                    const selected = option.selected;
                    const optionBinder = self.get('attribute', option, 'o-value');
                    const value = optionBinder ? optionBinder.data : option.value;
					const selectedAtrribute = option.hasAttribute('selected');

					if (this.multiple) {
						if (selectedAtrribute) {
							fallback = fallback || [];
							fallback.push(value);
							// fallback.push({ value, option, i });
						}
					} else {
						if (i === 0 || selectedAtrribute) {
							fallback = value;
							// fallback = { value, option, i };
						}
					}

					if (caller === 'view') {
						if (selected) {
							if (this.multiple) {
								const includes = Utility.includes(this.data, value);
								if (!includes) binder.data.push(value);
							} else if (!this.selected) {
	                 			this.selected = true;
		                    	binder.data = value;
							}
						} else {
							if (this.multiple) {
								const index = Utility.index(this.data, value);
								if (index !== -1) binder.data.splice(index, 1);
							// } else {
							// 	if (!this.selected && i === l-1) binder.data = null;
							}
						}
					} else {
						if (this.multiple) {
							const includes = Utility.includes(this.data, value);
							if (includes) {
                            	option.selected = true;
							} else {
                            	option.selected = false;
							}
                        } else {
							if (!this.selected) {
								const match = Utility.match(this.data, value);
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

				if (!this.selected && fallback !== undefined) {
					binder.data = fallback;
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

    } else if (type === 'checkbox') {
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
