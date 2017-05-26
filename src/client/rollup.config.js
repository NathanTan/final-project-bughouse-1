import path from 'path';
import typescript from 'rollup-plugin-typescript';

export default {
	entry: path.join(__dirname, "index.tsx"),
	plugins: [
		typescript({
			typescript: require('typescript')
		})
	],
	dest: path.join(__dirname, "../../public/js/bundle.js")
};
