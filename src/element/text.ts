import format from './format.ts';

const textRender = function (binder: any) {
    const data = binder.compute();
    binder.owner.textContent = format(data);
};

const textUnrender = function (binder: any) {
    binder.owner.textContent = '';
};

export default { render: textRender, unrender: textUnrender };

