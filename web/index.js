import { Router } from './x-element.js';

import * as Guide  from './guide.js';
import * as Root  from './root.js';
import * as All from './all.js';

const main = document.querySelector('main');

// navigation.addEventListener('navigate', () => console.log('nav before'));

import { Component } from './x-element.js';
class MyGreeting extends Component {
    static context = () => ({
        greeting: 'Default Greeting',
        greet() { this.greeting = 'Updated Greeting'; }
    });
    static component = (
        { h1, button },
        { greeting, greet }
    ) => [
        h1(greeting),
        button('Greet').onclick(greet)
    ];
}
// MyGreeting.define();

Router('/my-greeting', main, MyGreeting);

Router('/', main, Root.component, Root.context);
Router('/guide', main, Guide.component, Guide.context);
Router('/*', main, All.component, All.context);

// navigation.addEventListener('navigate', () => console.log('nav after'));

location.replace(location.href);
