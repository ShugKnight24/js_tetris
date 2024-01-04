'use strict';

const player = {
	pos: {
		x: 5,
		y: 5
	},
	matrix: null,
	rows: 0,
	score: 0,
	nextPiece: null,
	isPaused: false
};

function getId(element){
	return document.getElementById(element);
}

const canvas = getId('tetris-field');
const context = canvas.getContext('2d');

const previewContext = getId('preview').getContext('2d');
previewContext.scale(20, 20);

context.scale(20, 20);

function cleanArena(){
	let rowCount = 1;
	outer: for (let y = arena.length - 1; y > 0; --y){
		for (let x = 0; x < arena[y].length; ++x){
			// TODO: Create a gameover screen
			if (arena[y][x] === 0){
				continue outer;
			}
		}

		const row = arena.splice(y, 1)[0].fill(0);
		arena.unshift(row);
		++y;

		player.rows += rowCount;
		player.score += rowCount * 10;
// TODO: Create a row multiplier for getting many rows out
// TODO: implement better scoring system
	}
}

function createMatrix(w, h){
	const matrix = [];
	while (h--){
		matrix.push(new Array(w).fill(0));
	}
	return matrix;
}

// TODO: Implement more pieces for added fun / complexity
// ideas 5 long I
// twin sided combo J/L
// Others?

function createPiece(type){
	const pieces = {
		'I': [
			[0, 1, 0, 0],
			[0, 1, 0, 0],
			[0, 1, 0, 0],
			[0, 1, 0, 0],
		],
		'J': [
			[0, 2, 0],
			[0, 2, 0],
			[2, 2, 0],
		],
		'L': [
			[0, 3, 0],
			[0, 3, 0],
			[0, 3, 3],
		],
		'O': [
 			[4, 4],
			[4, 4],
		],
		'S': [
			[0, 5, 5],
			[5, 5, 0],
			[0, 0, 0],
		],
		'T': [
			[0, 0, 0],
			[0, 6, 0],
			[6, 6, 6],
		],
		'Z': [
			[7, 7, 0],
			[0, 7, 7],
			[0, 0, 0],
		]
	};
	return pieces[type];
}

// Draw functionality
function clearCanvas(context, canvas) {
	context.fillStyle = '#000';
	context.fillRect(0, 0, canvas.width, canvas.height);
}

function drawBlock(x, y, value, context){
	if (value !== 0){
		context.fillStyle = colors[value];
		context.fillRect(x, y, 1, 1);
	}
}

function drawMatrix(matrix, offset, context){
	matrix.forEach((row, y) => {
		row.forEach((value, x) => {
			drawBlock(x + offset.x, y + offset.y, value, context);
		});
	});
}

function draw(){
	clearCanvas(context, canvas);

	drawMatrix(arena, {x: 0, y: 0}, context);
	drawMatrix(player.matrix, player.pos, context);
}

function merge(arena, player){
	player.matrix.forEach((row, y) => {
		row.forEach((value, x) => {
			if (value !== 0){
				arena[y + player.pos.y][x + player.pos.x] = value;
			}
		});
	});
}

// collision detection
function collide(arena, player) {
	const [playerMatrix, playerPos] = [player.matrix, player.pos];

	for (let rowIndex = 0; rowIndex < playerMatrix.length; ++rowIndex) {
		for (let columnIndex = 0; columnIndex < playerMatrix[rowIndex].length; ++columnIndex) {
			if (playerMatrix[rowIndex][columnIndex] !== 0) {
				if (
					!arena[rowIndex + playerPos.y] ||
					arena[rowIndex + playerPos.y][columnIndex + playerPos.x] !== 0
				) {
					return true;
				}
			}
		}
	}

	return false;
}

function isColliding(arena, player) {
	return collide(arena, player);
}

// Player functionality
function playerMove(dir){
	player.pos.x += dir;
	if (isColliding(arena, player)){
		player.pos.x -= dir;
	}
}

// TODO: Implement a queue system otherwise the next piece wont match
function getRandomPiece() {
	const pieces = 'IJLOSTZ';
	return createPiece(pieces[pieces.length * Math.random() | 0]);
}

function playerReset(){
	player.matrix = player.nextPiece || getRandomPiece();
	player.nextPiece = getRandomPiece();
	player.pos.y = 0;
	player.pos.x = (arena[0].length / 2 | 0) - (player.matrix[0].length / 2 | 0);

	if (isColliding(arena, player)){
		arena.forEach(row => row.fill(0));
		// Reset scores and rows on collision
		player.score = 0;
		updateScore();
		player.rows = 0;
		updateRows();
		player.isPaused = true;
	}
}

function drawNextPiece() {
	clearCanvas(previewContext, getId('preview'));

	drawMatrix(player.nextPiece, {x: 0, y: 0}, previewContext);
}

function updatePieces() {
	player.matrix = player.nextPiece || getRandomPiece();
	player.nextPiece = getRandomPiece();
	player.pos.y = 0;
	player.pos.x = (arena[0].length / 2 | 0) - (player.matrix[0].length / 2 | 0);
}

function swap(matrix, x, y) {
	[matrix[x][y], matrix[y][x]] = [matrix[y][x], matrix[x][y]];
}

function rotate(matrix, dir){
	for (let y = 0; y < matrix.length; ++y){
		for (let x = 0; x < y; ++x){
			swap(matrix, x, y);
		}
	}

	if (dir > 0){
		matrix.forEach(row => row.reverse());
	} else {
		matrix.reverse();
	}
}

function isOutOfBounds(offset, matrix) {
	return offset > matrix[0].length;
}

function playerRotate(dir){
	const pos = player.pos.x;
	let offset = 1;
	rotate(player.matrix, dir);

	while (isColliding(arena, player)){
		player.pos.x += offset;
		offset = -(offset + (offset > 0 ? 1 : -1));

		if (isOutOfBounds(offset, player.matrix)){
			rotate(player.matrix, -dir);
			player.pos.x = pos;
			return;
		}
	}
}

function playerDrop(){
	player.pos.y++;
	if (collide(arena, player)){
		player.pos.y--;
		merge(arena, player);
		playerReset();
		updatePieces();
		cleanArena();
		updateScore();
		updateRows();
	}
	dropCounter = 0;
}

let dropCounter = 0;
let dropInterval = 1000;
let lastTime = 0;

function togglePause() {
	player.isPaused = !player.isPaused;
}

function update(time = 0){
	const deltaTime = time - lastTime;
	lastTime = time;

	dropCounter += deltaTime;

	if (dropCounter > dropInterval && !player.isPaused){
		playerDrop();
	}

	draw();
	drawNextPiece();
	requestAnimationFrame(update);
}

function updateScore(){
	getId('score').innerText = 'Score: ' + player.score;
}

function updateRows(){
	getId('rows').innerText = 'Rows: ' + player.rows;
}

const arena = createMatrix(12, 20);

// TODO: Choose better colors
const colors = [
	null,
	'lightblue',
	'blue',
	'orange',
	'yellow',
	'green',
	'purple',
	'red'
]

const keyActions = {
	'ArrowLeft': () => playerMove(-1),
	'ArrowUp': () => playerRotate(1),
	'ArrowRight': () => playerMove(1),
	'ArrowDown': () => playerDrop(),
	'p': () => togglePause(),
	'q': () => playerRotate(-1),
	'w': () => playerRotate(1)
};

document.addEventListener('keydown', event => {
	if (!player.isPaused || event.key === 'p') {
		const keyAction = keyActions[event.key];
		if (keyAction) {
			event.preventDefault();
			keyAction(event);
		}
	}
});

playerReset();
updateScore();
updateRows();

const startButton = getId('start-game-button');
startButton.addEventListener('click', event => {
	// TODO: Implement a start screen
	// Should the default functionality be if the start button is clicked the game restarts?
	player.isPaused = false;
	update();
});

const pauseButton = getId('pause-button');
pauseButton.addEventListener('click', event => {
	togglePause();
});
