// These characters have special meaning to the parser and must not appear in the middle of a token, except as part of a string.
const specials = ',"\'`{}()/:[\\]';

// Create the actual regular expression by or-ing the following regex strings. The order is important.
const bindingToken = RegExp([
    // These match strings, either with double quotes, single quotes, or backticks
    '"(?:\\\\.|[^"])*"',
    "'(?:\\\\.|[^'])*'",
    "`(?:\\\\.|[^`])*`",
    // Match C style comments
    "/\\*(?:[^*]|\\*+[^*/])*\\*+/",
    // Match C++ style comments
    "//.*\n",
    // Match a regular expression (text enclosed by slashes), but will also match sets of divisions
    // as a regular expression (this is handled by the parsing loop below).
    '/(?:\\\\.|[^/])+/\w*',
    // Match text (at least two characters) that does not contain any of the above special characters,
    // although some of the special characters are allowed to start it (all but the colon and comma).
    // The text can contain spaces, but leading or trailing spaces are skipped.
    '[^\\s:,/][^' + specials + ']*[^\\s' + specials + ']',
    // Match any non-space character not matched already. This will match colons and commas, since they're
    // not matched by "everyThingElse", but will also match any other single character that wasn't already
    // matched (for example: in "a: 1, b: 2", each of the non-space characters will be matched by oneNotSpace).
    '[^\\s]'
].join('|'), 'g');

// Match end of previous token to determine whether a slash is a division or regex.
const divisionLookBehind = /[\])"'A-Za-z0-9_$]+$/;
const keywordRegexLookBehind = { 'in': 1, 'return': 1, 'typeof': 1 };

const literal = function (string) {
    // Trim braces '{' surrounding the whole object literal
    if (string.charCodeAt(0) === 123) string = string.slice(1, -1);

    // Add a newline to correctly match a C++ style comment at the end of the string and
    // add a comma so that we don't need a separate code block to deal with the last item
    string += "\n,";

    // Split into tokens
    const result = [];
    let tokens = string.match(bindingToken), key, values = [], depth = 0;

    if (tokens.length > 1) {
        for (let i = 0, token; token = tokens[ i ]; ++i) {
            const c = token.charCodeAt(0);
            // A comma signals the end of a key/value pair if depth is zero
            if (c === 44) { // ","
                if (depth <= 0) {
                    result.push((key && values.length) ? { key: key, value: values.join('') } : { 'unknown': key || values.join('') });
                    key = depth = 0;
                    values = [];
                    continue;
                }
                // Simply skip the colon that separates the name and value
            } else if (c === 58) { // ":"
                if (!depth && !key && values.length === 1) {
                    key = values.pop();
                    continue;
                }
                // Comments: skip them
            } else if (c === 47 && token.length > 1 && (token.charCodeAt(1) === 47 || token.charCodeAt(1) === 42)) {  // "//" or "/*"
                continue;
                // A set of slashes is initially matched as a regular expression, but could be division
            } else if (c === 47 && i && token.length > 1) {  // "/"
                // Look at the end of the previous token to determine if the slash is actually division
                const match = tokens[ i - 1 ].match(divisionLookBehind);
                if (match && !keywordRegexLookBehind[ match[ 0 ] ]) {
                    // The slash is actually a division punctuator; re-parse the remainder of the string (not including the slash)
                    string = string.substr(string.indexOf(token) + 1);
                    tokens = string.match(bindingToken);
                    i = -1;
                    // Continue with just the slash
                    token = '/';
                }
                // Increment depth for parentheses, braces, and brackets so that interior commas are ignored
            } else if (c === 40 || c === 123 || c === 91) { // '(', '{', '['
                ++depth;
            } else if (c === 41 || c === 125 || c === 93) { // ')', '}', ']'
                --depth;
                // The key will be the first token; if it's a string, trim the quotes
            } else if (!key && !values.length && (c === 34 || c === 39)) { // '"', "'"
                token = token.slice(1, -1);
            }
            values.push(token);
        }
        if (depth > 0) {
            throw Error("Unbalanced parentheses, braces, or brackets");
        }
    }
    return result;
};

export default literal;