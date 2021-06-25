import format from '../format';

const write = async function (binder) {
    let data = await binder.compute();
    data = format(data);
    if (data === binder.owner.textContent) return;
    binder.owner.textContent = data;
};

export default { write };