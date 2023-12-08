import { define, text, mount, html, Component } from '../../source/index';

interface S {
    count:number,
}

const imp = /*html*/`
    <strong id="count"></strong>

    <div id="items">
        <span class="item"></span>
    </div>

`
const t = text;
const x = text;

@mount('body')
@define('x-test')
class XTest extends HTMLElement {
// class XTest extends Component {
    // class XTest extends HTMLElement implements Component {

    @x('#count')
    count = 0;


    // @bind('item', 'hidden', item => item.hidden)
    // @bind('item', 'text', item => item.value)
    // @e('#items')

    @x('#items')
    @x('#items.item', 'text', ({value}) => value)
    @x('#items.item', 'hidden', ({hidden}) => hidden)
    items = [ { value: 'foo', hidden: false} ]


    // $state = (s:S) => {
    //     s.count = 0;
    //     setInterval(() => s.count++, 1000);
    // }

    // $render = (s:S) => html`
    //     <strong>${s.count}</strong>
    //     <strong id="count"></strong>

    //     <div id="items">
    //         <div id="item"></div>
    //     </div>
    // `

}