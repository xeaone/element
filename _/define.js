var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
import bind from './bind';
import dash from './dash';
import { createdEvent, creatingEvent, renderedEvent, renderingEvent, adoptedEvent, adoptingEvent, connectedEvent, connectingEvent, attributedEvent, attributingEvent, disconnectedEvent, disconnectingEvent, } from './events';
var tick = function () { return Promise.resolve(); };
var setupInstance = function () {
    var _a;
    if (this.$internal.setup)
        return;
    else
        this.$internal.setup = true;
    var constructor = this.constructor;
    // const observedProperties = constructor.observedProperties;
    var observedProperties = constructor.observedProperties;
    var prototype = Object.getPrototypeOf(this);
    var properties = observedProperties ?
        observedProperties !== null && observedProperties !== void 0 ? observedProperties : [] : __spreadArray(__spreadArray([], Object.getOwnPropertyNames(this), true), Object.getOwnPropertyNames(prototype), true);
    var _loop_1 = function (property) {
        if ('attributeChangedCallback' === property ||
            'disconnectedCallback' === property ||
            'connectedCallback' === property ||
            'adoptedCallback' === property ||
            'constructor' === property ||
            'disconnected' === property ||
            'attribute' === property ||
            'connected' === property ||
            'rendered' === property ||
            'created' === property ||
            'adopted' === property ||
            'render' === property ||
            'setup' === property)
            return "continue";
        var descriptor = (_a = Object.getOwnPropertyDescriptor(this_1, property)) !== null && _a !== void 0 ? _a : Object.getOwnPropertyDescriptor(prototype, property);
        if (!descriptor)
            return "continue";
        if (!descriptor.configurable)
            return "continue";
        if (typeof descriptor.value === 'function')
            descriptor.value = descriptor.value.bind(this_1);
        if (typeof descriptor.get === 'function')
            descriptor.get = descriptor.get.bind(this_1);
        if (typeof descriptor.set === 'function')
            descriptor.set = descriptor.set.bind(this_1);
        Object.defineProperty(this_1., property, descriptor);
        Object.defineProperty(this_1, property, {
            configurable: false,
            enumerable: descriptor.enumerable,
            // configurable: descriptor.configurable,
            get: function () {
                return this.[property];
            },
            set: function (value) {
                this.[property] = value;
                this[update]();
            }
        });
    };
    var this_1 = this;
    for (var _i = 0, properties_1 = properties; _i < properties_1.length; _i++) {
        var property = properties_1[_i];
        _loop_1(property);
    }
};
var createMethod = function () {
    return __awaiter(this, void 0, void 0, function () {
        var template, fragment, index, newExpression;
        var _a, _b, _c, _d, _e, _f;
        return __generator(this, function (_g) {
            switch (_g.label) {
                case 0:
                    this.$internal.created = true;
                    this.$internal.queued = true;
                    this.$internal.started = true;
                    this.dispatchEvent(renderingEvent);
                    return [4 /*yield*/, ((_a = this.$state) === null || _a === void 0 ? void 0 : _a.call(this, this.$internal.state))];
                case 1:
                    _g.sent();
                    return [4 /*yield*/, ((_b = this.$render) === null || _b === void 0 ? void 0 : _b.call(this, this.$internal.state))];
                case 2:
                    template = _g.sent();
                    if (template) {
                        fragment = template.template.content.cloneNode(true);
                        this.$internal.marker = template.marker;
                        this.$internal.expressions = template.expressions;
                        bind(fragment, this.$internal.actions, this.$internal.marker);
                        for (index = 0; index < this.$internal.actions.length; index++) {
                            newExpression = template.expressions[index];
                            try {
                                this.$internal.actions[index](undefined, newExpression);
                            }
                            catch (error) {
                                console.error(error);
                            }
                        }
                        document.adoptNode(fragment);
                        this.$internal.root.appendChild(fragment);
                    }
                    this.dispatchEvent(creatingEvent);
                    return [4 /*yield*/, ((_d = (_c = this.$created) === null || _c === void 0 ? void 0 : _c.call(this, this.$internal.state)) === null || _d === void 0 ? void 0 : _d.catch(console.error))];
                case 3:
                    _g.sent();
                    this.dispatchEvent(createdEvent);
                    this.dispatchEvent(connectingEvent);
                    return [4 /*yield*/, ((_f = (_e = this.$connected) === null || _e === void 0 ? void 0 : _e.call(this, this.$internal.state)) === null || _f === void 0 ? void 0 : _f.catch(console.error))];
                case 4:
                    _g.sent();
                    this.dispatchEvent(connectedEvent);
                    this.$internal.queued = false;
                    this.$internal.started = false;
                    this.$internal.restart = false;
                    return [4 /*yield*/, this.$internal.update()];
                case 5:
                    _g.sent();
                    return [2 /*return*/];
            }
        });
    });
};
var updateMethod = function () {
    return __awaiter(this, void 0, void 0, function () {
        var _this = this;
        return __generator(this, function (_a) {
            if (this.$internal.queued && !this.$internal.started) {
                // console.debug('Update: queued and not started');
                return [2 /*return*/, this.$internal.task];
            }
            if (this.$internal.queued && this.$internal.started) {
                // console.debug('Update: queued and started');
                this.$internal.restart = true;
                return [2 /*return*/, this.$internal.task];
            }
            this.$internal.queued = true;
            this.$internal.task = this.$internal.task.then(function () { return __awaiter(_this, void 0, void 0, function () {
                var template, index, newExpression, oldExpression;
                var _a, _b, _c;
                return __generator(this, function (_d) {
                    switch (_d.label) {
                        case 0:
                            // console.debug('Update: in progress');
                            // await tick();
                            this.dispatchEvent(renderingEvent);
                            return [4 /*yield*/, ((_a = this.$render) === null || _a === void 0 ? void 0 : _a.call(this, this.$internal.state))];
                        case 1:
                            template = _d.sent();
                            this.$internal.started = true;
                            if (!template) return [3 /*break*/, 6];
                            index = 0;
                            _d.label = 2;
                        case 2:
                            if (!(index < this.$internal.actions.length)) return [3 /*break*/, 6];
                            if (!this.$internal.restart) return [3 /*break*/, 4];
                            // console.debug('Update: restart');
                            return [4 /*yield*/, tick()];
                        case 3:
                            // console.debug('Update: restart');
                            _d.sent();
                            index = -1;
                            this.$internal.restart = false;
                            return [3 /*break*/, 5];
                        case 4:
                            newExpression = template.expressions[index];
                            oldExpression = this.$internal.expressions[index];
                            try {
                                this.$internal.actions[index](oldExpression, newExpression);
                            }
                            catch (error) {
                                console.error(error);
                            }
                            this.$internal.expressions[index] = template.expressions[index];
                            _d.label = 5;
                        case 5:
                            index++;
                            return [3 /*break*/, 2];
                        case 6:
                            this.$internal.queued = false;
                            this.$internal.started = false;
                            return [4 /*yield*/, ((_c = (_b = this.$rendered) === null || _b === void 0 ? void 0 : _b.call(this, this.$internal.state)) === null || _c === void 0 ? void 0 : _c.catch(console.error))];
                        case 7:
                            _d.sent();
                            ;
                            this.dispatchEvent(renderedEvent);
                            return [2 /*return*/];
                    }
                });
            }); }).catch(console.error);
            return [2 /*return*/, this.$internal.task];
        });
    });
};
var attributeChangedCallback = function (name, oldValue, newValue) {
    return __awaiter(this, void 0, void 0, function () {
        var _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    setupInstance.call(this);
                    this.dispatchEvent(attributingEvent);
                    return [4 /*yield*/, ((_b = (_a = this.$attributed) === null || _a === void 0 ? void 0 : _a.call(this, name, oldValue, newValue)) === null || _b === void 0 ? void 0 : _b.catch(console.error))];
                case 1:
                    _c.sent();
                    this.dispatchEvent(attributedEvent);
                    return [2 /*return*/];
            }
        });
    });
};
var adoptedCallback = function () {
    return __awaiter(this, void 0, void 0, function () {
        var _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    setupInstance.call(this);
                    this.dispatchEvent(adoptingEvent);
                    return [4 /*yield*/, ((_b = (_a = this.$adopted) === null || _a === void 0 ? void 0 : _a.call(this, this.$internal.state)) === null || _b === void 0 ? void 0 : _b.catch(console.error))];
                case 1:
                    _c.sent();
                    this.dispatchEvent(adoptedEvent);
                    return [2 /*return*/];
            }
        });
    });
};
var connectedCallback = function () {
    return __awaiter(this, void 0, void 0, function () {
        var _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    setupInstance.call(this);
                    if (!!this.$internal.created) return [3 /*break*/, 2];
                    return [4 /*yield*/, this.$internal.create()];
                case 1:
                    _c.sent();
                    return [3 /*break*/, 4];
                case 2:
                    this.dispatchEvent(connectingEvent);
                    return [4 /*yield*/, ((_b = (_a = this.$connected) === null || _a === void 0 ? void 0 : _a.call(this, this.$internal.state)) === null || _b === void 0 ? void 0 : _b.catch(console.error))];
                case 3:
                    _c.sent();
                    this.dispatchEvent(connectedEvent);
                    _c.label = 4;
                case 4: return [2 /*return*/];
            }
        });
    });
};
var disconnectedCallback = function () {
    return __awaiter(this, void 0, void 0, function () {
        var _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    setupInstance.call(this);
                    this.dispatchEvent(disconnectingEvent);
                    return [4 /*yield*/, ((_b = (_a = this.$disconnected) === null || _a === void 0 ? void 0 : _a.call(this, this.$internal.state)) === null || _b === void 0 ? void 0 : _b.catch(console.error))];
                case 1:
                    _c.sent();
                    this.dispatchEvent(disconnectedEvent);
                    return [2 /*return*/];
            }
        });
    });
};
var init = function (target, tag) {
    var $tag = dash(tag);
    Object.defineProperties(target, { $tag: { value: $tag } });
    Object.defineProperties(target.prototype, {
        $internal: {
            get: function () {
                var $shadow = target.$shadow;
                var value = {
                    setup: false,
                    queued: false,
                    created: false,
                    restart: false,
                    started: false,
                    marker: '',
                    actions: [],
                    expressions: [],
                    task: Promise.resolve(),
                    create: createMethod.bind(this),
                    update: updateMethod.bind(this),
                    state: {},
                    // state: context({}, updateMethod.bind(this)),
                    root: $shadow === 'open' || $shadow === 'closed' ? this.attachShadow({ mode: $shadow }) : this,
                };
                Object.defineProperty(this, '$internal', {
                    value: value,
                    writable: false,
                    enumerable: false,
                    configurable: false,
                });
                return value;
            }
        },
        // [create]: { value: createMethod },
        // [update]: { value: updateMethod },
        adoptedCallback: { value: adoptedCallback },
        connectedCallback: { value: connectedCallback },
        disconnectedCallback: { value: disconnectedCallback },
        attributeChangedCallback: { value: attributeChangedCallback },
    });
    // if (customElements.get(target.$tag as string) !== (target as any)) {
    var $extend = target.$extend;
    customElements.define($tag, target, { extends: $extend });
    // }
    return target;
};
export var define = function (tag) {
    return function (constructor, context) {
        if (context !== undefined) {
            return context.addInitializer(function () { return init(constructor, tag); });
        }
        else {
            return init(constructor, tag);
        }
    };
};
export default define;
