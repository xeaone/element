import format from './format.js';

const textRender = async function (binder) {
    const data = await binder.compute();
    binder.node.textContent = format(data);
};

const textDerender = async function (binder) {
    binder.node.textContent = '';
};

export default { render: textRender, derender: textDerender };
