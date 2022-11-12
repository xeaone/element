import Navigation from './navigation.ts';
import Component from './component.ts';
import Schedule from './schedule.ts';
import Virtual from './virtual.ts';
import Context from './context.ts';
import Render from './render.ts';
import Patch from './patch.ts';

export { Navigation };
export { Navigation as navigation };
export { Navigation as xnavigation };
export { Navigation as XNavigation };

export { Virtual };
export { Virtual as virtual };
export { Virtual as xvirtual };
export { Virtual as XVirtual };

export { Context };
export { Context as context };
export { Context as xcontext };
export { Context as XContext };

export { Render };
export { Render as render };
export { Render as xrender };
export { Render as XRender };

export { Schedule };
export { Schedule as schedule };
export { Schedule as xschedule };
export { Schedule as XSchedule };

export { Patch };
export { Patch as patch };
export { Patch as xpatch };
export { Patch as XPatch };

export { Component };
export { Component as component };
export { Component as xcomponent };
export { Component as XComponent };

export default {
    Navigation,
    Component,
    Schedule,
    Virtual,
    Context,
    Render,
    Patch,

    navigation: Navigation,
    component: Component,
    schedule: Schedule,
    virtual: Virtual,
    context: Context,
    render: Render,
    patch: Patch,
};
