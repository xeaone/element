
export const context = () => ({});

export const component = ({ h1, h2, section }) => [
    section(
        h1('404'),
        h2('This page does not exists')
    )
]
