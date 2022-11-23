import Component from './component.ts';
import Schedule from './schedule.ts';
import Virtual from './virtual.ts';
import Context from './context.ts';
import Router from './router.ts';
import Render from './render.ts';
import Patch from './patch.ts';

export { Virtual };
export { Virtual as virtual };

export { Context };
export { Context as context };

export { Router };
export { Router as router };

export { Render };
export { Render as render };

export { Schedule };
export { Schedule as schedule };

export { Patch };
export { Patch as patch };

export { Component };
export { Component as component };

export default {
    Component,
    Schedule,
    Virtual,
    Context,
    Router,
    Render,
    Patch,
    component: Component,
    schedule: Schedule,
    virtual: Virtual,
    context: Context,
    router: Router,
    render: Render,
    patch: Patch,
};
