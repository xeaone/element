
const tick = Promise.resolve();
const prepare = /{{\s*(.*?)\s+(of|in)\s+(.*?)\s*}}/;

// const has = () => true;
// const get = (target, key) => typeof key === 'string' ? new Proxy({}, { has, get }) : undefined;

const each = async function (binder) {

    if (binder.meta.busy) return;
    else binder.meta.busy = true;

    if (!binder.meta.setup) {
        let [ path, variable, index, key ] = binder.value.replace(prepare, '$1,$3').split(/\s*,\s*/).reverse();

        if (binder.rewrites) {
            for (const [ name, value ] of binder.rewrites) {
                path = path.replace(new RegExp(`^(${name})\\b`), value);
            }
        }

        binder.meta.path = path;
        binder.meta.keyName = key;
        binder.meta.indexName = index;
        binder.meta.variableName = variable;
        binder.meta.parts = path.split('.');

        binder.meta.keys = [];
        binder.meta.count = 0;
        binder.meta.setup = true;
        binder.meta.targetLength = 0;
        binder.meta.currentLength = 0;
        binder.meta.descriptors = binder.dynamics ? Object.getOwnPropertyDescriptors(binder.dynamics) : null;

        binder.meta.clone = document.createElement('template');
        binder.meta.templateElement = document.createElement('template');

        if (binder.owner.nodeName === 'SELECT') {
            binder.owner.$optionsReady = null;
            binder.owner.$optionsLength = 0;
        }

        let node = binder.owner.firstChild;
        while (node) {
            binder.meta.count++;
            binder.meta.clone.content.appendChild(node);
            node = binder.owner.firstChild;
        }
    }

    // const time = `each ${binder.meta.targetLength}`;
    // console.time(time);

    const data = await binder.compute();

    if (data?.constructor === Array) {
        binder.meta.targetLength = data.length;
    } else {
        binder.meta.keys = Object.keys(data || {});
        binder.meta.targetLength = binder.meta.keys.length;
    }

    if (binder.meta.currentLength > binder.meta.targetLength) {
        while (binder.meta.currentLength > binder.meta.targetLength) {
            let count = binder.meta.count;

            while (count--) {
                const node = binder.owner.lastChild;
                binder.owner.removeChild(node);
                tick.then(binder.binder.remove.bind(binder.binder, node));
            }

            binder.meta.currentLength--;
        }
    } else if (binder.meta.currentLength < binder.meta.targetLength) {
        while (binder.meta.currentLength < binder.meta.targetLength) {

            const indexValue = binder.meta.currentLength;
            const keyValue = binder.meta.keys[ indexValue ] ?? indexValue;
            const variableValue = `${binder.meta.path}.${keyValue}`;

            const dynamics = {};
            if (binder.meta.descriptors) Object.defineProperties(dynamics, binder.meta.descriptors);
            if (binder.meta.keyName) Object.defineProperty(dynamics, binder.meta.keyName, { value: keyValue, writable: false });
            if (binder.meta.indexName) Object.defineProperty(dynamics, binder.meta.indexName, { value: indexValue, writable: false });
            Object.defineProperty(dynamics, binder.meta.variableName, {
                get () {
                    let result = binder.container.data;
                    for (const key of binder.meta.parts) {
                        result = result[ key ];
                        if (!result) return;
                    }
                    return typeof result === 'object' ? result[ keyValue ] : undefined;
                },
                set (value) {
                    let result = binder.container.data;
                    for (const key of binder.meta.parts) {
                        result = result[ key ];
                        if (!result) return;
                    }
                    typeof result === 'object' ? result[ keyValue ] = value : undefined;
                }
            });

            const rewrites = [];
            if (binder.meta.indexName) rewrites.push([ binder.meta.indexName, indexValue ]);
            if (binder.meta.keyName) rewrites.push([ binder.meta.keyName, keyValue ]);
            if (binder.meta.variableName) rewrites.push([ binder.meta.variableName, variableValue ]);
            if (binder.rewrites) rewrites.push(...binder.rewrites);

            // const d = document.createElement('div');
            // d.className = 'box';
            // const t = document.createTextNode('{{item.number}}');
            // tick.then(binder.binder.add.bind(binder.binder, t, binder.container, dynamics));
            // d.appendChild(t);
            // binder.meta.templateElement.content.appendChild(d)

            const clone = binder.meta.clone.content.cloneNode(true);
            let node = clone.firstChild;
            while (node) {
                // binder.binder.add(node, binder.container, dynamics, rewrites);
                tick.then(binder.binder.add.bind(binder.binder, node, binder.container, dynamics, rewrites));
                node = node.nextSibling;
            }

            binder.meta.templateElement.content.appendChild(clone);
            binder.meta.currentLength++;
        }
    };

    if (binder.meta.currentLength === binder.meta.targetLength) {
        binder.owner.appendChild(binder.meta.templateElement.content);
        binder.meta.busy = false;
        if (binder.owner.nodeName === 'SELECT') {
            binder.owner.$optionsReady = binder.owner.$optionsLength;
            binder.owner.$optionsLength = binder.owner.options.length;
            binder.owner.dispatchEvent(new Event('$renderSelect'));
        }
    }

};

export default each;