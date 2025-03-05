/**
* @version 10.0.1
*
* @license
* Copyright (C) Alexander Elias
* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/.
*
* @module
*/
import { dash } from './dash';
// export const define = function (tag: string, extend?: string) {
//     return (constructor: CustomElementConstructor, context: ClassDecoratorContext) => {
//         context.addInitializer(function () {
//             const $tag = dash(tag);
//             const $extend = extend;
//             customElements.define($tag, constructor, { extends: $extend });
//         });
//     };
// };
export const define = function (tag, extend) {
    return function (constructor) {
        const $tag = dash(tag);
        const $extend = extend;
        customElements.define($tag, constructor, { extends: $extend });
    };
};
