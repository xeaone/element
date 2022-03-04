
const walk = function (parent, method) {
    let child = parent?.firstElementChild;
    while (child) {
        if (!child.attributes?.bind?.value?.includes('each:') && child.firstElementChild) {
            walk(child, method);
        }
        if (child.attributes?.bind) {
            method(child);
        }
        child = child.nextElementSibling;
    }
    return parent;
};

const eachRender = function (binder) {
    const [ items, variable ] = binder.compute();
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
            if (node.nodeType === Node.ELEMENT_NODE) {
                binder.templateLength++;
                binder.templateElement.content.appendChild(node);
            } else {
                binder.node.removeChild(node);
            }
            node = binder.node.firstChild;
        }
    }

    if (binder.currentLength > binder.targetLength) {
        let count;
        while (binder.currentLength > binder.targetLength) {
            count = binder.templateLength;

            while (count--) {
                // binder.node.removeChild(binder.node.lastChild);
                binder.container.remove(binder.node.lastChild);
            }

            binder.currentLength--;
        }
    } else if (binder.currentLength < binder.targetLength) {

        console.time('each: loop');
        while (binder.currentLength < binder.targetLength) {
            // const clone = binder.templateElement.content.cloneNode(true);

            const index = binder.currentLength++;
            // const nodes = clone.querySelectorAll('[bind]');
            // for (const node of nodes) {
            // binder.templateContainer.content.appendChild(walk(binder.templateElement.content.cloneNode(true), function walked (index, node) {

            //    node.x = { alias: {} };

            //     if (binder.rewrites) {
            //         node.x.rewrites = [ ...binder.rewrites, [ variable, `${reference}.${index}` ] ];
            //     } else {
            //         node.x.rewrites = [ [ variable, `${reference}.${index}` ] ];
            //     }

            //     descriptors.$item = descriptors[ variable ] = {
            //         get: function getAlias () { return items[ index ]; },
            //         set: function setAlias (data) { items[ index ] = data; }
            //     };

            //     Object.defineProperties(node.x.alias, descriptors);

            //     binder.container.bind(node);

            let rewrites;
            if (binder.rewrites) {
                rewrites = [ ...binder.rewrites, [ variable, `${reference}.${index}` ] ];
            } else {
                rewrites = [ [ variable, `${reference}.${index}` ] ];
            }

            let descriptors;
            if (binder.descriptors) {
                descriptors = { ...binder.descriptors };
            }

            descriptors.$item = descriptors[ variable ] = {
                get: function getAlias () { return items[ index ]; },
                set: function setAlias (data) { items[ index ] = data; }
            };

            const options = { rewrites, descriptors };

            binder.templateContainer.content.appendChild(binder.container.add(binder.templateElement.content.cloneNode(true), options));
            // }.bind(null, binder.currentLength++)));
            // }

        }
        console.timeEnd('each: loop');

        console.time('each: append');
        binder.node.appendChild(binder.templateContainer.content);
        console.timeEnd('each: append');
    }

};

const eachDerender = function (binder) {
    binder.targetLength = 0;
    binder.currentLength = 0;
    let node;
    while (node = binder.node.lastChild) binder.node.removeChild(node);
};

export default { render: eachRender, derender: eachDerender };
