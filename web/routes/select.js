var title = 'Select';

export default {
	title: title,
	path: '/select',
	component: {
		name: 'r-select',
		model: {
			title: title,
			cars: [
				'Audi',
				'Saab',
				'Volvo'
			],
			names: [
				'jon',
				'alex',
				'dave'
			],
			result: {
				fruit: '',
				name: '',
				cars: []
			}
		},
		template: `

			<h2 o-text="title"></h2>

			<hr>

			<div o-text="result.fruit"></div>
			<select o-value="result.fruit">
				<option value="apple">apple</option>
				<option value="pear">pear</option>
				<option value="peach" selected>peach</option>
			</select>

			<hr>

			<div o-text="result.cars"></div>
			<select o-value="result.cars" o-each-car="cars" multiple>
				<option o-value="car" o-text="car"></option>
			</select>

			<hr>

			<div o-text="result.name"></div>
			<select o-value="result.name" o-each-name="names">
				<option o-value="name" o-text="name"></option>
			</select>

		`
	}
}

/*


*/
