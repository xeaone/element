import Component from './component.ts';
import Schedule from './schedule.ts';
import Virtual from './virtual.ts';
import Context from './context.ts';
import Router from './router.ts';
import Render from './render.ts';
import Patch from './patch.ts';

export { Virtual };
export { Virtual as virtual };
// export { Virtual as xvirtual };
// export { Virtual as XVirtual };

export { Context };
export { Context as context };
// export { Context as xcontext };
// export { Context as XContext };


export { Router };
export { Router as router };
// export { Router as xrouter };
// export { Router as XRouter };

export { Render };
export { Render as render };
// export { Render as xrender };
// export { Render as XRender };

export { Schedule };
export { Schedule as schedule };
// export { Schedule as xschedule };
// export { Schedule as XSchedule };

export { Patch };
export { Patch as patch };
// export { Patch as xpatch };
// export { Patch as XPatch };

export { Component };
export { Component as component };
// export { Component as xcomponent };
// export { Component as XComponent };

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
