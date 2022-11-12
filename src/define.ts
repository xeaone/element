import Component from './component.ts';
import Dash from './dash.ts';

export default function (name?: string, constructor?: typeof Component) {
    // name = name ?? Dash(constructor?.prototype.name);
    // customElements.define(name, constructor);
}
