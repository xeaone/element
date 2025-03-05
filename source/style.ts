const Sheets: WeakMap<CSSStyleSheet, CSSStyleSheet> = new WeakMap();

export const style = function (instance: HTMLElement) {
    if (instance.shadowRoot) {
        const root = document.getRootNode() as Document;

        instance.shadowRoot.adoptedStyleSheets.push(...root.adoptedStyleSheets);

        for (const rootSheet of root.styleSheets) {
            let cacheSheet: CSSStyleSheet | undefined = Sheets.get(rootSheet);

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
