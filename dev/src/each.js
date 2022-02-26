
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
                binder.node.removeChild(binder.node.lastChild);
            }

            binder.currentLength--;
        }
    } else if (binder.currentLength < binder.targetLength) {
        const descriptors = binder.alias ? Object.getOwnPropertyDescriptors(binder.alias) : {};
        const tasks = [];

        console.time('each');

        while (binder.currentLength < binder.targetLength) {
            const clone = binder.templateElement.content.cloneNode(true);
            const index = binder.currentLength;

            for (const node of clone.children) {
                node.x = { alias: {} };

                if (binder.rewrites) {
                    node.x.rewrites = [ ...binder.rewrites, [ variable, `${reference}.${binder.currentLength}` ] ];
                } else {
                    node.x.rewrites = [ [ variable, `${reference}.${binder.currentLength}` ] ];
                }

                descriptors[ '$items' ] = descriptors[ variable ] = {
                    get: function () { return items[ index ]; },
                    set: function (data) { items[ index ] = data; }
                };

                Object.defineProperties(node.x.alias, descriptors);
                // binder.templateContainer.content.insertBefore(node, binder.templateContainer.content.children[ (index - 1) + binder.templateLength ]);
                // binder.container.bind(node);
                // tasks.push(tick(() => binder.container.bind(node)));//5778
                // tasks.push(binder.container.bind(node));//3202
                tasks.push(binder.container.bind(node, true));//878
                //600
                binder.templateContainer.content.appendChild(node);
            }



            binder.currentLength++;
        }

        await Promise.all(tasks);
        console.timeEnd('each');
        binder.node.appendChild(binder.templateContainer.content);
    }

};

const eachDerender = async function (binder) {
    binder.targetLength = 0;
    binder.currentLength = 0;
    let node;
    while (node = binder.node.lastChild) binder.node.removeChild(node);
};

export default { render: eachRender, derender: eachDerender };

// const tick = Promise.resolve();

// const tick = function (method) {
//     return new Promise(function tickPromise (resolve, reject) {
//         setTimeout(function tickTimer () {
//             Promise.resolve().then(method).then(resolve).catch(reject);
//         });
//     });
// };

// const indexEach = async function (start, end, method) {
//     const tasks = [];
//     while (start < end) {
//         tasks.push(Promise.resolve().then(function indexMethod (index) {
//             return method(index);
//         }.bind(null, start++)));

//         // tasks.push(new Promise(function forEachPromise (index, resolve, reject) {
//         //     // setTimeout(function forEachTimer () {
//         //     Promise.resolve().then(function forEachMethod () {
//         //         return method(index);
//         //     }).then(resolve).catch(reject);
//         //     // }, 0);
//         // }.bind(null, start++)));
//     }
//     return Promise.all(tasks);
// };

// const forEach = async function (array, method) {
//     const tasks = [];
//     for (let index = 0; index < array.length; index++) {
//         tasks.push(Promise.resolve().then(function forEachMethod () {
//             return method(array[ index ]);
//         }.bind(null, index)));

//         // tasks.push(new Promise(function forEachPromise (index, resolve, reject) {
//         //     // setTimeout(function forEachTimer () {
//         //     Promise.resolve().then(function forEachMethod () {
//         //         return method(array[ index ]);
//         //     }).then(resolve).catch(reject);
//         //     // }, 0);
//         // }.bind(null, index)));
//     }
//     return Promise.all(tasks);
// };

// const node = function (name, attributes) {
//     const element = document.createElement(name);
//     for (const [ name, value ] of attributes) {
//         element.setAttribute(name, value);
//     }
//     return node;
// };