// import Batcher from './batcher.js';
// import Utility from './utility.js';
import Binder from './binder.js';
// import Select from './select.js';

export default async function (node, attribute) {

    if (!node) throw new Error('Oxe.update - requires node argument');
    if (!attribute) throw new Error('Oxe.update - requires attribute argument');

    const binder = Binder.get('attribute', node, attribute);

    // const read = function () {

    // const value = Utility.value(binder.target, binder.container.model);
    // binder.data = value;

    // const type = binder.target.type;
    // const name = binder.target.nodeName;
    // if (type === 'checkbox' || name.indexOf('-CHECKBOX') !== -1) {
    //     binder.data = binder.target.checked || false;
    // }
    // };

    Binder.render(binder, 'view');

    // Batcher.batch(ValueBinder);
    // Batcher.batch({ read, write });
}
