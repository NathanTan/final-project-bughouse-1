import typescript from 'rollup-plugin-typescript';
import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import globals from 'rollup-plugin-node-globals';

export default {
	format: 'iife',
	entry: "index.tsx",
	plugins: [
		resolve({
			jsnext: true,
			main: true,
			browser: true
		}),
		commonjs({
			include: "../../node_modules/**"
		}),
		typescript({
			typescript: require('typescript')
		}),
		globals()
	],
	dest: "../../public/js/bundle.js",
	sourceMap: true
};
