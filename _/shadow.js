var init = function (target, mode) {
    Object.defineProperties(target, {
        $shadow: { value: mode !== null && mode !== void 0 ? mode : 'open' },
    });
    return target;
};
export var shadow = function (mode) {
    return function (constructor, context) {
        if (context !== undefined) {
            return context.addInitializer(function () { return init(constructor, mode); });
        }
        else {
            return init(constructor, mode);
        }
    };
};
export default shadow;
