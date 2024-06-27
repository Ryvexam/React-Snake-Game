const GRID_SIZE = 20;
const CELL_SIZE = 20;
const INITIAL_SNAKE = [{ x: 10, y: 10 }];
const INITIAL_DIRECTION = { x: 1, y: 0 };

let snake = INITIAL_SNAKE;
let direction = INITIAL_DIRECTION;
let food = getRandomFood();
let gameOver = false;
let score = 0;
let bestScore = 0;
let currentUsername = '';
let scoreboard = [];

const gameBoard = document.getElementById('game-board');
const scoreElement = document.getElementById('score');
const bestScoreElement = document.getElementById('best-score');
const gameOverElement = document.getElementById('game-over');
const usernameInput = document.getElementById('username');
const startGameButton = document.getElementById('start-game');
const newGameButton = document.getElementById('new-game');
const gameInfo = document.getElementById('game-info');
const usernameInputContainer = document.getElementById('username-input');

startGameButton.addEventListener('click', startNewGame);
newGameButton.addEventListener('click', startNewGame);

function startNewGame() {
    currentUsername = usernameInput.value.trim();
    if (!currentUsername) {
        alert('Please enter a username');
        return;
    }

    usernameInputContainer.classList.add('hidden');
    gameBoard.classList.remove('hidden');
    gameInfo.classList.remove('hidden');

    snake = [...INITIAL_SNAKE];
    direction = {...INITIAL_DIRECTION};
    food = getRandomFood();
    gameOver = false;
    score = 0;
    scoreElement.textContent = score;
    gameOverElement.classList.add('hidden');

    drawGame();
    gameLoop();
}

function getRandomFood() {
    return {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
    };
}

function drawGame() {
    gameBoard.innerHTML = '';
    gameBoard.style.display = 'inline-grid';
    gameBoard.style.gridTemplateColumns = `repeat(${GRID_SIZE}, ${CELL_SIZE}px)`;

    for (let y = 0; y < GRID_SIZE; y++) {
        for (let x = 0; x < GRID_SIZE; x++) {
            const cell = document.createElement('div');
            cell.style.width = `${CELL_SIZE}px`;
            cell.style.height = `${CELL_SIZE}px`;
            cell.classList.add('border', 'border-gray-700');

            if (snake.some(segment => segment.x === x && segment.y === y)) {
                cell.classList.add('bg-green-500');
            } else if (food.x === x && food.y === y) {
                cell.classList.add('bg-red-500');
            }

            gameBoard.appendChild(cell);
        }
    }
}

function updateGame() {
    if (gameOver) return;

    const head = { ...snake[0] };
    head.x += direction.x;
    head.y += direction.y;

    if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
        endGame();
        return;
    }

    if (snake.some(segment => segment.x === head.x && segment.y === head.y)) {
        endGame();
        return;
    }

    snake.unshift(head);

    if (head.x === food.x && head.y === food.y) {
        score++;
        scoreElement.textContent = score;
        food = getRandomFood();
    } else {
        snake.pop();
    }

    drawGame();
}

function endGame() {
    gameOver = true;
    gameOverElement.classList.remove('hidden');
    updateBestScore(score);
    sendScore(currentUsername, score);
}

function updateBestScore(newScore) {
    if (newScore > bestScore) {
        bestScore = newScore;
        bestScoreElement.textContent = bestScore;
    }
}

function sendScore(username, score) {
    console.log(`Sending score: ${username} - ${score}`);
    fetch('/api/score', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, score }),
    })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('Score sent successfully:', data);
            if (data.success) {
                scoreboard = data.scoreboard;
                updateScoreboardDisplay();
            } else {
                console.error('Failed to update score');
            }
        })
        .catch(error => {
            console.error('Error sending score:', error);
        });
}

function updateScoreboardDisplay() {
    const scoreboardBody = document.getElementById('scoreboard-body');
    scoreboardBody.innerHTML = '';

    scoreboard.forEach((entry, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="px-4 py-2">${index + 1}</td>
            <td class="px-4 py-2">${entry.username}</td>
            <td class="px-4 py-2">${entry.score}</td>
        `;
        scoreboardBody.appendChild(row);
    });
}

function handleKeyPress(e) {
    if (gameOver) return;

    switch (e.key) {
        case 'ArrowUp': if (direction.y === 0) direction = { x: 0, y: -1 }; break;
        case 'ArrowDown': if (direction.y === 0) direction = { x: 0, y: 1 }; break;
        case 'ArrowLeft': if (direction.x === 0) direction = { x: -1, y: 0 }; break;
        case 'ArrowRight': if (direction.x === 0) direction = { x: 1, y: 0 }; break;
    }
}

document.addEventListener('keydown', handleKeyPress);

function gameLoop() {
    if (!gameOver) {
        updateGame();
        setTimeout(gameLoop, 100); // Adjust this value to change game speed
    }
}

// Fetch the initial scoreboard when the page loads
fetch('/api/scoreboard')
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        scoreboard = data;
        updateScoreboardDisplay();
    })
    .catch(error => console.error('Error fetching scoreboard:', error));