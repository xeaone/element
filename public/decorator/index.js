import { define, html } from '../x-element.js';

// class XTest extends HTMLParagraphElement {
//     static $extend = 'p';

class XTest extends HTMLElement {

    static $tag = 'x-test';
    static $mount = 'body';

    $state = (s) => {
        s.count = 0;
        setInterval(() => s.count++, 1000);
    }

    $render = (s) => html`
        ${s.count}
    `

}

define()(XTest);