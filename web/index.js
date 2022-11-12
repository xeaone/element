import { Navigation } from './x-element.js';
// import * as Guide  from './guide.js';
import * as Root  from './root.js';
// import * as All from './all.js';


const main = document.querySelector('main');

navigation.addEventListener('navigate', () => console.log('nav before'));

Navigation('/', main, Root.component, Root.context);
// Navigation('/guide', main, Guide.component, Guide.context);
// Navigation('/*', main, All.component, All.context);

navigation.addEventListener('navigate', () => console.log('nav after'));
