import React from 'react';
import ReactDOM from 'react-dom';
import * as other from './other';

const elem = document.getElementById('root')!;
ReactDOM.render(
	<div>
		Here's my stuff: {other.test()}
	</div>, elem);
