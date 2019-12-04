/*
	Name: oxe-components
	Version: 4.1.1
	License: MPL-2.0
	Author: Arc IO
	Email: undefined
	This Source Code Form is subject to the terms of the Mozilla Public
	License, v. 2.0. If a copy of the MPL was not distributed with this
	file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/

export default [
    {
        name: 'o-select',
        template: '<slot></slot>',
        attributes: [ 'multiple' ],
        style: 'o-select { display: block; }',
        created: function () {
            this.tabIndex = 0;
        },
        attributed: function (name, _, data) {
            switch (name) {
                case 'multiple': this.multiple = false; break;
            }
        },
        properties: {
            _selectedOptions: { writable: true, value: [] },
            selectedOptions: {
                enumerable: true,
                get: function () {
                    return this._selectedOptions;
                }
            },
            required: {
                enumerable: true,
                get: function () {
                    return this.hasAttribute('required');
                },
                set: function (data) {
                    data = data ? true : false;
                    if (data) this.setAttribute('required', '');
                    else this.removeAttribute('required');
                    return data;
                }
            },
            checkValidity: {
                enumerable: true,
                value: function () {
                    if (this.required) {
                        return this._selectedOptions.length ? true : false;
                    } else {
                        return true;
                    }
                }
            },
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

                    if (data) {
                        this.setAttribute('multiple', '');
                    } else {
                        this.removeAttribute('multiple');
                        this._selectedOptions.slice(1).forEach(function (option) {
                            option.selected = false;
                        });
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
        }
    },
    {
        name: 'o-optgroup',
        attributes: ['label'],
        template: '<slot></slot>',
        style: 'o-optgroup { display: block; } o-optgroup::before { content: attr(label); }',
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
            },
            label: {
                enumerable: true,
                get: function () {
                    return this.getAttribute('label');
                },
                set: function (data) {
                    return this.setAttribute('label', data);
                }
            }
        },
        attributed: function (name, _, data) {
            switch (name) {
                case 'label': this.label = data; break;
            }
        },
        created: function () {
            if (this.parentElement && this.parentElement.nodeName !== 'O-SELECT') {
                console.warn('o-optgroup invalid parent element');
            }
        }
    },
    {
        name: 'o-option',
        template: '<slot></slot>',
        style: 'o-option { display: block; }',
        attributes: [ 'value' ],
        properties: {
            _select: {
                get: function () {
                    if (!this.parentElement) {
                        return null;
                    } else if (this.parentElement.nodeName === 'O-SELECT') {
                        return this.parentElement;
                    } else if (!this.parentElement.parentElement) {
                        return null;
                    } else if (this.parentElement.parentElement.nodeName === 'O-SELECT') {
                        return this.parentElement.parentElement;
                    } else {
                        console.warn('o-option invalid parent type');
                    }
                }
            },
            _group: {
                get: function () {
                    if (this.parentElement && this.parentElement.nodeName === 'O-OPTGROUP') {
                        return this.parentElement;
                    }
                }
            },
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

                    var selected = this._selected = data ? true : false;
                    if (selected) this.setAttribute('data-selected', '');
                    else this.removeAttribute('data-selected');

                    var select = this._select;
                    if (!select) return selected;

                    if (select.multiple === false) {
                        var old = select._selectedOptions[0];
                        if (old && this !== old) {
                            old.selected = false
                        }
                    }

                    var index = select._selectedOptions.indexOf(this);

                    if (selected) {
                        if (index === -1) {
                            select._selectedOptions.push(this);
                        }
                    } else {
                        if (index !== -1) {
                           select._selectedOptions.splice(index, 1);
                        }
                    }

                    return selected;
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
            },
        },
        attributed: function (name, _, data) {
            switch (name) {
                case 'value': this._value = data || ''; break;
            }
        },
        created: function () {
            var self = this;

            self.addEventListener('click', function () {
                var group = self._group;
                var select = self._select;

                if (self.disabled || (select && select.disabled) || (group && group.disabled)) {
                    return;
                }

                self.selected = !self.selected;

                if (select) {
                    var binder = Oxe.binder.get(select, 'o-value');
                    if (binder) Oxe.binder.render(binder, 'view');
                }

            });

            if (self.hasAttribute('selected')) {
                click();
                self.setAttribute('data-selected', '');
            } else {
                self.removeAttribute('data-selected');
            }

        }
    }
];
