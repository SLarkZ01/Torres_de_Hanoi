AOS.init({
    duration: 1000,
    once: true,
});

// Game Variables
let numberOfDisks = 3;
let towers = [[], [], []]; // Representing the three towers
let selectedDisk = null; // Stores the disk currently being moved
let selectedTower = null; // Stores the tower from which a disk is picked
let moveCount = 0;
let timerInterval;
let seconds = 0;
let isGameActive = false;
let solutionSteps = [];
let solutionIndex = 0;
let solutionPlaybackInterval;
let solutionSpeed = 500; // milliseconds

// DOM Elements
const diskCountSelect = document.getElementById('diskCount');
const newGameBtn = document.getElementById('newGameBtn');
const solutionBtn = document.getElementById('solutionBtn');
const resetBtn = document.getElementById('resetBtn');
const moveCountSpan = document.getElementById('moveCount');
const minMovesSpan = document.getElementById('minMoves');
const timerSpan = document.getElementById('timer');
const gameStatusSpan = document.getElementById('gameStatus');
const gameArea = document.getElementById('gameArea');
const towerContainers = [
    document.getElementById('tower0'),
    document.getElementById('tower1'),
    document.getElementById('tower2')
];
const winModal = new bootstrap.Modal(document.getElementById('winModal'));
const solutionModal = new bootstrap.Modal(document.getElementById('solutionModal'));
const finalMovesSpan = document.getElementById('finalMoves');
const finalTimeSpan = document.getElementById('finalTime');
const finalMinMovesSpan = document.getElementById('finalMinMoves');
const newGameModalBtn = document.getElementById('newGameModalBtn');
const solutionStepsList = document.getElementById('solutionSteps');
const moveProgressBar = document.getElementById('moveProgress');

// Solution Controls
const playSolutionBtn = document.getElementById('playSolutionBtn');
const pauseSolutionBtn = document.getElementById('pauseSolutionBtn');
const prevStepBtn = document.getElementById('prevStepBtn');
const nextStepBtn = document.getElementById('nextStepBtn');
const stopSolutionBtn = document.getElementById('stopSolutionBtn');
const solutionSpeedSlider = document.getElementById('solutionSpeedSlider');
const solutionSpeedValueSpan = document.getElementById('solutionSpeedValue');

// DOM para el árbol
const showTreeBtn = document.getElementById('showTreeBtn');
const treeText = document.getElementById('treeText');
const treeModal = new bootstrap.Modal(document.getElementById('treeModal'));

// Event Listeners
newGameBtn.addEventListener('click', startNewGame);
diskCountSelect.addEventListener('change', () => {
    numberOfDisks = parseInt(diskCountSelect.value);
    minMovesSpan.textContent = (Math.pow(2, numberOfDisks) - 1).toString();
    startNewGame();
});
solutionBtn.addEventListener('click', showSolution);
resetBtn.addEventListener('click', resetGame);
newGameModalBtn.addEventListener('click', () => {
    winModal.hide();
    startNewGame();
});

towerContainers.forEach((tower, index) => {
    tower.addEventListener('click', () => handleTowerClick(index));
});

// Solution playback listeners
playSolutionBtn.addEventListener('click', playSolution);
pauseSolutionBtn.addEventListener('click', pauseSolution);
prevStepBtn.addEventListener('click', () => goToSolutionStep(solutionIndex - 1));
nextStepBtn.addEventListener('click', () => goToSolutionStep(solutionIndex + 1));
stopSolutionBtn.addEventListener('click', stopSolution);
solutionSpeedSlider.addEventListener('input', (e) => {
    solutionSpeed = 2100 - parseInt(e.target.value); // Invert slider for intuitive speed control
    solutionSpeedValueSpan.textContent = `${(solutionSpeed / 1000).toFixed(1)}s`;
    if (solutionPlaybackInterval) { // If playing, restart with new speed
        pauseSolution();
        playSolution();
    }
});

// Evento para mostrar el árbol
showTreeBtn.addEventListener('click', () => {
    const root = buildHanoiTree(numberOfDisks, 0, 2, 1);
    const stats = getHanoiTreeStats(numberOfDisks);
    let resumen = `Resumen del árbol binario de recursión para n = ${numberOfDisks} discos:\n`;
    resumen += `- Número de nodos (movimientos): 2^${numberOfDisks} - 1 = ${stats.nodos}\n`;
    resumen += `- Altura del árbol: ${stats.altura}\n`;
    resumen += `- Complejidad: O(2^n)\n\n`;
    treeText.textContent = resumen + renderTreeText(root);
    treeModal.show();
});

// Game Logic Functions

function startNewGame() {
    resetGame();
    isGameActive = true;
    towers = [[], [], []];
    solutionSteps = [];
    solutionIndex = 0;

    // Populate the first tower with disks
    for (let i = numberOfDisks; i >= 1; i--) {
        towers[0].push(i);
    }

    renderDisks();
    updateStats();
    startTimer();
    gameStatusSpan.textContent = '';
    gameStatusSpan.classList.remove('win');
    calculateHanoiSolution(numberOfDisks, 0, 2, 1); // Calculate solution for the new game
}

function resetGame() {
    stopTimer();
    pauseSolution(); // Stop solution playback if active
    moveCount = 0;
    selectedDisk = null;
    selectedTower = null;
    isGameActive = false;
    towers = [[], [], []]; // Clear all towers
    renderDisks(); // Clear the display
    updateStats();
    timerSpan.textContent = '00:00';
    gameStatusSpan.textContent = '';
    gameStatusSpan.classList.remove('win');
    minMovesSpan.textContent = (Math.pow(2, numberOfDisks) - 1).toString();
    solutionSteps = [];
    solutionIndex = 0;
    // Re-populate the first tower for user play, if not in solution mode
    for (let i = numberOfDisks; i >= 1; i--) {
        towers[0].push(i);
    }
    renderDisks();
}

function renderDisks() {
    towerContainers.forEach((towerContainer, towerIndex) => {
        const disksContainer = towerContainer.querySelector('.disks-container');
        disksContainer.innerHTML = ''; // Clear existing disks

        towers[towerIndex].forEach(diskSize => {
            const disk = document.createElement('div');
            disk.classList.add('disk', `disk-${diskSize}`);
            disk.dataset.size = diskSize;
            disk.textContent = diskSize; // Optional: display disk size
            disksContainer.appendChild(disk);
        });
    });
}

function handleTowerClick(towerIndex) {
    if (!isGameActive) return;

    const targetTower = towers[towerIndex];

    if (selectedDisk === null) {
        // No disk selected yet, try to pick one
        if (targetTower.length > 0) {
            selectedDisk = targetTower[targetTower.length - 1]; // Get the top disk
            selectedTower = towerIndex;
            towerContainers[selectedTower].classList.add('selected');
        }
    } else {
        // A disk is already selected, try to place it
        if (towerIndex === selectedTower) {
            // Clicking the same tower deselects the disk
            selectedDisk = null;
            selectedTower = null;
            towerContainers.forEach(t => t.classList.remove('selected'));
        } else if (targetTower.length === 0 || selectedDisk < targetTower[targetTower.length - 1]) {
            // Valid move: target tower is empty or top disk is larger
            moveDisk(selectedTower, towerIndex);
            selectedDisk = null;
            selectedTower = null;
            towerContainers.forEach(t => t.classList.remove('selected'));
        } else {
            // Invalid move: show feedback without alert
            showInvalidMoveFeedback();
            selectedDisk = null; // Deselect to allow a new attempt
            selectedTower = null;
            towerContainers.forEach(t => t.classList.remove('selected'));
        }
    }
}

function moveDisk(sourceTowerIndex, destTowerIndex, isSolutionMove = false) {
    if (towers[sourceTowerIndex].length === 0) return; // Should not happen with validation

    const diskToMove = towers[sourceTowerIndex].pop();
    towers[destTowerIndex].push(diskToMove);

    if (!isSolutionMove) { // Only increment moveCount for user-driven moves
        moveCount++;
        updateStats();
    }

    renderDisks();

    if (!isSolutionMove && checkWinCondition()) {
        winGame();
    }
}

function updateStats() {
    moveCountSpan.textContent = moveCount;
    const minMoves = Math.pow(2, numberOfDisks) - 1;
    minMovesSpan.textContent = minMoves;

    const progress = Math.min(100, (moveCount / minMoves) * 100);
    moveProgressBar.style.width = `${progress}%`;
    moveProgressBar.classList.add('animate__animated', 'animate__fadeIn');
    setTimeout(() => {
        moveProgressBar.classList.remove('animate__animated', 'animate__fadeIn');
    }, 500);
}

function startTimer() {
    seconds = 0;
    stopTimer(); // Clear any existing timer
    timerInterval = setInterval(() => {
        seconds++;
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        timerSpan.textContent = `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
    }, 1000);
}

function stopTimer() {
    clearInterval(timerInterval);
}

function checkWinCondition() {
    // Win condition: all disks are on the last tower (tower 2)
    return towers[2].length === numberOfDisks;
}

function winGame() {
    isGameActive = false;
    stopTimer();
    gameStatusSpan.textContent = '¡GANASTE!';
    gameStatusSpan.classList.add('win');

    finalMovesSpan.textContent = moveCount;
    finalTimeSpan.textContent = timerSpan.textContent;
    finalMinMovesSpan.textContent = Math.pow(2, numberOfDisks) - 1;

    winModal.show();
    triggerConfetti();
}

function triggerConfetti() {
    const confettiContainer = document.createElement('div');
    confettiContainer.style.position = 'fixed';
    confettiContainer.style.top = '0';
    confettiContainer.style.left = '0';
    confettiContainer.style.width = '100%';
    confettiContainer.style.height = '100%';
    confettiContainer.style.pointerEvents = 'none';
    confettiContainer.style.zIndex = '9999';
    document.body.appendChild(confettiContainer);

    for (let i = 0; i < 100; i++) {
        const confetti = document.createElement('div');
        confetti.classList.add('confetti');
        confetti.style.left = `${Math.random() * 100}vw`;
        confetti.style.top = `${Math.random() * 100}vh`;
        confetti.style.backgroundColor = `hsl(${Math.random() * 360}, 70%, 60%)`;
        confetti.style.opacity = '1';
        confetti.style.transform = `scale(${Math.random() * 1 + 0.5})`;
        confetti.style.transition = `transform ${Math.random() * 0.5 + 0.5}s ease-out, top ${Math.random() * 3 + 2}s ease-in, opacity ${Math.random() * 0.5 + 0.5}s linear`;

        confettiContainer.appendChild(confetti);

        setTimeout(() => {
            confetti.style.top = '110vh';
            confetti.style.opacity = '0';
        }, 10);
    }

    setTimeout(() => {
        confettiContainer.remove();
    }, 5000);
}

// Nodo para el árbol binario de movimientos de Hanoi
class HanoiNode {
    constructor(disk, from, to) {
        this.disk = disk;
        this.from = from;
        this.to = to;
        this.left = null;  // Subproblema izquierdo (n-1 discos)
        this.right = null; // Subproblema derecho (n-1 discos)
    }
}

// Construye el árbol binario de movimientos
function buildHanoiTree(n, source, destination, auxiliary) {
    if (n === 1) {
        return new HanoiNode(1, source, destination);
    }
    const node = new HanoiNode(n, source, destination);
    node.left = buildHanoiTree(n - 1, source, auxiliary, destination);
    node.right = buildHanoiTree(n - 1, auxiliary, destination, source);
    return node;
}

// Recorre el árbol en inorden para obtener los pasos
function traverseHanoiTree(node, steps = []) {
    if (!node) return steps;
    traverseHanoiTree(node.left, steps);
    steps.push({ disk: node.disk, from: node.from, to: node.to });
    traverseHanoiTree(node.right, steps);
    return steps;
}

// Nueva función para calcular la solución usando árbol binario
function calculateHanoiSolution(n, source, destination, auxiliary) {
    solutionSteps = [];
    const root = buildHanoiTree(n, source, destination, auxiliary);
    solutionSteps = traverseHanoiTree(root, []);
}

// Calcula el número de nodos y la altura del árbol de Hanoi
function getHanoiTreeStats(n) {
    return {
        nodos: Math.pow(2, n) - 1,
        altura: n
    };
}

function showSolution() {
    if (solutionSteps.length === 0) {
        // If solution not calculated for current disk count, calculate it.
        // This might happen if the user clicks "Show Solution" immediately after changing disk count.
        calculateHanoiSolution(numberOfDisks, 0, 2, 1);
    }

    // Reset game state to initial for solution playback
    towers = [[], [], []];
    for (let i = numberOfDisks; i >= 1; i--) {
        towers[0].push(i);
    }
    renderDisks(); // Initial state for solution

    isGameActive = false; // Disable user interaction during solution playback
    stopTimer(); // Stop the user game timer

    solutionIndex = 0;
    populateSolutionStepsList();
    highlightCurrentSolutionStep();
    solutionModal.show();
}

function populateSolutionStepsList() {
    solutionStepsList.innerHTML = '';
    solutionSteps.forEach((step, index) => {
        const listItem = document.createElement('li');
        listItem.classList.add('list-group-item', 'd-flex', 'align-items-center', 'py-2');
        listItem.innerHTML = `<span class="badge bg-primary rounded-pill me-3">${index + 1}</span> Mover Disco ${step.disk} de Torre ${String.fromCharCode(65 + step.from)} a Torre ${String.fromCharCode(65 + step.to)}`;
        solutionStepsList.appendChild(listItem);
    });
}

function highlightCurrentSolutionStep() {
    const allSteps = solutionStepsList.querySelectorAll('li');
    allSteps.forEach((step, index) => {
        if (index === solutionIndex) {
            step.classList.add('active-step');
            step.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        } else {
            step.classList.remove('active-step');
        }
    });
}

function playSolution() {
    if (solutionPlaybackInterval) return; // Already playing

    solutionPlaybackInterval = setInterval(() => {
        if (solutionIndex < solutionSteps.length) {
            executeSolutionStep(solutionIndex);
            solutionIndex++;
            highlightCurrentSolutionStep();
        } else {
            pauseSolution(); // End of solution
            gameStatusSpan.textContent = '¡Solución Completa!';
            gameStatusSpan.classList.add('win');
        }
    }, solutionSpeed);
}

function pauseSolution() {
    clearInterval(solutionPlaybackInterval);
    solutionPlaybackInterval = null;
}

function stopSolution() {
    pauseSolution();
    // Reset to initial state for solution display
    towers = [[], [], []];
    for (let i = numberOfDisks; i >= 1; i--) {
        towers[0].push(i);
    }
    renderDisks();
    solutionIndex = 0;
    highlightCurrentSolutionStep();
    gameStatusSpan.textContent = '';
    gameStatusSpan.classList.remove('win');
}

function goToSolutionStep(index) {
    if (index >= 0 && index <= solutionSteps.length) {
        pauseSolution(); // Pause if playing
        solutionIndex = index;

        // Re-initialize towers to display the state up to this step
        towers = [[], [], []];
        for (let i = numberOfDisks; i >= 1; i--) {
            towers[0].push(i);
        }
        renderDisks(); // Reset to initial state

        // Apply all steps up to the current index
        for (let i = 0; i < solutionIndex; i++) {
            const step = solutionSteps[i];
            // Temporarily remove disk to move it from source and add to destination
            const diskToMove = towers[step.from].pop();
            towers[step.to].push(diskToMove);
        }
        renderDisks(); // Update the visual state

        highlightCurrentSolutionStep();
    }
}

function executeSolutionStep(index) {
    const step = solutionSteps[index];
    if (step) {
        moveDisk(step.from, step.to, true); // true indicates a solution move
    }
}

// Feedback visual para movimiento inválido
function showInvalidMoveFeedback() {
    gameStatusSpan.textContent = '¡Movimiento inválido!';
    gameStatusSpan.classList.add('text-danger');
    setTimeout(() => {
        if (gameStatusSpan.textContent === '¡Movimiento inválido!') {
            gameStatusSpan.textContent = '';
            gameStatusSpan.classList.remove('text-danger');
        }
    }, 1200);
}

// Función para renderizar el árbol binario en texto
function renderTreeText(node, prefix = '', isLeft = true) {
    if (!node) return '';
    let str = '';
    str += prefix;
    str += isLeft ? '├── ' : '└── ';
    str += `Disco ${node.disk}: ${String.fromCharCode(65 + node.from)} → ${String.fromCharCode(65 + node.to)}\n`;
    const hasLeft = !!node.left;
    const hasRight = !!node.right;
    if (hasLeft || hasRight) {
        if (hasLeft) {
            str += renderTreeText(node.left, prefix + (isLeft ? '│   ' : '    '), true);
        }
        if (hasRight) {
            str += renderTreeText(node.right, prefix + (isLeft ? '│   ' : '    '), false);
        }
    }
    return str;
}

// Initialize game on load
startNewGame();
solutionSpeedValueSpan.textContent = `${(solutionSpeed / 1000).toFixed(1)}s`; // Initial speed display

// Reproducir la música de fondo y reiniciar si termina (por compatibilidad extra)
const bgMusic = document.getElementById('bgMusic');
bgMusic.src = 'music/cancion.mp3'; // Ruta actualizada
bgMusic.volume = 0.5;
// Forzar reproducción tras interacción si autoplay falla
function tryPlayMusic() {
    bgMusic.play().catch(() => { });
}
document.addEventListener('DOMContentLoaded', tryPlayMusic);
document.addEventListener('click', tryPlayMusic, { once: true });
document.addEventListener('keydown', tryPlayMusic, { once: true });
bgMusic.addEventListener('ended', function () {
    this.currentTime = 0;
    this.play();
});
// Intentar reproducir automáticamente (algunos navegadores requieren interacción)
window.addEventListener('DOMContentLoaded', () => {
    bgMusic.play().catch(() => { });
});