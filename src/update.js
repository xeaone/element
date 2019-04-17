import Batcher from './batcher.js';
import Utility from './utility.js';
import Binder from './binder.js';

export default async function (node, attribute) {

    if (!node) throw new Error('Oxe.update - requires node argument');
    if (!attribute) throw new Error('Oxe.update - requires attribute argument');

    const binder = Binder.get('attribute', node, attribute);

    const read = function () {
        const type = binder.target.type;
        const name = binder.target.nodeName;

        if (name === 'SELECT' || name.indexOf('-SELECT') !== -1) {
            const value = Utility.value(binder.target, binder.container.model);
            binder.data = value;
        } else if (type === 'radio') {
            const query = 'input[type="radio"][o-value="' + binder.value + '"]';
            const nodes = binder.container.querySelectorAll(query);

            for (let i = 0, l = nodes.length; i < l; i++) {
                if (binder.target === nodes[i]) {
                    binder.data = i;
                }

            }

        } else if (type === 'checkbox' || name.indexOf('-CHECKBOX') !== -1) {
            binder.data = binder.target.checked || false;
        } else {
            binder.data = binder.target.value || '';
        }
    };

    Batcher.batch({ read });
}
