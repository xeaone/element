
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
    window.navigation = new (await import("https://cdn.skypack.dev/@virtualstate/navigation")).default;
}