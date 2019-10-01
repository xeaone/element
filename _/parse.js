const PIPE = /\s?\|\s?/;
const PIPES = /\s?,\s?|\s+/;
const PATH = /\s?,\s?|\s?\|\s?|\s+|/;

export default function parse (data) {
    const { name, value } = data;

    let v = value.replace(/{{|}}/g, '');

    const pipe = v.split(PIPE);
    const paths = v.split(PATH);

    const values = (pipe[0] || '').split('.');
    const pipes = (pipe[1] || '').split(PIPES);
    const names = (name.split('o-')[1] || '').split('-');

    return { paths, pipes, names, values, name, value };
};
