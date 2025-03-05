var init = function (target, tag) {
    Object.defineProperties(target, {
        $extend: { value: tag },
    });
    return target;
};
export var extend = function (tag) {
    return function (constructor, context) {
        if (context !== undefined) {
            return context.addInitializer(function () { return init(constructor, tag); });
        }
        else {
            return init(constructor, tag);
        }
    };
};
export default extend;
