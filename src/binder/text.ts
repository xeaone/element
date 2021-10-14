import format from '../format';

const textRender = async function (binder) {
    let data = await binder.compute();
    binder.owner.nodeValue = format(data);
};

const textUnrender = async function (binder) {
    binder.owner.nodeValue = '';
};

export default { render: textRender, unrender: textUnrender };

