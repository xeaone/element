import Component from './component.ts';
import Schedule from './schedule.ts';
import Virtual from './virtual.ts';
import Context from './context.ts';
import Define from './define.ts';
import Router from './router.ts';
import Render from './render.ts';
import Patch from './patch.ts';

export { Component };
export { Component as component };

export { Schedule };
export { Schedule as schedule };

export { Virtual };
export { Virtual as virtual };

export { Context };
export { Context as context };

export { Define };
export { Define as define };

export { Router };
export { Router as router };

export { Render };
export { Render as render };

export { Patch };
export { Patch as patch };

const Index = {
    Component,
    Schedule,
    Virtual,
    Context,
    Define,
    Router,
    Render,
    Patch,
    component: Component,
    schedule: Schedule,
    virtual: Virtual,
    context: Context,
    define: Define,
    router: Router,
    render: Render,
    patch: Patch,
};

export default Index;
