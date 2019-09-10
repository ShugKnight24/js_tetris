'use strict';

function getId(element){
	return document.getElementById(element);
}

const canvas = getId('tetris-field');
const context = canvas.getContext('2d');

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

function collide(arena, player){
	const [m, o] = [player.matrix, player.pos];
	for (let y = 0; y < m.length; ++y){
		for (let x = 0; x < m[y].length; ++x){
			if (m[y][x] !== 0 &&
				(arena[y + o.y] &&
				arena[y + o.y][x + o.x]) !== 0){
				return true;
			}
		}
	}
	return false;
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

// TODO: Add upcoming piece area

function createPiece(type){

	if (type === 'I'){
		return [
			[0, 1, 0, 0],
			[0, 1, 0, 0],
			[0, 1, 0, 0],
			[0, 1, 0, 0],
		]
	}

	if (type === 'J'){
		return [
			[0, 2, 0],
			[0, 2, 0],
			[2, 2, 0],
		]
	}

	if (type === 'L'){
		return [
			[0, 3, 0],
			[0, 3, 0],
			[0, 3, 3],
		]
	}

	if (type === 'O'){
		return [
 			[4, 4],
			[4, 4],
		]
	}

	if (type === 'S'){
		return [
			[0, 5, 5],
			[5, 5, 0],
			[0, 0, 0],
		]
	}

	if (type === 'T'){
		return [
			[0, 0, 0],
			[0, 6, 0],
			[6, 6, 6],
		]
	}

	if (type === 'Z'){
		return [
			[7, 7, 0],
			[0, 7, 7],
			[0, 0, 0],
		]
	}
}

function draw(){
	// clear canvas before drawing
	context.fillStyle = '#000';
	context.fillRect(
		0,
		0,
		canvas.width,
		canvas.height
	);

	drawMatrix(
		arena,
		{
			x: 0,
			y: 0
		}
	);

	drawMatrix(
		player.matrix,
		player.pos
	);
}

function drawMatrix(matrix, offset){
	matrix.forEach((row, y) => {
		row.forEach((value, x) => {
			if (value !== 0){
				context.fillStyle = colors[value];
				context.fillRect(
					x + offset.x,
					y + offset.y,
					1,
					1);
			}
		});
	});
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

function playerMove(dir){
	player.pos.x += dir;
	if (collide(arena, player)){
		player.pos.x -= dir;
	}
}

function playerReset(){
	const pieces = 'IJLOSTZ';
	player.matrix = createPiece(pieces[pieces.length * Math.random() | 0]);
	player.pos.y = 0;
	player.pos.x = (arena[0].length / 2 | 0) -
		(player.matrix[0].length / 2 | 0);

	if (collide(arena, player)){
		arena.forEach(row => row.fill(0));
		player.score = 0;
		updateScore();
	}
}

function playerRotate(dir){
	const pos = player.pos.x;
	let offset = 1;
	rotate(player.matrix, dir);

	while (collide(arena, player)){
		player.pos.x += offset;
		offset = -(offset + (offset > 0 ? 1 : -1));

		if (offset > player.matrix[0].length){
			rotate(player.matrix, -dir);
			player.pos.x = pos;
			return;
		}
	}
}

function rotate(matrix, dir){
	for (let y = 0; y < matrix.length; ++y){
		for (let x = 0; x < y; ++x){
			[
				matrix[x][y],
				matrix[y][x],
			] = [
				matrix[y][x],
				matrix[x][y],
			];
		}
	}

	if (dir > 0){
		matrix.forEach(row => row.reverse());
	} else {
		matrix.reverse();
	}
}

function playerDrop(){
	player.pos.y++;
	if (collide(arena, player)){
		player.pos.y--;
		merge(arena, player);
		playerReset();
		cleanArena();
		updateScore();
	}
	dropCounter = 0;
}

let dropCounter = 0;
let dropInterval = 1000;
let lastTime = 0;

function update(time = 0){
	const deltaTime = time - lastTime;

	dropCounter += deltaTime;

	if (dropCounter > dropInterval){
		playerDrop();
	}

	lastTime = time;
	draw();
	requestAnimationFrame(update);
}

function updateScore(){
	getId('score').innerText = 'Score: ' + player.score;
}

function updateRows(){
	getId('rows').innerText = 'Rows: ' + player.rows
}

const arena = createMatrix(12, 20);

const player = {
	pos: {
		x: 5,
		y: 5
	},
	matrix: null,
	rows: 0,
	score: 0,
}

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

document.addEventListener('keydown', event => {
	// left arrow
	if (event.keyCode === 37){
		event.preventDefault();
		playerMove(-1);
	}
	// up arrow - rotate
	if (event.keyCode === 38){
		event.preventDefault();
		playerRotate(1);
	}
	// right arrow
	if (event.keyCode === 39){
		event.preventDefault();
		playerMove(1);
	}
	// down arrow - drop
	if (event.keyCode === 40){
		event.preventDefault();
		playerDrop();
	}
	// 'Q' - rotate
	if (event.keyCode === 81){
		event.preventDefault();
		playerRotate(-1);
	}
	// 'W' - rotate
	if (event.keyCode === 87){
		event.preventDefault();
		playerRotate(1);
	}
});

playerReset();
updateScore();
updateRows();

let startButton = getId('start-game-button');

startButton.addEventListener('click', event => {
	update();
});
