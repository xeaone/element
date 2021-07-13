import format from '../format';

const text = async function text (binder) {
    let data = await binder.compute();
    binder.owner.nodeValue = format(data);
};

export default text;

