import parse from './parse.ts';
import stringify from './stringify.ts';

const original =/*html*/`
<html>
<head>
    <meta charset="utf-8">
    <title>All HTML Elements</title>
</head>
<body>

    <h1>All Valid HTML Elements</h1>

    <p>This document contains all valid HTML elements.</p>

    <h2>Heading 2</h2>
    <h3>Heading 3</h3>
    <h4>Heading 4</h4>
    <h5>Heading 5</h5>
    <h6>Heading 6</h6>

    <p>This is a paragraph.</p>
    <p>You can use paragraphs to format your text.</p>

    <ul>
        <li>This is an unordered list item.</li>
        <li>This is another unordered list item.</li>
    </ul>

    <ol>
        <li>This is an ordered list item.</li>
        <li>This is another ordered list item.</li>
    </ol>

    <img src="https://example.com/image.jpg" alt="Image alt text">

    <a href="https://example.com">This is a link.</a>

    <form action="/action_page.php">
        <input type="text" name="firstname" placeholder="First name">
        <input type="text" name="lastname" placeholder="Last name">
        <input type="submit" value="Submit">
        <input type="checkbox" checked>
        <input type="text" value="${'quotes'}">
    </form>

    <hr>
    <br>
    <div>This is a division.</div>
    <span>This is a span.</span>
    <pre>This is preformatted text.</pre>
    <code>This is code text.</code>
    <blockquote cite="https://example.com">This is a blockquote.</blockquote>
    <address>This is an address.</address>
    <abbr title="test">WWW</abbr>

    <svg><![CDATA[Some <CDATA> data & then some]]></svg>

</body>
</html>
`;

console.time('parse');
const v = parse(original);
console.timeEnd('parse');

const s = JSON.stringify(v, (key, value) => key === 'parent' ? undefined : value, '\t');
const j = JSON.parse(s);
await Deno.writeTextFile('tmp/parsed.json', s);
await Deno.writeTextFile('tmp/write.html', stringify(j));
const fileResult = await Deno.readTextFile('tmp/write.html');

console.log(fileResult === original ? 'PASS' : 'FAIL');
