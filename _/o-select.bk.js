
Oxe.component.define({
    name: 'o-optgroup',
    style: 'o-optgroup { display: block; } o-optgroup::before { content: attr(label); }',
    template: '<slot></slot>',
    properties: {
        disabled: {
            enumerable: true,
            get: function () {
                var disabled = this.getAttribute('disabled');
                return disabled !== null && disabled !== 'false' ? true : false;
            },
            set: function (data) {
                data = data ? true : false;

                if (data) {
                    this.setAttribute('disabled', '');
                } else {
                    this.removeAttribute('disabled');
                }

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
                return this._value = data || '';
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
                return this._selected = data ? true : false;
            }
        },
        disabled: {
            enumerable: true,
            get: function () {
                var disabled = this.getAttribute('disabled');
                return disabled !== null && disabled !== 'false' ? true : false;
            },
            set: function (data) {
                data = data ? true : false;

                if (data) {
                    this.setAttribute('disabled', '');
                } else {
                    this.removeAttribute('disabled');
                }

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
    }
});

export default {
    name: 'o-select',
    template: '<slot></slot>',
    style: 'o-select { display: block; }',
    // model: [],
    properties: {
        update: {
            enumerable: true,
            value: function (element) {
                if (element.hasAttribute('o-value')) {
                    var binder = Oxe.binder.get('attribute', element, 'o-value');
                    var value = Oxe.utility.value(element, this.model);
                    binder.data = value;
                }
            }
        },
        options: {
            enumerable: true,
            get: function () {
                return this.querySelectorAll('o-option');
            }
        },
        multiple: {
            enumerable: true,
            get: function () {
                var multiple = this.getAttribute('multiple');
                return multiple !== null && multiple !== 'false' ? true : false;
            },
            set: function (data) {
                data = data ? true : false;

                if (data) {
                    this.setAttribute('multiple', '');
                } else {
                    this.removeAttribute('multiple');
                }

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

        // self.update();

        self.addEventListener('click', function (e) {
            var option = e.target;

            if (option.nodeName !== 'O-OPTION') {
                while (option = option.parentElement) {
                    if (option === self) {
                        return;
                    } else if (option.nodeName === 'O-OPTION') {
                        break;
                    }
                }
            }

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

            if (!self.multiple) {
                var options = self.options;
                for (var i = 0, l = options.length; i < l; i++) {
                    options[i].selected = false;
                }
            }

            option.selected = !option.selected;

            // self.update();
            var binder = Oxe.binder.get('attribute', self, 'o-value');
            Oxe.binder.render(binder, 'view');
            // var value = Oxe.utility.value(binder.target, binder.container.model);
            // binder.data = value;
        });

    }
};
