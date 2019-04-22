
export default function (option, method, event) {
    const type = event.type;

    let before;
    let after;

    if (type in option.listener) {
        before = typeof option.listener[type].before === 'function' ? option.listener[type].before.bind(null, event) : null;
        after = typeof option.listener[type].after === 'function' ? option.listener[type].after.bind(null, event) : null;
    }

    Promise.resolve()
        .then(before)
        .then(method.bind(null, event))
        .then(after)
        .catch(console.error);

}
