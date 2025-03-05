import mark from './mark';
import { createHTML } from './poly';
// import parse from './parse';
export var symbol = Symbol('html');
var cache = new WeakMap();
export default function html(strings) {
    var expressions = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        expressions[_i - 1] = arguments[_i];
    }
    var value = cache.get(strings);
    if (value) {
        var template = value[0], marker = value[1];
        return { strings: strings, template: template, expressions: expressions, symbol: symbol, marker: marker };
    }
    else {
        var marker = "x-".concat(mark(), "-x");
        // const marker = `X-${mark()}-X`;
        var data = '';
        var length_1 = strings.length - 1;
        for (var index = 0; index < length_1; index++) {
            data += "".concat(strings[index]).concat(marker);
        }
        data += strings[length_1];
        var template = document.createElement('template');
        template.innerHTML = createHTML(data);
        cache.set(strings, [template, marker]);
        return { strings: strings, template: template, expressions: expressions, symbol: symbol, marker: marker };
    }
}
