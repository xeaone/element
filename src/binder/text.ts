import format from '../format';

const text = async function text (binder) {
    let data = await binder.compute();
    let nodeValue = format(data);
    binder.owner.nodeValue = nodeValue;
};

export default text;

