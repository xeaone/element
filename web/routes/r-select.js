
export default {
	title: 'Select',
	path: './select',
	component: {
		name: 'r-select',
		model: {
			car: 'mercedes',
			cars: [
				'Audi'
			],
			allcars: [
				'Audi',
				'Saab',
				'Volvo',
				'Mercedes',
			],
		},
		template: `

		<div o-text="car"></div>
		<select o-value="car">
			<option value="audi">audi</option>
			<option value="saab" selected>saab</option>
			<option value="volvo">volvo</option>
			<option value="mercedes">mercedes</option>
		</select>

		<hr>

		<div o-text="cars"></div>
		<select o-value="cars" o-value="cars" o-each-onecar="allcars" multiple>
			<option o-value="onecar" o-text="onecar"></option>
		</select>

		`
	}
}
