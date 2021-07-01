import format from '../format';

const text = async function text (binder) {
    let data = await binder.compute();
    data = format(data);
    if (data === binder.owner.textContent) return;
    binder.owner.textContent = data;
};

export default text;

// const write = async function (binder) {
//     let data = await binder.compute();
//     data = format(data);
//     if (data === binder.owner.textContent) return;
//     binder.owner.textContent = data;
// };

// export default { write };