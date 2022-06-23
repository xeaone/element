// import { Binder } from './types.ts';

// import booleans from './boolean.ts';
// import format from './format.ts';

// const standardRender = function (binder: any) {
//     let data = binder.compute();

//     const boolean = booleans.includes(binder.name);

//     binder.node.value = '';

//     if (boolean) {
//         data = data ? true : false;
//         if (data) binder.owner.setAttributeNode(binder.node);
//         else binder.owner.removeAttribute(binder.name);
//     } else {
//         data = format(data);
//         binder.owner[ binder.name ] = data;
//         binder.owner.setAttribute(binder.name, data);
//     }

// };

// const standardreset = function (binder: any) {
//     const boolean = booleans.includes(binder.name);

//     if (boolean) {
//         binder.owner.removeAttribute(binder.name);
//     } else {
//         binder.owner[ binder.name ] = undefined;
//         binder.owner.setAttribute(binder.name, '');
//     }

// };

// export default { render: standardRender, reset: standardreset };

import Binder from './binder.ts';
import booleans from './boolean.ts';
import format from './format.ts';

export default class Standard extends Binder {

    render () {
        const boolean = booleans.includes(this.name);
        const node = this.node as Attr;

        node.value = '';

        if (boolean) {
            const data = this.compute() ? true : false;
            if (data) this.owner.setAttributeNode(node);
            else this.owner.removeAttribute(this.name);
        } else {
            const data = format(this.compute());
            (this.owner as any)[ this.name ] = data;
            this.owner.setAttribute(this.name, data);
        }

    }

    reset () {
        const boolean = booleans.includes(this.name);

        if (boolean) {
            this.owner.removeAttribute(this.name);
        } else {
            (this.owner as any)[ this.name ] = undefined;
            this.owner.setAttribute(this.name, '');
        }

    }

}

