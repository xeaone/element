import format from '../format';

const textRender = function (binder) {
    let data = binder.compute();
    binder.owner.textContent = format(data);
};

const textUnrender = function (binder) {
    binder.owner.textContent = '';
};

export default { render: textRender, unrender: textUnrender };

