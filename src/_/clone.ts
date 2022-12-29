/** */

export default function clone(source: any, values: any) {
    const target: any = { type: source.type };

    if (source.name) {
        if (source.name.startsWith('{{') && source.name.endsWith('}}')) {
            target.name = values[source.name.slice(2, -2)];
        } else {
            target.name = source.name;
        }
    }

    if (source.value) {
        if (source.value.startsWith('{{') && source.value.endsWith('}}')) {
            const value = values[source.value.slice(2, -2)];
            if (value?.constructor === Array || value?.constructor === Object) {
                return value;
            } else {
                target.value = value;
            }
        } else {
            target.value = source.value;
        }
    }

    if (source.attributes) {
        target.attributes = source.attributes.map((a: any) => clone(a, values));
    }

    if (source.children) {
        target.children = target.children ?? [];
        for (const child of source.children) {
            const childClone = clone(child, values);
            if (childClone.constructor === Object && childClone.name === 'fragment') {
                target.children.push(...childClone.children);
            } else if (childClone.constructor === Array) {
                for (const cc of childClone) {
                    if (cc.children) {
                        target.children.push(...cc.children);
                    } else {
                        // console.log(cc);
                    }
                }
            } else {
                target.children.push(childClone);
            }
        }
    }

    return target;
}
