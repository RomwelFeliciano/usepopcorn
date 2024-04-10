import React from 'react';
import ReactDOM from 'react-dom/client';
// import "./index.css";
// import App from "./App";

import StartRating from './StartRating';
import { useState } from 'react';

function Test() {
	const [movieRating, setMovieRating] = useState(0);

	return (
		<div>
			<StartRating
				color="blue"
				maxRating={8}
				onSetRating={setMovieRating}
			/>
			<p>This movies was rated {movieRating} stars</p>
		</div>
	);
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
	<React.StrictMode>
		{/* <App /> */}
		<StartRating
			messages={['Terrible', 'Bad', 'Okay', 'Good', 'Amazing']}
		/>
		<StartRating color="red" size={28} className="test" defaultRating={3} />

		<Test />
	</React.StrictMode>
);
