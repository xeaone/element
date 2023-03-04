import { router } from './x-element.js';

import * as security from './security.js';
import * as guide from './guide.js';
import * as root from './root.js';
import * as all from './all.js';

const main = document.querySelector('main');

// navigation.addEventListener('navigate', () => console.log('nav before'));

router('/', main, root.context, root.content);

router('/guide', main, guide.context, guide.content);
router('/guide/', main, guide.context, guide.content);

router('/security', main, security.context, security.content);
router('/security/', main, security.context, security.content);

router('/*', main, all.context, all.content);

// navigation.addEventListener('navigate', () => console.log('nav after'));

location.replace(location.href);
