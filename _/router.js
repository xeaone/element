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
import { replaceChildren } from './poly';
// import component, { task } from './component';
import dash from './dash';
import upgrade from './upgrade';
var alls = [];
var routes = [];
// const position = function (parent: Element) {
//     return {
//         parent: parent?.scrollTop,
//         body: document?.body?.scrollTop,
//         documentElement: document?.documentElement?.scrollTop,
//     };
// };
var tick = function (element) {
    var _this = this;
    return new Promise(function (resolve) { return __awaiter(_this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            if (element && element) {
                // if (element && element instanceof component) {
                // await element[ task ];
                requestAnimationFrame(function () { return resolve(undefined); });
            }
            else {
                requestAnimationFrame(function () { return resolve(undefined); });
            }
            return [2 /*return*/];
        });
    }); });
};
// window.addEventListener('popstate', (event) => {
//     console.log(event);
// });
var transition = function (route) {
    return __awaiter(this, void 0, void 0, function () {
        var ready, result, ready;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    if (!route.instance) return [3 /*break*/, 2];
                    ready = tick(route.instance);
                    replaceChildren(route.root, route.instance);
                    return [4 /*yield*/, ready];
                case 1:
                    _b.sent();
                    return [3 /*break*/, 5];
                case 2: return [4 /*yield*/, route.handler()];
                case 3:
                    result = _b.sent();
                    if ((result === null || result === void 0 ? void 0 : result.prototype) instanceof HTMLElement) {
                        route.construct = result;
                    }
                    else if (((_a = result === null || result === void 0 ? void 0 : result.default) === null || _a === void 0 ? void 0 : _a.prototype) instanceof HTMLElement) {
                        route.construct = result.default;
                    }
                    else {
                        throw new Error('XElement - router handler requires Module or CustomElementConstructor');
                    }
                    // if (route.construct.prototype instanceof component) {
                    //     route.instance = await (route.construct as typeof component).create();
                    // } else {
                    route.tag = dash(route.construct.name);
                    if (customElements.get(route.tag) !== route.construct) {
                        customElements.define(route.tag, route.construct);
                    }
                    route.instance = document.createElement(route.tag);
                    upgrade(route.instance);
                    ready = tick(route.instance);
                    replaceChildren(route.root, route.instance);
                    return [4 /*yield*/, ready];
                case 4:
                    _b.sent();
                    _b.label = 5;
                case 5: return [2 /*return*/];
            }
        });
    });
};
var navigate = function (event) {
    var _this = this;
    var _a, _b, _c;
    if (event && 'canIntercept' in event && event.canIntercept === false)
        return;
    if (event && 'canTransition' in event && event.canTransition === false)
        return;
    var destination = new URL((_a = event === null || event === void 0 ? void 0 : event.destination.url) !== null && _a !== void 0 ? _a : location.href);
    var base = new URL((_c = (_b = document.querySelector('base')) === null || _b === void 0 ? void 0 : _b.href) !== null && _c !== void 0 ? _c : location.origin);
    base.hash = '';
    base.search = '';
    destination.hash = '';
    destination.search = '';
    var pathname = destination.href.replace(base.href, '/');
    var transitions = [];
    // window.history.replaceState(destination.href, JSON.stringify(position(route.root)));
    for (var _i = 0, routes_1 = routes; _i < routes_1.length; _i++) {
        var route = routes_1[_i];
        if (route.path !== pathname)
            continue;
        transitions.push(route);
    }
    for (var _d = 0, alls_1 = alls; _d < alls_1.length; _d++) {
        var all = alls_1[_d];
        var has = false;
        for (var _e = 0, transitions_1 = transitions; _e < transitions_1.length; _e++) {
            var transition_1 = transitions_1[_e];
            if (transition_1.root === all.root) {
                has = true;
                break;
            }
        }
        if (has)
            continue;
        transitions.push(all);
    }
    if (event === null || event === void 0 ? void 0 : event.intercept) {
        return event.intercept({
            handler: function () { return __awaiter(_this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, Promise.all(transitions.map(function (route) { return transition(route); }))];
                        case 1:
                            _a.sent();
                            return [2 /*return*/];
                    }
                });
            }); }
        });
    }
    else if (event === null || event === void 0 ? void 0 : event.transitionWhile) {
        return event.transitionWhile(Promise.all(transitions.map(function (route) { return transition(route); })));
    }
    else {
        Promise.all(transitions.map(function (route) { return transition(route); }));
    }
};
var router = function (path, root, handler) {
    if (!path)
        throw new Error('XElement - router path required');
    if (!handler)
        throw new Error('XElement - router handler required');
    if (!root)
        throw new Error('XElement - router root required');
    if (path === '/*') {
        for (var _i = 0, alls_2 = alls; _i < alls_2.length; _i++) {
            var all = alls_2[_i];
            if (all.path === path && all.root === root) {
                throw new Error('XElement - router duplicate path on root');
            }
        }
        alls.push({ path: path, root: root, handler: handler, });
    }
    else {
        for (var _a = 0, routes_2 = routes; _a < routes_2.length; _a++) {
            var route = routes_2[_a];
            if (route.path === path && route.root === root) {
                throw new Error('XElement - router duplicate path on root');
            }
        }
        routes.push({ path: path, root: root, handler: handler, instance: undefined });
    }
    Reflect.get(window, 'navigation').addEventListener('navigate', navigate);
};
export default router;
