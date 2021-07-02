import traverse from '../traverse';

const empty = /\s+|(\\t)+|(\\r)+|(\\n)+|^$/;

const emptyAttribute = /\s*{{\s*}}\s*/;
const emptyText = /\s+|(\\t)+|(\\r)+|(\\n)+|\s*{{\s*}}\s*|^$/;

const TN = Node.TEXT_NODE;
const EN = Node.ELEMENT_NODE;
const AN = Node.ATTRIBUTE_NODE;
const CN = Node.COMMENT_NODE;

const prefix = 'o-';
const syntaxEnd = '}}';
const syntaxStart = '{{';
const syntaxMatch = new RegExp('{{.*?}}');
const prefixReplace = new RegExp('^o-');
const syntaxReplace = new RegExp('{{|}}', 'g');

const walk = async function (node: Node, paths: any[][], path: any[]) {
    const type = node.nodeType;
    const tasks = [];

    // if (type === CN) {
    //     node.parentNode.removeChild(node);
    // } else
    if (type === TN) {
        // if (emptyText.test(node.textContent)) node.parentNode.removeChild(node);
        if (emptyText.test(node.textContent)) return;

        const start = node.textContent.indexOf(syntaxStart);
        if (start === -1) return;

        if (start !== 0) node = (node as Text).splitText(start);

        const end = node.textContent.indexOf(syntaxEnd);
        if (end === -1) return;

        if (end + syntaxStart.length !== node.textContent.length) {
            const split = (node as Text).splitText(end + syntaxEnd.length);
            // const value = node.textContent;
            // node.textContent = '';
            paths.push(path);
            tasks.push(walk(split, paths, [ ...path.slice(0, -1), path[ path.length - 1 ]++ ]));
        } else {
            // const value = node.textContent;
            // node.textContent = '';
            paths.push(path);
        }

    } else if (type === EN) {
        const attributes = (node as Element).attributes;

        let each;
        for (let i = 0; i < attributes.length; i++) {
            const attribute = attributes[ i ];
            const { name, value } = attribute;
            if (name === 'each' || name === `${prefix}each`) each = true;
            if (syntaxMatch.test(value)) {
                // attribute.value = '';
                if (!emptyAttribute.test(value)) {
                    paths.push([ ...path, 'attributes', i ]);
                }
            }
        }

        if (!each) {
            node = node.firstChild;
            if (!node) return;

            let index = 0;
            tasks.push(walk(node, paths, [ ...path, 'childNodes', index ]));
            while (node = node.nextSibling) {
                index++;
                tasks.push(walk(node, paths, [ ...path, 'childNodes', index ]));
            }
        }

    }

    return Promise.all(tasks);
};


const traverse = function (data: any, parts?: any[]) {
    if (!parts.length) {
        return data;
    } else {
        const part = parts.shift();
        return traverse(data[ part ], parts);
    }
};


// const clean = function (node) {

//     for (const child of node.childNodes) {
//         clean(child);
//     }

//     if (node.nodeType === 8 || node.nodeType === 3 && empty.test(node.nodeValue)) {
//         node.parentNode.removeChild(node);
//         return false;
//     } else {
//         return true;
//     }

// };

const setup = function (binder) {
    const { meta, owner } = binder;

    const [ variable, index, key ] = binder.value.slice(2, -2).replace(/\s+(of|in)\s+.*/, '').split(/\s*,\s*/).reverse();

    meta.keyName = key ? new RegExp(`({{.*?\\b)(${key})(\\b.*?}})`, 'g') : null;
    meta.indexName = index ? new RegExp(`({{.*?\\b)(${index})(\\b.*?}})`, 'g') : null;
    meta.variableName = variable ? new RegExp(`({{.*?\\b)(${variable})(\\b.*?}})`, 'g') : null;

    meta.keys = [];
    meta.setup = true;
    meta.targetLength = 0;
    meta.currentLength = 0;
    meta.templateLength = 0;

    meta.clone = document.createElement('template');
    meta.templateElement = document.createElement('template');

    let node;
    meta.paths = [];
    while (node = owner.firstChild) {
        // if (clean(node)) {
        meta.clone.content.appendChild(node);
        walk(node, meta.paths, [ 'childNodes', meta.templateLength ]);
        meta.templateLength++;
        // }
    }
    console.log(meta.paths);

};

const each = async function each (binder) {
    const { meta, owner } = binder;

    if (!meta.setup) await setup(binder);

    let data = await binder.compute();
    // console.log('each', data.length, meta.targetLength);
    if (data instanceof Array) {
        meta.targetLength = data.length;
    } else {
        meta.keys = Object.keys(data || {});
        meta.targetLength = meta.keys.length;
    }

    if (meta.currentLength > meta.targetLength) {
        const tasks = [];
        while (meta.currentLength > meta.targetLength) {
            let count = meta.templateLength;

            while (count--) {
                const node = owner.lastChild;
                owner.removeChild(node);
                tasks.push(binder.remove(node));
            }

            meta.currentLength--;
        }

        if (meta.currentLength === meta.targetLength) {
            Promise.all(tasks).then(function eachFinish () {
                owner.appendChild(meta.templateElement.content);
                if (owner.nodeName === 'SELECT') owner.dispatchEvent(new Event('$render'));
            });
        }

    } else if (meta.currentLength < meta.targetLength) {
        const tasks = [];
        while (meta.currentLength < meta.targetLength) {
            const indexValue = meta.currentLength;
            const keyValue = meta.keys[ indexValue ] ?? indexValue;
            const variableValue = `${binder.path}[${keyValue}]`;
            const keyName = meta.keyName;
            const indexName = meta.indexName;
            const variableName = meta.variableName;

            meta.currentLength++;
            const extra = { keyName, indexName, variableName, indexValue, keyValue, variableValue };

            const clone = meta.clone.content.cloneNode(true);
            // binder.adds(clone.childNodes, binder.container, extra);
            // tasks.push(binder.adds(clone.childNodes, binder.container, extra));

            for (const path of meta.paths) {
                tasks.push(binder.add(traverse(clone, [ ...path ]), binder.container, extra));
            }

            meta.templateElement.content.appendChild(clone);
        }

        if (meta.currentLength === meta.targetLength) {
            Promise.all(tasks).then(function eachFinish () {
                owner.appendChild(meta.templateElement.content);
                if (owner.nodeName === 'SELECT') owner.dispatchEvent(new Event('$render'));
            });
        }


    }

};

export default each;

// export default { setup, write };