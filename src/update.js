// import Batcher from './batcher.js';
// import Utility from './utility.js';
import Binder from './binder.js';
// import Select from './select.js';

export default async function (node, attribute) {

    if (!node) throw new Error('Oxe.update - requires node argument');
    if (!attribute) throw new Error('Oxe.update - requires attribute argument');

    const binder = Binder.get('attribute', node, attribute);
    const type = binder.target.type;
    const name = binder.target.nodeName;

    if (name === 'SELECT' || name.indexOf('-SELECT') !== -1) {
        Binder.render(binder, 'view');
    } else if (type === 'checkbox' || name.indexOf('-CHECKBOX') !== -1) {
        binder.data = binder.target.checked || false;
    } else {
        binder.data = node.value;
    }

}
