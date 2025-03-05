var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
import { hasOn, isMarker, isValue, sliceOn, isLink, isBool, hasMarker, dangerousLink, removeBetween } from './tools';
import display from './display';
import { symbol } from './html';
// const TEXT_NODE = Node.TEXT_NODE;
// const ELEMENT_NODE = Node.ELEMENT_NODE;
// const FILTER = NodeFilter.SHOW_ELEMENT + NodeFilter.SHOW_TEXT;
var FILTER = 1 + 4;
var TEXT_NODE = 3;
var ELEMENT_NODE = 1;
var ElementAction = function (source, target) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m;
    if ((target === null || target === void 0 ? void 0 : target.symbol) === symbol) {
        source = source !== null && source !== void 0 ? source : {};
        target = target !== null && target !== void 0 ? target : {};
        if (source.strings === target.strings) {
            var l = this.actions.length;
            for (var i = 0; i < l; i++) {
                this.actions[i](source.expressions[i], target.expressions[i]);
            }
        }
        else {
            this.actions.length = 0;
            // const fragment = document.importNode(target.template.content, true);
            var fragment = target.template.content.cloneNode(true);
            Bind(fragment, this.actions, target.marker);
            var l = this.actions.length;
            for (var i = 0; i < l; i++) {
                this.actions[i]((_a = source.expressions) === null || _a === void 0 ? void 0 : _a[i], target.expressions[i]);
            }
            document.adoptNode(fragment);
            removeBetween(this.start, this.end);
            (_b = this.end.parentNode) === null || _b === void 0 ? void 0 : _b.insertBefore(fragment, this.end);
        }
    }
    else if ((target === null || target === void 0 ? void 0 : target.constructor) === Array) {
        source = source !== null && source !== void 0 ? source : [];
        target = target !== null && target !== void 0 ? target : [];
        var oldLength = source.length;
        var newLength = target.length;
        var common = Math.min(oldLength, newLength);
        for (var i = 0; i < common; i++) {
            this.actions[i](source[i], target[i]);
        }
        if (oldLength < newLength) {
            var template = document.createElement('template');
            for (var i = oldLength; i < newLength; i++) {
                var startChild = document.createTextNode('');
                var endChild = document.createTextNode('');
                var action = ElementAction.bind({
                    start: startChild,
                    end: endChild,
                    actions: []
                });
                template.content.appendChild(startChild);
                template.content.appendChild(endChild);
                this.actions.push(action);
                action(source[i], target[i]);
            }
            (_c = this.end.parentNode) === null || _c === void 0 ? void 0 : _c.insertBefore(template.content, this.end);
        }
        else if (oldLength > newLength) {
            for (var i = oldLength - 1; i > newLength - 1; i--) {
                if (((_d = source[i]) === null || _d === void 0 ? void 0 : _d.symbol) === symbol) {
                    var template = source[i].template;
                    var removes = template.content.childNodes.length + 2;
                    while (removes--)
                        (_e = this.end.parentNode) === null || _e === void 0 ? void 0 : _e.removeChild(this.end.previousSibling);
                }
                else {
                    (_f = this.end.parentNode) === null || _f === void 0 ? void 0 : _f.removeChild(this.end.previousSibling);
                    (_g = this.end.parentNode) === null || _g === void 0 ? void 0 : _g.removeChild(this.end.previousSibling);
                    (_h = this.end.parentNode) === null || _h === void 0 ? void 0 : _h.removeChild(this.end.previousSibling);
                }
            }
            this.actions.length = newLength;
        }
    }
    else {
        if (source === target) {
            return;
        }
        else if (this.end.previousSibling === this.start) {
            (_j = this.end.parentNode) === null || _j === void 0 ? void 0 : _j.insertBefore(document.createTextNode(display(target)), this.end);
        }
        else if (((_k = this.end.previousSibling) === null || _k === void 0 ? void 0 : _k.nodeType) === TEXT_NODE &&
            ((_l = this.end.previousSibling) === null || _l === void 0 ? void 0 : _l.previousSibling) === this.start) {
            this.end.previousSibling.textContent = display(target);
        }
        else {
            removeBetween(this.start, this.end);
            (_m = this.end.parentNode) === null || _m === void 0 ? void 0 : _m.insertBefore(document.createTextNode(display(target)), this.end);
        }
    }
};
var AttributeNameAction = function (source, target) {
    if (source === target) {
        return;
    }
    else if (isValue(source)) {
        this.element.removeAttribute(source);
        Reflect.set(this.element, source, null);
    }
    else if (hasOn(source)) {
        if (typeof this.value === 'function') {
            this.element.removeEventListener(sliceOn(source), this.value, true);
        }
    }
    else if (isLink(source)) {
        this.element.removeAttribute(source);
    }
    else if (isBool(source)) {
        this.element.removeAttribute(source);
        Reflect.set(this.element, source, false);
    }
    else if (source) {
        this.element.removeAttribute(source);
        Reflect.deleteProperty(this.element, source);
    }
    this.name = (target === null || target === void 0 ? void 0 : target.toLowerCase()) || '';
    if (!this.name) {
        return;
    }
    else if (hasOn(this.name)) {
        return;
    }
    else if (isBool(this.name)) {
        this.element.setAttribute(this.name, '');
        Reflect.set(this.element, this.name, true);
    }
    else {
        this.element.setAttribute(this.name, '');
        Reflect.set(this.element, this.name, undefined);
    }
};
var AttributeValueAction = function (source, target) {
    if (source === target) {
        return;
    }
    else if (isValue(this.name)) {
        this.value = display(target);
        if (!this.name)
            return;
        this.element.setAttribute(this.name, this.value);
        Reflect.set(this.element, this.name, this.value);
    }
    else if (hasOn(this.name)) {
        // console.log(this.name, source, target, this.element);
        if (!this.name)
            return;
        if (typeof this.value === 'function') {
            this.element.removeEventListener(sliceOn(this.name), this.value, true);
        }
        if (typeof target !== 'function') {
            return console.warn("XElement - attribute name \"".concat(this.name, "\" and value \"").concat(this.value, "\" not allowed"));
        }
        this.value = function () { return target.call.apply(target, __spreadArray([this], arguments, false)); };
        this.element.addEventListener(sliceOn(this.name), this.value, true);
    }
    else if (isLink(this.name)) {
        this.value = encodeURI(target);
        if (!this.name)
            return;
        if (dangerousLink(this.value)) {
            this.element.removeAttribute(this.name);
            console.warn("XElement - attribute name \"".concat(this.name, "\" and value \"").concat(this.value, "\" not allowed"));
            return;
        }
        this.element.setAttribute(this.name, this.value);
    }
    else {
        this.value = target;
        if (!this.name)
            return;
        this.element.setAttribute(this.name, this.value);
        Reflect.set(this.element, this.name, this.value);
    }
};
var TagAction = function (source, target) {
    var _a, _b, _c, _d;
    if (source === target)
        return;
    var oldElement = this.element;
    if (target) {
        (_a = oldElement.parentNode) === null || _a === void 0 ? void 0 : _a.removeChild(oldElement);
        var newElement = document.createElement(target);
        while (oldElement.firstChild)
            newElement.appendChild(oldElement.firstChild);
        if (oldElement.nodeType === ELEMENT_NODE) {
            var attributeNames = oldElement.getAttributeNames();
            for (var _i = 0, attributeNames_1 = attributeNames; _i < attributeNames_1.length; _i++) {
                var attributeName = attributeNames_1[_i];
                var attributeValue = (_b = oldElement.getAttribute(attributeName)) !== null && _b !== void 0 ? _b : '';
                newElement.setAttribute(attributeName, attributeValue);
            }
        }
        (_c = this.holder.parentNode) === null || _c === void 0 ? void 0 : _c.insertBefore(newElement, this.holder);
        this.element = newElement;
    }
    else {
        (_d = oldElement.parentNode) === null || _d === void 0 ? void 0 : _d.removeChild(oldElement);
        this.element = oldElement;
    }
};
export var Bind = function (fragment, actions, marker) {
    var _a, _b, _c, _d, _e, _f;
    var holders = new WeakSet();
    var walker = document.createTreeWalker(fragment, FILTER, null);
    walker.currentNode = fragment;
    var node = fragment.firstChild;
    var _loop_1 = function () {
        if (holders.has(node.previousSibling)) {
            holders.delete(node.previousSibling);
            actions.push(function () { return undefined; });
        }
        if (node.nodeType === TEXT_NODE) {
            var startIndex = (_b = (_a = node.nodeValue) === null || _a === void 0 ? void 0 : _a.indexOf(marker)) !== null && _b !== void 0 ? _b : -1;
            if (startIndex === -1)
                return "continue";
            if (startIndex !== 0) {
                node.splitText(startIndex);
                node = walker.nextNode();
            }
            var endIndex = marker.length;
            if (endIndex !== ((_c = node.nodeValue) === null || _c === void 0 ? void 0 : _c.length)) {
                node.splitText(endIndex);
            }
            var start = document.createTextNode('');
            var end = node;
            end.textContent = '';
            (_d = end.parentNode) === null || _d === void 0 ? void 0 : _d.insertBefore(start, end);
            actions.push(ElementAction.bind({ marker: marker, start: start, end: end, actions: [], }));
        }
        else if (node.nodeType === ELEMENT_NODE) {
            if (node.nodeName === 'SCRIPT' || node.nodeName === 'STYLE') {
                walker.nextSibling();
            }
            var tMeta_1 = {
                element: node,
            };
            if (isMarker(node.nodeName, marker)) {
                holders.add(node);
                tMeta_1.holder = document.createTextNode('');
                (_e = node.parentNode) === null || _e === void 0 ? void 0 : _e.insertBefore(tMeta_1.holder, node);
                actions.push(TagAction.bind(tMeta_1));
            }
            var names = node.getAttributeNames();
            for (var _i = 0, names_1 = names; _i < names_1.length; _i++) {
                var name_1 = names_1[_i];
                var value = (_f = node.getAttribute(name_1)) !== null && _f !== void 0 ? _f : '';
                if (hasMarker(name_1, marker) || hasMarker(value, marker)) {
                    var aMeta = {
                        name: name_1,
                        value: value,
                        previous: undefined,
                        get element() {
                            return tMeta_1.element;
                        },
                    };
                    if (hasMarker(name_1, marker)) {
                        node.removeAttribute(name_1);
                        actions.push(AttributeNameAction.bind(aMeta));
                    }
                    if (hasMarker(value, marker)) {
                        node.removeAttribute(name_1);
                        actions.push(AttributeValueAction.bind(aMeta));
                    }
                }
                else {
                    if (isLink(name_1)) {
                        if (dangerousLink(value)) {
                            node.removeAttribute(name_1);
                            console.warn("XElement - attribute name \"".concat(name_1, "\" and value \"").concat(value, "\" not allowed"));
                        }
                    }
                    else if (hasOn(name_1)) {
                        node.removeAttribute(name_1);
                        console.warn("XElement - attribute name \"".concat(name_1, "\" not allowed"));
                    }
                }
            }
        }
        else {
            console.warn("XElement - node type \"".concat(node.nodeType, "\" not handled"));
        }
    };
    while (node = walker.nextNode()) {
        _loop_1();
    }
};
export default Bind;
