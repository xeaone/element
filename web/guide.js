import XElement from './x-element.js';
import Highlight from './highlight.js';
// import Code from './modules/code.js';
import Color from './modules/color.js';

export default class XGuide extends XElement {

    static observedProperties = [
        'title', 'text', 'checked',
        'r1', 'r2', 'color', 'colorChange',
        'active', 'lightblue', 'classToggle', 'value',
        'fruits', 'log', 'selectedPlant', 'selectEachResult',
        'multipleSelectResult', 'radio', 'agree', 'lastName',
        'firstName', 'favoriteNumber', 'form', 'submit'
    ];

    title = 'Guide';
    text = 'Hello World';

    checked = true;

    r1 = undefined;
    r2 = undefined;

    color = Color();
    colorChange () { this.color = Color(); }

    active = true;
    lightblue = active => active ? 'lightblue' : '';
    classToggle () { this.active = !this.active; }

    value = {
        text: 'hello world',
        upper: text => text?.toUpperCase(),
    };

    fruits = [ 'apple', 'orange', 'tomato' ];
    log () { console.log(arguments); }

    selectedPlant = undefined;
    selectEachResult = 'orange';
    multipleSelectResult = [];

    form = '';
    radio = false;
    agree = true;
    lastName = 'bond';
    firstName = 'james';
    favoriteNumber = undefined;

    submit (form) {
        console.log(form);
        this.form = JSON.stringify(form);
        console.log(this);
    }

    constructor () {
        super();

        // const escapeFull = this.querySelectorAll('.escape-full');
        // escapeFull.forEach(code=> code.innerHTML = Code(code.innerHTML, true));

        // const escapePart = this.querySelectorAll('.escape-part');
        // escapePart.forEach(code=> code.innerHTML = Code(code.innerHTML));

        Highlight();
        this.shadowRoot.innerHTML = '<slot></slot>';
        document.body.style.opacity = 1;
    }

    connectedCallback () {
        if (!this.innerHTML) this.innerHTML = this.#html;
    }

    #html = /*html*/`
    <a href="/">root</a>

    <style>
        .default {
            border: solid 5px transparent;
        }
        .class-color {
            border-color: var(--accent);
        }
    </style>

    <section id="text">
        <h3>Text Binder</h3>
        <pre><code class="language-html">
            &lt;span&gt;{&zwnj;{text}&zwnj;}&lt;/span&gt;
        </code></pre>
        <pre><code class="language-html">
            &lt;span&gt;{{text}}&lt;/span&gt;
        </code></pre>
    </section>

    <section id="checked">
        <h3>Checked Binder</h3>

        <br>

        <pre><code class="language-html">
            &lt;input type="checkbox" value="{&zwnj;{checked}&zwnj;}" checked="{&zwnj;{checked = $checked}&zwnj;}"&gt;
        </code></pre>

        <pre><code class="language-html">
            &lt;input type="checkbox" value="{{checked}}" {{checked ? 'checked' : ''}}&gt;
        </code></pre>

        <br>

        <label>
            <input value="{{checked}}" checked="{{checked = $checked}}" type="checkbox"> Checkbox
        </label>

        <br>

        <pre><code class="language-html">
            &lt;input type="radio" name="radio" value="one" checked="{&zwnj;{r1 = $checked}&zwnj;}"&gt;
            &lt;input type="radio" name="radio" value="two" checked="{&zwnj;{r2 = $checked}&zwnj;}"&gt;
        </code></pre>

        <pre><code class="language-html">
            &lt;input type="radio" name="radio" value="one" {{r1 ? 'checked' : ''}}&gt;
            &lt;input type="radio" name="radio" value="two" {{r2 ? 'checked' : ''}}&gt;
        </code></pre>

        <br>

        <label>
            <input type="radio" name="radio" value="one" checked="{{r1=$checked}}"> Radio One
        </label>

        <label>
            <input type="radio" name="radio" value="two" checked="{{r2=$checked}}"> Radio Two
        </label>
    </section>

    <section id="style">
        <h3>Style Binder</h3>
        <br>
        <pre><code class="language-html">
            &lt;div style="color: {&zwnj;{color}&zwnj;}">Look at my style&lt;/div&gt;
        </code></pre>
        <pre><code class="language-html">
            &lt;div style="color: {{color}}">Look at my style&lt;/div&gt;
        </code></pre>
        <br>
        <div style="color: {{color}}">Look at my style</div>
        <br>
        <button onclick="{{colorChange()}}">Change Color</button>
    </section>

    <section id="class">
        <h3>Class Binder</h3>
        <br>
        <pre><code class="language-html">
            &lt;div class="default {&zwnj;{active ? 'class-color' : ''}&zwnj;}"&gt;Look at my class&lt;/div&gt;
        </code></pre>
        <pre><code class="language-html">
            &lt;div class="default {{active ? 'class-color' : ''}}"&gt;Look at my class&lt;/div&gt;
        </code></pre>
        <br>
        <div class="default {{active ? 'class-color' : ''}}">Look at my class</div>
        <br>
        <button onclick="{{classToggle()}}">Toggle Active</button>
    </section>

    <section id="value">
        <h3>Value Binder</h3>
        <br>
        <pre><code class="language-html">
            &lt;div&gt;{&zwnj;{value.text}&zwnj;}&lt;/div&gt;
            &lt;input value="{&zwnj;{value.text = $value.toUpperCase()}&zwnj;}"&gt;
            &lt;input value="{&zwnj;{(value.text = $value).toLowerCase()}&zwnj;}"&gt;
        </code></pre>
        <br>
        <div>{{value.text}}</div>
        <br>
        <input value="{{value.text = $value.toUpperCase() }}">
        <input value="{{(value.text = $value).toLowerCase()}}">
    </section>

    <section id="each">
        <h3>Each Binder</h3>
        <br>
        <pre><code class="language-html">
            &lt;div each="{&zwnj;{[ fruits, 'fruit', 'key', 'index' ]}&zwnj;}"&gt;
                &lt;div id="{&zwnj;{fruit.name}&zwnj;}"&gt;
                    &lt;strong&gt;Key: &lt;/strong&gt;{&zwnj;{key}&zwnj;},
                    &lt;strong&gt;Index: &lt;/strong&gt;{&zwnj;{index}&zwnj;},
                    &lt;strong&gt;Value: &lt;/strong&gt;{&zwnj;{fruit}&zwnj;}
                &lt;/div&gt;
            &lt;/div&gt;
         </code></pre>
        <br>
        <div each="{{[ fruits, 'fruit', 'key', 'index' ]}}">
            <div id="{{fruit}}">
                <strong>Key: </strong>{{key}},
                <strong>Index: </strong>{{index}},
                <strong>Value: </strong>{{fruit}}
            </div>
        </div>
    </section>

    <section id="select">
        <h3>Select Binder</h3>
        <br>

        <pre><code class="language-html">
            &lt;div&gt;{&zwnj;{selectPlant}&zwnj;}&lt;/div&gt;
            &lt;select value="{&zwnj;{selectedPlant = $value}&zwnj;}"&gt;
                &lt;option value="tree"&gt;Tree&lt;/option&gt;
                &lt;option value="cactus"&gt;Cactus&lt;/option&gt;
            &lt;/select&gt;
        </code></pre>

        <br>
        <div>{{selectedPlant}}</div>
        <select value="{{selectedPlant = $value}}">
            <option value="tree">Tree</option>
            <option value="cactus">Cactus</option>
        </select>

        <br>

        <pre><code class="language-html">
            &lt;div&gt;{&zwnj;{selectEachResult}&zwnj;}&lt;/div&gt;
            &lt;select value="{&zwnj;{selectEachResult = $value}&zwnj;}" each="{&zwnj;{[fruits, 'fruit']}&zwnj;}"&gt;
                &lt;option value="{&zwnj;{fruit}&zwnj;}"&gt;{&zwnj;{fruit}&zwnj;}&lt;/option&gt;
            &lt;/select&gt;
        </code></pre>

        <br>

        <div>{{selectEachResult}}</div>
        <select value="{{selectEachResult = $value}}" each="{{[fruits, 'fruit']}}">
            <option value="{{fruit}}">{{fruit}}</option>
        </select>

        <br>

        <pre><code class="language-html">
            &lt;div&gt;{&zwnj;{multipleSelectResult}&zwnj;}&lt;/div&gt;
            &lt;select value="{&zwnj;{multipleSelectResult = $value}&zwnj;}" multiple&gt;
                &lt;option value="volvo"&gt;Volvo&lt;/option&gt;
                &lt;option value="saab"&gt;Saab&lt;/option&gt;
                &lt;option value="opel"&gt;Opel&lt;/option&gt;
                &lt;option value="audi"&gt;Audi&lt;/option&gt;
            &lt;/select&gt;
        </code></pre>

        <br>

        <div>{{multipleSelectResult}}</div>
        <select value="{{multipleSelectResult = $value}}" multiple>
            <option value="volvo">Volvo</option>
            <option value="saab">Saab</option>
            <option value="opel">Opel</option>
            <option value="audi">Audi</option>
        </select>

    </section>

    <section>
        <h3>Submit Binder</h3>
        <br>
        <form onsubmit="{{submit($form)}}">
            <div>{{firstName}}</div>
            <input name="name.first" value="{{firstName = $value}}" placeholder="first name">
            <div>{{lastName}}</div>
            <input name="name.last" value="{{$value ?? lastName}}" placeholder="last name">
            <br>
            <br>
            <input type="checkbox" name="agree" value="{{agree ? 'yes' : 'no'}}" checked="{{agree = $checked}}">Agree? {{agree ? 'yes': 'no'}}
            <br>
            <br>
            <strong>Animal:</strong>
            <input type="radio" name="animal" value="{{'dogs'}}" checked="{{$checked}}">Dogs
            <input type="radio" name="animal" value="cats" checked="{{$checked}}">Cats
            <br>
            <br>
            <div>{{favoriteNumber}}</div>
            <input name="favoriteNumber" type="number" value="{{favoriteNumber = $value}}">
            <br>
            <br>
            <input type="submit" value="submit">
        </form>
        <br>
        <pre>{{form}}</pre>
    </section>

    <section>
        <h3>HTML Binder</h3>
        <br>
        <pre><code class="language-html">
            &lt;div html="{&zwnj;{'&lt;strong&gt;Hyper Text Markup Language&lt;/strong&gt;'}&zwnj;}"&gt;&lt;/div&gt;
        </code></pre>
        <br>
        <pre><code class="language-html">
            &lt;div&gt;&lt;strong&gt;Hyper Text Markup Language&lt;/strong&gt;&lt;/div&gt;
        </code></pre>
        <br>
        <div html="{{'<strong>Hyper Text Markup Language</strong>'}}"></div>
    </section>
    `;

}

