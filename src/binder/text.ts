import format from '../format';

const text = async function text (binder) {
    // binder.owner.nodeValue = format(await binder.compute());
    let data = await binder.compute();
    binder.owner.nodeValue = format(data);
    // binder.owner.nodeValue = data ?? '';
    // binder.owner.nodeValue = data === undefined ? '' : data;
};

export default text;

