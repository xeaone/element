import format from '../format';

const text = async function text (binder) {
    if (binder.cancel) return binder.cancel();

    let data = await binder.compute();
    if (binder.cancel) return binder.cancel();

    binder.owner.nodeValue = format(data);
};

export default text;

