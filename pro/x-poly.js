
export default async function () {

    if ('shadowRoot' in HTMLTemplateElement.prototype === false) {
        (function attachShadowRoots (root) {
            const templates = root.querySelectorAll('template[shadowroot]');
            for (const template of templates) {
                const mode = (template.getAttribute('shadowroot') || 'closed');
                const shadowRoot = (template.parentNode).attachShadow({ mode });
                shadowRoot.appendChild(template.content);
                template.remove();
                attachShadowRoots(shadowRoot);
            }
        })(document);
    }

    if ('navigation' in window === false) {
        // requires the following import map
        //<script type="importmap">{"imports":{"abort-controller":"https://cdn.skypack.dev/abort-controller","uuid":"https://cdn.skypack.dev/uuid"}}</script>
        window.navigation = new (await import('https://cdn.skypack.dev/@virtualstate/navigation')).Navigation;
    }


    if (!('HTMLDialogElement' in window)) {
        await new Promise((resolve,reject)=>{
            const element = document.createElement('link');
            document.head.insertAdjacentElement('afterbegin', element);
            element.onerror = reject;
            element.onload = resolve;
            element.rel = 'stylesheet';
            element.href = 'https://esm.sh/dialog-polyfill@0.5.6/dist/dialog-polyfill.css';
        });
        const dialogPolyfill = (await import('https://esm.sh/dialog-polyfill@0.5.6/dist/dialog-polyfill.esm.js')).default;
        const observer = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                for (const node of mutation.addedNodes) {
                    if (node.nodeName === 'DIALOG') {
                        node.classList.add('fixed');
                        dialogPolyfill.registerDialog(node);
                    }
                }
            }
        });
        observer.observe(document.body, {
            childList: true,
            subtree: true,
        });
    }

}