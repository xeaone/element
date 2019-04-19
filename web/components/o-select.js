
Oxe.component.define({
    name: 'o-optgroup',
    style: 'o-optgroup { display: block; } o-optgroup::before { content: attr(label); }',
    template: '<slot></slot>',
    attributes: [ 'disabled' ],
    properties: {
        _disabled: {
            writable: true,
            value: false
        },
        disabled: {
            enumerable: true,
            get: function () {
                return this._disabled;
            },
            set: function (data) {
                this._disabled = data ? true : false;

                if (this._disabled) {
                    this.setAttribute('disabled', '');
                } else {
                    this.removeAttribute('disabled');
                }

                return this._disabled;
            }
        }
    },
    attributed: function (name, _, value) {
        this._disabled = value !== null && value !== 'false' ? true : false;
    }
});

Oxe.component.define({
    name: 'o-options',
    style: 'o-options { display: block; } o-options::before { content: attr(label); }',
    template: '<slot></slot>',
    attributes: [ 'disabled' ],
    properties: {
        _disabled: {
            writable: true,
            value: false
        },
        disabled: {
            enumerable: true,
            get: function () {
                return this._disabled;
            },
            set: function (data) {
                this._disabled = data ? true : false;

                if (this._disabled) {
                    this.setAttribute('disabled', '');
                } else {
                    this.removeAttribute('disabled');
                }

                return this._disabled;
            }
        }
    },
    attributed: function (name, _, value) {
        this._disabled = value !== null && value !== 'false' ? true : false;
    }
});

Oxe.component.define({
    name: 'o-option',
    template: '<slot></slot>',
    style: 'o-option { display: block; }',
    attributes: [ 'value', 'selected', 'disabled' ],
    properties: {
        _valueDefaultLocked: {
            writable: true,
            value: false
        },
        _value: {
            writable: true,
            value: ''
        },
        _disabled: {
            writable: true,
            value: false
        },
        _selected: {
            writable: true,
            value: false
        },
        value: {
            enumerable: true,
            get: function () {
                if (!this._value && !this._valueDefaultLocked) {
                    return this.getAttribute('value') || '';
                } else {
                    return this._value;
                }
            },
            set: function (data) {
                this._valueDefaultLocked = true;
                this._value = data || '';
                return this._value;
            }
        },
        selected: {
            enumerable: true,
            get: function () {
                return this._selected;
            },
            set: function (data) {
                this._selected = data ? true : false;

                if (this._selected) {
                    this.setAttribute('selected', '');
                } else {
                    this.removeAttribute('selected');
                }

                return this._selected;
            }
        },
        disabled: {
            enumerable: true,
            get: function () {
                return this._disabled;
            },
            set: function (data) {
                this._disabled = data ? true : false;

                if (this._disabled) {
                    this.setAttribute('disabled', '');
                } else {
                    this.removeAttribute('disabled');
                }

                return this._disabled;
            }
        }
    },
    attributed: function (name, _, value) {
        if (name === 'value') {
            this._value = value || '';
        } else if (name === 'selected' || name === 'disabled') {
            this['_' + name] = value !== null && value !== 'false' ? true : false;
        }
    }
});

export default {
    name: 'o-select',
    template: '<slot></slot>',
    style: 'o-select { display: block; }',
    model: [],
    properties: {
        options: {
            enumerable: true,
            get: function () {
                return this.querySelectorAll('o-option');
            }
        },
        multiple: {
            enumerable: true,
            get: function () {
                return this.hasAttribute('multiple');
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
        }
    },
    created: function () {
        var self = this;
        var binder = Oxe.binder.get('attribute', self, 'o-value');
        var value = Oxe.utility.value(self, this.model);

        binder.data = value;

        self.addEventListener('click', function (e) {
            var target = e.target;

            if (target.nodeName !== 'O-OPTION') {
                while (target = target.parentElement) {
                    if (target === self) {
                        return;
                    } else if (target.nodeName === 'O-OPTION') {
                        break;
                    }
                }
            }

            let group = target;
            while (group = group.parentElement) {
                if (group === self) {
                    break;
                } else if (group.nodeName === 'O-OPTIONS' || group.nodeName === 'O-OPTGROUP') {
                    if (group.disabled) {
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

            target.selected = !target.selected;

            var binder = Oxe.binder.get('attribute', self, 'o-value');
            var value = Oxe.utility.value(self, this.model);

            binder.data = value;
        });

    }
};
