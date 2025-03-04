### 10.0.0
- a complete rewrite

### 7.0.0
- major changes basically a complete rewrite

### 6.0.0
- major changes api docs needs updates

### 5.0.0
- removed Oxe.router.trailing option
- removed Oxe.body, Oxe.head, Oxe.window, Oxe.head, Oxe.document, Oxe.currentScript, Oxe.ownerDocument, Oxe.location

### 4.2.0
- bug fixed import and path

### 4.1.0
- changed route parameters symbols to () from {}

### 4.0.0
- polyfill script added to dst
- no longer automatically includes polyfills
- changed internal api from document.registerElement to customElements.define

### 3.19.0
- event listeners are added only after Oxe.setup is invoked

### 3.16.0
- fixed slot scope issues

### 3.14.1
- fixed default select item for the o-each
- input, select, options, check radio dont allow | pipe modification

### 3.13.0
- removed Oxe.Keeper
- major Oxe.fetcher changes
- made Oxe.fetcher promised

### 3.6.0
- Separated CLI into ox-cli.
- Router hash mode is removed.
- Router trailing option removed.
- Router.route.path is more strict and accepts relative paths.
