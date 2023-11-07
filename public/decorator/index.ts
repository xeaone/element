import { define, html, Prototype } from '../../source/index';

@define()
class XTest extends HTMLElement implements Prototype {

    static $tag = 'x-test';
    static $mount = 'body';

   $state = s => {
        s.count = 0;
        setInterval(() => s.count++, 1000);
    }

    $render = s => html`
        ${s.count}
    `

}