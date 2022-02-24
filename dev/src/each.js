
const eachRender = async function (binder) {
    const [ items, variable ] = await binder.compute();
    const reference = items.x.reference;

    binder.targetLength = items?.length ?? 0;

    if (!binder.setup) {
        binder.setup = true;
        binder.currentLength = 0;
        binder.templateLength = 0;
        binder.templateElement = document.createElement('template');
        binder.templateContainer = document.createElement('template');

        let node = binder.node.firstChild;
        while (node) {
            binder.templateLength++;
            binder.templateElement.content.appendChild(node);
            node = binder.node.firstChild;
        }
    }

    if (binder.currentLength > binder.targetLength) {
        let count;
        while (binder.currentLength > binder.targetLength) {
            count = binder.templateLength;

            while (count--) {
                binder.node.removeChild(binder.node.lastChild);
            }

            binder.currentLength--;
        }
    } else if (binder.currentLength < binder.targetLength) {
        const descriptors = binder.alias ? Object.getOwnPropertyDescriptors(binder.alias) : {};

        while (binder.currentLength < binder.targetLength) {
            const clone = binder.templateElement.content.cloneNode(true);
            const nodes = clone.querySelectorAll('[bind]');

            for (const node of nodes) {
                node.x = { alias: {} };

                if (binder.rewrites) {
                    node.x.rewrites = [ ...binder.rewrites, [ variable, `${reference}.${binder.currentLength}` ] ];
                } else {
                    node.x.rewrites = [ [ variable, `${reference}.${binder.currentLength}` ] ];
                }

                descriptors[ '$items' ] = descriptors[ variable ] = {
                    get: function (array, index) { return array[ index ]; }.bind(null, items, binder.currentLength),
                    set: function (array, index, data) { array[ index ] = data; }.bind(null, items, binder.currentLength)
                };

                Object.defineProperties(node.x.alias, descriptors);
            }

            binder.currentLength++;
            binder.templateContainer.content.appendChild(clone);
        }

        binder.node.appendChild(binder.templateContainer.content);
    }

};

const eachDerender = function (binder) {
    binder.targetLength = 0;
    binder.currentLength = 0;
    let node;
    while (node = binder.node.lastChild) binder.node.removeChild(node);
};

export default { render: eachRender, derender: eachDerender };