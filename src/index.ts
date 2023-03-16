import Component from './component';
import Upgrade from './upgrade';
import Router from './router';
// import Render from './render';
import Mount from './mount';
import html from './html';

export { Component };
export { Upgrade };
export { Router };
// export { Render };
export { Mount };
export { html };

export { Component as component };
export { Upgrade as upgrade };
export { Router as router };
// export { Render as render };
export { Mount as mount };

export default {
    Component,
    Upgrade,
    Router,
    // Render,
    Mount,

    component: Component,
    upgrade: Upgrade,
    router: Router,
    // render: Render,
    mount: Mount,

    html,
};
