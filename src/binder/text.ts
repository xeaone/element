import format from '../format';

const textRender = async function (binder) {
    let data = await binder.compute();
    binder.owner.textContent = format(data);
};

const textUnrender = async function (binder) {
    binder.owner.textContent = '';
};

export default { render: textRender, unrender: textUnrender };

