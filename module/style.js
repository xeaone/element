/**
* @version 10.0.0
*
* @license
* Copyright (C) Alexander Elias
* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/.
*
* @module
*/
const Sheets = new WeakMap();
export const style = function (instance) {
    if (instance.shadowRoot) {
        const root = document.getRootNode();
        instance.shadowRoot.adoptedStyleSheets.push(...root.adoptedStyleSheets);
        for (const rootSheet of root.styleSheets) {
            let cacheSheet = Sheets.get(rootSheet);
            if (!cacheSheet) {
                cacheSheet = new CSSStyleSheet();
                const { cssRules } = rootSheet;
                for (const { cssText } of cssRules) {
                    cacheSheet.insertRule(cssText);
                }
                Sheets.set(rootSheet, cacheSheet);
            }
            instance.shadowRoot.adoptedStyleSheets.push(cacheSheet);
        }
    }
};
// export const style = function () {
//     return function (construct: CustomElementConstructor): typeof construct {
//         return class extends construct {
//             constructor(...args: any[]) {
//                 super(...args);
//                 if (this.shadowRoot) {
//                     const root = document.getRootNode() as Document;
//                     this.shadowRoot.adoptedStyleSheets = [...root.styleSheets];
//                 }
//             }
//         };
//     };
// };
