import format from './format.js';

const textRender = function (binder) {
    const data = binder.compute();
    binder.node.textContent = format(data);
};

const textDerender = function (binder) {
    binder.node.textContent = '';
};

export default { render: textRender, derender: textDerender };
