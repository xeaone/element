import { router } from './x-element.js';

import * as guide from './guide.js';
import * as root from './root.js';
import * as all from './all.js';

const main = document.querySelector('main');

// navigation.addEventListener('navigate', () => console.log('nav before'));

router('/', main, root.context, root.component);
router('/guide', main, guide.context, guide.component);
router('/*', main, all.context, all.component);

// navigation.addEventListener('navigate', () => console.log('nav after'));

location.replace(location.href);
