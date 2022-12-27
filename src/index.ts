// import Component from './component.ts';
import Schedule from './schedule.ts';
import Context from './context.ts';
import Define from './define.ts';
import Router from './router.ts';
import Render from './render.ts';
// import Patch from './patch.ts';
// import Mount from './mount.ts';

// export { Component };
// export { Component as component };

export { Schedule };
export { Schedule as schedule };

export { Context };
export { Context as context };

export { Define };
export { Define as define };

export { Router };
export { Router as router };

export { Render };
export { Render as render };

// export { Patch };
// export { Patch as patch };

// export { Mount };
// export { Mount as mount };

const Index = {
    // Component,
    Schedule,
    Context,
    Define,
    Router,
    Render,
    // Patch,
    // Mount,
    // component: Component,
    schedule: Schedule,
    context: Context,
    define: Define,
    router: Router,
    render: Render,
    // patch: Patch,
    // mount: Mount,
};

export default Index;
