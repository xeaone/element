
Oxe.component.define({
    name: 'o-optgroup',
    style: 'o-optgroup { display: block; } o-optgroup::before { content: attr(label); }',
    template: '<slot></slot>',
    properties: {
        disabled: {
            enumerable: true,
            get: function () {
                return this.hasAttribute('disabled');
            },
            set: function (data) {
                data = data ? true : false;
                if (data) this.setAttribute('disabled', '');
                else this.removeAttribute('disabled');
                return data;
            }
        }
    }
});

Oxe.component.define({
    name: 'o-option',
    template: '<slot></slot>',
    style: 'o-option { display: block; }',
    attributes: [ 'value' ],
    properties: {
        _valueDefaultLocked: {
            writable: true,
            value: false
        },
        _selectedDefaultLocked: {
            writable: true,
            value: false
        },
        _value: {
            writable: true,
            value: ''
        },
        _selected: {
            writable: true,
            value: false
        },
        value: {
            enumerable: true,
            get: function () {
                if (this._valueDefaultLocked) {
                    return this._value || this.textContent || '';
                } else {
                    var value = this.getAttribute('value');
                    return value || this._value || this.textContent || '';
                }
            },
            set: function (data) {
                this._valueDefaultLocked = true;
                return this._value = data === null || data === undefined ? '' : data;
            }
        },
        selected: {
            enumerable: true,
            get: function () {
                if (this._selectedDefaultLocked) {
                    return this._selected;
                } else {
                    var selected = this.getAttribute('selected');
                    return selected !== null && selected !== 'false' ? true : false;
                }
            },
            set: function (data) {
                this._selectedDefaultLocked = true;
                this._selected = data ? true : false;
                // maybe use toggle attribute neeed to test in IE
                if (this._selected) this.setAttribute('data-selected', '');
                else this.removeAttribute('data-selected');
                return this._selected;
            }
        },
        disabled: {
            enumerable: true,
            get: function () {
                return this.hasAttribute('disabled');
            },
            set: function (data) {
                data = data ? true : false;
                if (data) this.setAttribute('disabled', '');
                else this.removeAttribute('disabled');
                return data;
            }
        },
        name: {
            enumerable: true,
            get: function () {
                return this.getAttribute('name') || '';
            },
            set: function (data) {
                this.setAttribute('name', data);
                return data;
            }
        }
    },
    attributed: function (name, _, data) {
        switch (name) {
        case 'value': this._value = data || ''; break;
        }
    },
    created: function () {
        if (this.hasAttribute('selected')) {
            this.setAttribute('data-selected', '');
        } else {
            this.removeAttribute('data-selected');
        }
    }
});

export default {
    name: 'o-select',
    template: '<slot></slot>',
    style: 'o-select { display: block; }',
    properties: {
        // update: {
        //     enumerable: true,
        //     value: function (element) {
        //         if (element.hasAttribute('o-value')) {
        //             var binder = Oxe.binder.get('attribute', element, 'o-value');
        //             var value = Oxe.utility.value(element, this.model);
        //             binder.data = value;
        //         }
        //     }
        // },
        type: {
            enumerable: true,
            get: function () {
                return this.hasAttribute('multiple') ? 'select-multiple' : 'select-one';
            }
        },
        options: {
            enumerable: true,
            get: function () {
                return this.querySelectorAll('o-option');
            }
        },
        disabled: {
            enumerable: true,
            get: function () {
                return this.hasAttribute('disabled');
            },
            set: function (data) {
                data = data ? true : false;
                if (data) this.setAttribute('disabled', '');
                else this.removeAttribute('disabled');
                return data;
            }
        },
        multiple: {
            enumerable: true,
            get: function () {
                return this.hasAttribute('multiple');
            },
            set: function (data) {
                data = data ? true : false;
                if (data) this.setAttribute('multiple', '');
                else this.removeAttribute('multiple');
                return data;
            }
        },
        name: {
            enumerable: true,
            get: function () {
                return this.getAttribute('name') || '';
            },
            set: function (data) {
                this.setAttribute('name', data);
                return data;
            }
        }
    },
    created: function () {
        var self = this;

        self.addEventListener('click', function (e) {
            var option = e.target;

            if (self.disabled) {
                return;
            }

            if (option.nodeName !== 'O-OPTION') {
                while (option = option.parentElement) {
                    if (option === self) {
                        return;
                    } else if (option.nodeName === 'O-OPTION') {
                        if (option.disabled) {
                            return;
                        } else {
                            break;
                        }
                    }
                }
            }

            if (option && option.parentElement !== self) {
                var optgroup = option;
                while (optgroup = optgroup.parentElement) {
                    if (optgroup === self) {
                        break;
                    } else if (optgroup.nodeName === 'O-OPTGROUP') {
                        if (optgroup.disabled) {
                            return;
                        } else {
                            break;
                        }
                    }
                }
            }

            if (!self.multiple) {
                var options = self.options;
                for (var i = 0, l = options.length; i < l; i++) {
                    options[i].selected = false;
                }
            }

            option.selected = !option.selected;

            var binder = Oxe.binder.get('attribute', self, 'o-value');
            Oxe.binder.render(binder, 'view');
        });

    }
};
