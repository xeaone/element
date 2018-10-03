
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
			names: [
				'jon',
				'alex',
				'bill',
				'dave'
			],
			result: {
				name: ''
			}
		},
		template: `

		<div o-text="car"></div>
		<select o-value="car">
			<option value="audi">audi</option>
			<option value="volvo">volvo</option>
			<option value="mercedes">mercedes</option>
			<option value="saab" selected>saab</option>
		</select>

		<hr>

		<div o-text="cars"></div>
		<select o-value="cars" o-each-onecar="allcars" multiple>
			<option o-value="onecar" o-text="onecar"></option>
		</select>

		<hr>

		<div o-text="result.name"></div>
		// <label>Select Name</label>
		// o-label="Select Name" 
		<select o-value="result.name" o-each-name="names">
			<option o-value="name" o-text="name"></option>
		</select>

		`
	}
}
