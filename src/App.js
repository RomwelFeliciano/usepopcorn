import { useState, useEffect, useRef } from 'react';
import StartRating from './StartRating';

const average = (arr) =>
	arr.reduce((acc, cur, i, arr) => acc + cur / arr.length, 0);

const KEY = 'c98b036a';

export default function App() {
	const [query, setQuery] = useState('');
	const [movies, setMovies] = useState([]);
	// const [watched, setWatched] = useState([]);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState('');
	const [selectedID, setSelectedID] = useState(null);

	const [watched, setWatched] = useState(function () {
		const storedValue = localStorage.getItem('watched');
		return JSON.parse(storedValue);
	});

	function handleSelectMovie(id) {
		setSelectedID((selectedID) => (id === selectedID ? null : id));
	}

	function handleCloseMovie() {
		setSelectedID(null);
	}

	function handleAddWatched(movie) {
		setWatched((watched) => [...watched, movie]);

		// localStorage.setItem('watched', JSON.stringify([...watched, movie]));
	}

	function handleDeleteWatched(id) {
		setWatched((watched) => watched.filter((movie) => movie.imdbID !== id));
	}

	useEffect(
		function () {
			localStorage.setItem('watched', JSON.stringify(watched));
		},
		[watched]
	);

	useEffect(
		function () {
			const controller = new AbortController();

			async function fetchMovies() {
				try {
					setIsLoading(true);
					setError('');

					const res = await fetch(
						`http://www.omdbapi.com/?apikey=${KEY}&s=${query}`,
						{ signal: controller.signal }
					);

					if (!res.ok)
						throw new Error(
							'Something went wrong with fetching movies'
						);
					const data = await res.json();

					if (data.Response === 'False')
						throw new Error('Movie not found');

					setMovies(data.Search);
					setError('');
				} catch (err) {
					// console.log(err);
					if (err.name !== 'AbortError') {
						setError(err.message);
					}
				} finally {
					setIsLoading(false);
				}
			}

			if (query.length < 3) {
				setMovies([]);
				setError('');
				return;
			}
			handleCloseMovie();
			fetchMovies();

			return function () {
				controller.abort();
			};
		},
		[query]
	);

	return (
		<>
			<NavBar>
				<Search query={query} setQuery={setQuery} />
				<NumResults movies={movies} />
			</NavBar>

			<Main>
				<Box>
					{/* {isLoading ? <Loader /> : <MovieList movies={movies} />} */}
					{isLoading && <Loader />}
					{!isLoading && !error && (
						<MovieList
							movies={movies}
							handleSelectMovie={handleSelectMovie}
						/>
					)}
					{error && <ErrorMessage message={error} />}
				</Box>

				<Box>
					{selectedID ? (
						<MovieDetails
							selectedID={selectedID}
							handleCloseMovie={handleCloseMovie}
							handleAddWatched={handleAddWatched}
							watched={watched}
						/>
					) : (
						<>
							<WatchedSummary watched={watched} />
							<WatchedMoviesList
								watched={watched}
								handleDeleteWatched={handleDeleteWatched}
							/>
						</>
					)}
				</Box>

				{/* <Box element={<MovieList movies={movies} />} />
				<Box
					element={
						<>
							<WatchedSummary watched={watched} />
							<WatchedMoviesList watched={watched} />
						</>
					}
				/> */}
			</Main>
		</>
	);
}

function Loader() {
	return <p className="loader">Loading...</p>;
}

function ErrorMessage({ message }) {
	return (
		<p className="error">
			<span>⛔</span>
			{message}
		</p>
	);
}

function NavBar({ children }) {
	return (
		<nav className="nav-bar">
			<Logo />
			{children}
		</nav>
	);
}

function Logo() {
	return (
		<div className="logo">
			<span role="img">🍿</span>
			<h1>usePopcorn</h1>
		</div>
	);
}

function Search({ query, setQuery }) {
	// useEffect(function () {
	// 	const el = document.querySelector('.search');
	// 	el.focus();
	// }, []);

	const inputEl = useRef(null);

	useEffect(
		function () {
			function callback(e) {
				if (document.activeElement === inputEl.current) return;

				if (e.code === 'Enter') {
					inputEl.current.focus();
					setQuery('');
				}
			}

			document.addEventListener('keydown', callback);
			return () => document.addEventListener('keydown', callback);
		},
		[setQuery]
	);

	return (
		<input
			className="search"
			type="text"
			placeholder="Search movies..."
			value={query}
			onChange={(e) => setQuery(e.target.value)}
			ref={inputEl}
		/>
	);
}

function NumResults({ movies }) {
	return (
		<p className="num-results">
			Found <strong>{movies.length}</strong> results
		</p>
	);
}

function Main({ children }) {
	return <main className="main">{children}</main>;
}

function Box({ children }) {
	const [isOpen, setIsOpen] = useState(true);

	return (
		<div className="box">
			<button
				className="btn-toggle"
				onClick={() => setIsOpen((open) => !open)}
			>
				{isOpen ? '–' : '+'}
			</button>
			{isOpen && children}
		</div>
	);
}

function MovieList({ movies, handleSelectMovie }) {
	return (
		<ul className="list list-movies">
			{movies?.map((movie) => (
				<Movie
					key={movie.imdbID}
					movie={movie}
					handleSelectMovie={handleSelectMovie}
				/>
			))}
		</ul>
	);
}

function Movie({ movie, handleSelectMovie }) {
	return (
		<li onClick={() => handleSelectMovie(movie.imdbID)}>
			<img src={movie.Poster} alt={`${movie.Title} poster`} />
			<h3>{movie.Title}</h3>
			<div>
				<p>
					<span>🗓</span>
					<span>{movie.Year}</span>
				</p>
			</div>
		</li>
	);
}

function MovieDetails({
	selectedID,
	handleCloseMovie,
	handleAddWatched,
	watched,
}) {
	const [movie, setMovie] = useState({});
	const [isLoading, setIsLoading] = useState(false);
	const [userRating, setUserRating] = useState('');

	const isWatched = watched.map((movie) => movie.imdbID).includes(selectedID);

	const watchedUserRating = watched.find(
		(movie) => movie.imdbID === selectedID
	)?.userRating;

	const {
		Title: title,
		Year: year,
		Poster: poster,
		Runtime: runtime,
		imdbRating,
		Plot: plot,
		Released: released,
		Actors: actors,
		Director: director,
		Genre: genre,
	} = movie;

	useEffect(
		function () {
			async function getMovieDetails() {
				setIsLoading(true);

				const res = await fetch(
					`http://www.omdbapi.com/?apikey=${KEY}&i=${selectedID}`
				);

				const data = await res.json();

				setMovie(data);
				setIsLoading(false);
			}
			getMovieDetails();
		},
		[selectedID]
	);

	// const isTop = imdbRating > 8;

	// const [avgRating, setAvgRating] = useState(0);

	function handleAdd() {
		const newWatchedMovie = {
			imdbID: selectedID,
			title,
			year,
			poster,
			imdbRating: Number(imdbRating),
			runtime: Number(runtime.split(' ').at(0)),
			userRating,
		};
		handleAddWatched(newWatchedMovie);
		handleCloseMovie();
		// setAvgRating(Number(imdbRating));
		// console.log(avgRating);
		// setAvgRating((avgRating) => (avgRating + userRating) / 2);
	}

	useEffect(
		function () {
			function callback(e) {
				if (e.code === 'Escape') {
					handleCloseMovie();
					// console.log('closing');
				}
			}
			document.addEventListener('keydown', callback);

			return function () {
				document.removeEventListener('keydown', callback);
			};
		},
		[handleCloseMovie]
	);

	useEffect(
		function () {
			if (!title) return;
			document.title = `Movie | ${title}`;

			return function () {
				document.title = 'usePopcorn';
				// console.log(`Clean up effect for movie ${title}`);
			};
		},
		[title]
	);

	return (
		<div className="details">
			{isLoading ? (
				<Loader />
			) : (
				<>
					<header>
						<button className="btn-back" onClick={handleCloseMovie}>
							&larr;
						</button>
						<img src={poster} alt={`Poster of ${movie} movie`} />
						<div className="details-overview">
							<h2>{title}</h2>
							<p>
								{released} &bull; {runtime}
							</p>
							<p>{genre}</p>
							<p>
								<span>⭐</span>
								{imdbRating} IMDb rating
							</p>
						</div>
					</header>
					<section>
						<div className="rating">
							{/* <p>{avgRating}</p> */}
							{!isWatched ? (
								<>
									<StartRating
										maxRating={10}
										size={24}
										onSetRating={setUserRating}
									/>
									{userRating > 0 && (
										<button
											className="btn-add"
											onClick={handleAdd}
										>
											+ Add to list
										</button>
									)}
								</>
							) : (
								<p>
									You rated this movie as {watchedUserRating}
									⭐
								</p>
							)}
						</div>
						<p>
							<em>{plot}</em>
						</p>
						<p>Starring {actors}</p>
						<p>Directed by {director}</p>
					</section>
				</>
			)}
		</div>
	);
}

function WatchedSummary({ watched }) {
	const avgImdbRating = average(watched.map((movie) => movie.imdbRating));
	const avgUserRating = average(watched.map((movie) => movie.userRating));
	const avgRuntime = average(watched.map((movie) => movie.runtime));

	return (
		<div className="summary">
			<h2>Movies you watched</h2>
			<div>
				<p>
					<span>#️⃣</span>
					<span>{watched.length} movies</span>
				</p>
				<p>
					<span>⭐️</span>
					<span>{avgImdbRating.toFixed(2)}</span>
				</p>
				<p>
					<span>🌟</span>
					<span>{avgUserRating.toFixed(2)}</span>
				</p>
				<p>
					<span>⏳</span>
					<span>{avgRuntime} min</span>
				</p>
			</div>
		</div>
	);
}

function WatchedMoviesList({ watched, handleDeleteWatched }) {
	return (
		<ul className="list">
			{watched.map((movie) => (
				<WatchedMovie
					movie={movie}
					key={movie.imdbID}
					handleDeleteWatched={handleDeleteWatched}
				/>
			))}
		</ul>
	);
}

function WatchedMovie({ movie, handleDeleteWatched }) {
	return (
		<li>
			<img src={movie.poster} alt={`${movie.Title} poster`} />
			<h3>{movie.title}</h3>
			<div>
				<p>
					<span>⭐️</span>
					<span>{movie.imdbRating}</span>
				</p>
				<p>
					<span>🌟</span>
					<span>{movie.userRating}</span>
				</p>
				<p>
					<span>⏳</span>
					<span>{movie.runtime} min</span>
				</p>
				<button
					className="btn-delete"
					onClick={() => handleDeleteWatched(movie.imdbID)}
				>
					X
				</button>
			</div>
		</li>
	);
}
