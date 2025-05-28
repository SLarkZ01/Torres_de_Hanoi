AOS.init({
    duration: 1000,
    once: true,
});

// Variables del juego
let numberOfDisks = 3;
let towers = [[], [], []]; // Representando las tres torres
let selectedDisk = null; // Almacena el disco que se está moviendo actualmente
let selectedTower = null; // Almacena la torre desde la que se recoge un disco
let moveCount = 0;
let timerInterval;
let seconds = 0;
let isGameActive = false;
let solutionSteps = [];
let solutionIndex = 0;
let solutionPlaybackInterval;
let solutionSpeed = 500; // milisegundos

// Elementos del DOM
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
const loseModal = new bootstrap.Modal(document.getElementById('loseModal'));
const loseMinMovesSpan = document.getElementById('loseMinMoves');
const newGameLoseBtn = document.getElementById('newGameLoseBtn');

// Controles de la solución
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

// Escuchadores de eventos
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
newGameLoseBtn.addEventListener('click', () => {
    loseModal.hide();
    startNewGame();
});

towerContainers.forEach((tower, index) => {
    tower.addEventListener('click', () => handleTowerClick(index));
});

// Escuchadores para la reproducción de la solución
playSolutionBtn.addEventListener('click', playSolution);
pauseSolutionBtn.addEventListener('click', pauseSolution);
prevStepBtn.addEventListener('click', () => goToSolutionStep(solutionIndex - 1));
nextStepBtn.addEventListener('click', () => goToSolutionStep(solutionIndex + 1));
stopSolutionBtn.addEventListener('click', stopSolution);
solutionSpeedSlider.addEventListener('input', (e) => {
    solutionSpeed = 2100 - parseInt(e.target.value); // Invertir el slider para un control intuitivo de la velocidad
    solutionSpeedValueSpan.textContent = `${(solutionSpeed / 1000).toFixed(1)}s`;
    if (solutionPlaybackInterval) { // Si está reproduciendo, reiniciar con la nueva velocidad
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

// Funciones de lógica del juego

function startNewGame() {
    resetGame();
    isGameActive = true;
    towers = [[], [], []];
    solutionSteps = [];
    solutionIndex = 0;

    // Llenar la primera torre con los discos
    for (let i = numberOfDisks; i >= 1; i--) {
        towers[0].push(i);
    }

    renderDisks();
    updateStats();
    startTimer();
    gameStatusSpan.textContent = '';
    gameStatusSpan.classList.remove('win');
    calculateHanoiSolution(numberOfDisks, 0, 2, 1); // Calcular la solución para el nuevo juego
}

function resetGame() {
    stopTimer();
    pauseSolution(); // Detener la reproducción de la solución si está activa
    moveCount = 0;
    selectedDisk = null;
    selectedTower = null;
    isGameActive = false;
    towers = [[], [], []]; // Limpiar todas las torres
    renderDisks(); // Limpiar la visualización
    updateStats();
    timerSpan.textContent = '00:00';
    gameStatusSpan.textContent = '';
    gameStatusSpan.classList.remove('win');
    minMovesSpan.textContent = (Math.pow(2, numberOfDisks) - 1).toString();
    solutionSteps = [];
    solutionIndex = 0;
    // Volver a llenar la primera torre para el usuario, si no está en modo solución
    for (let i = numberOfDisks; i >= 1; i--) {
        towers[0].push(i);
    }
    renderDisks();
}

function renderDisks() {
    towerContainers.forEach((towerContainer, towerIndex) => {
        const disksContainer = towerContainer.querySelector('.disks-container');
        disksContainer.innerHTML = ''; // Limpiar los discos existentes

        towers[towerIndex].forEach(diskSize => {
            const disk = document.createElement('div');
            disk.classList.add('disk', `disk-${diskSize}`);
            disk.dataset.size = diskSize;
            disk.textContent = diskSize; // Opcional: mostrar el tamaño del disco
            disksContainer.appendChild(disk);
        });
    });
}

function handleTowerClick(towerIndex) {
    if (!isGameActive) return;

    const targetTower = towers[towerIndex];

    if (selectedDisk === null) {
        // No hay disco seleccionado aún, intentar tomar uno
        if (targetTower.length > 0) {
            selectedDisk = targetTower[targetTower.length - 1]; // Tomar el disco superior
            selectedTower = towerIndex;
            towerContainers[selectedTower].classList.add('selected');
        }
    } else {
        // Ya hay un disco seleccionado, intentar colocarlo
        if (towerIndex === selectedTower) {
            // Hacer clic en la misma torre deselecciona el disco
            selectedDisk = null;
            selectedTower = null;
            towerContainers.forEach(t => t.classList.remove('selected'));
        } else if (targetTower.length === 0 || selectedDisk < targetTower[targetTower.length - 1]) {
            // Movimiento válido: la torre destino está vacía o el disco superior es mayor
            moveDisk(selectedTower, towerIndex);
            selectedDisk = null;
            selectedTower = null;
            towerContainers.forEach(t => t.classList.remove('selected'));
        } else {
            // Movimiento inválido: mostrar retroalimentación sin alerta
            showInvalidMoveFeedback();
            selectedDisk = null; // Deseleccionar para permitir un nuevo intento
            selectedTower = null;
            towerContainers.forEach(t => t.classList.remove('selected'));
        }
    }
}

function moveDisk(sourceTowerIndex, destTowerIndex, isSolutionMove = false) {
    if (towers[sourceTowerIndex].length === 0) return; // No debería ocurrir con la validación

    const diskToMove = towers[sourceTowerIndex].pop();
    towers[destTowerIndex].push(diskToMove);

    if (!isSolutionMove) { // Solo incrementar moveCount para movimientos del usuario
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

    // Mostrar modal de derrota si se alcanzan los movimientos mínimos y no se ha ganado
    if (moveCount >= minMoves && !checkWinCondition() && isGameActive) {
        isGameActive = false;
        stopTimer();
        loseMinMovesSpan.textContent = minMoves;
        loseModal.show();
    }
}

function startTimer() {
    seconds = 0;
    stopTimer(); // Limpiar cualquier temporizador existente
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
    // Condición de victoria: todos los discos están en la última torre (torre 2)
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
// Esta clase representa cada nodo del árbol binario utilizado para modelar la solución recursiva de las Torres de Hanoi.
// Cada nodo almacena:
// - 'disk': el número de disco que se mueve en ese paso.
// - 'from': la torre de origen.
// - 'to': la torre de destino.
// - 'left': referencia al subproblema izquierdo (mover n-1 discos al auxiliar).
// - 'right': referencia al subproblema derecho (mover n-1 discos al destino).
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
// Esta función genera recursivamente el árbol binario que representa la solución de las Torres de Hanoi.
// Cada nodo del árbol representa el movimiento de un disco específico desde una torre origen a una torre destino.
// - Si n == 1 (caso base), crea un nodo para mover el disco 1 directamente de la torre origen a la torre destino.
// - Si n > 1, crea un nodo para mover el disco n y:
//   - El subárbol izquierdo representa mover los n-1 discos superiores de la torre origen a la torre auxiliar.
//   - El subárbol derecho representa mover esos n-1 discos de la torre auxiliar a la torre destino.
// Así, el árbol refleja la estructura recursiva del algoritmo de Hanoi.
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
// Esta función recorre el árbol binario generado por buildHanoiTree en orden inorden (izquierda, raíz, derecha).
// El recorrido inorden permite obtener la secuencia correcta de movimientos para resolver las Torres de Hanoi.
// Cada vez que visita un nodo, agrega el movimiento correspondiente al arreglo 'steps'.
function traverseHanoiTree(node, steps = []) {
    if (!node) return steps;
    traverseHanoiTree(node.left, steps);
    steps.push({ disk: node.disk, from: node.from, to: node.to });
    traverseHanoiTree(node.right, steps);
    return steps;
}

// Nueva función para calcular la solución usando árbol binario
// Esta función utiliza buildHanoiTree para construir el árbol de movimientos y luego traverseHanoiTree para obtener la lista ordenada de pasos.
// El resultado se almacena en solutionSteps, que se usa para mostrar la solución paso a paso en la interfaz.
function calculateHanoiSolution(n, source, destination, auxiliary) {
    solutionSteps = [];
    const root = buildHanoiTree(n, source, destination, auxiliary);
    solutionSteps = traverseHanoiTree(root, []);
}

// Calcula el número de nodos y la altura del árbol de Hanoi
// Esta función devuelve dos datos importantes sobre el árbol binario de la solución:
// - 'nodos': representa el número total de movimientos necesarios para resolver las Torres de Hanoi con n discos, que es 2^n - 1.
// - 'altura': corresponde a la altura del árbol, que es igual al número de discos n (ya que cada nivel del árbol representa mover un disco).
// Estos valores permiten analizar la complejidad y el crecimiento exponencial del problema.
function getHanoiTreeStats(n) {
    return {
        nodos: Math.pow(2, n) - 1,
        altura: n
    };
}

function showSolution() {
    if (solutionSteps.length === 0) {
        // Si la solución no está calculada para el número actual de discos, calcularla.
        // Esto puede ocurrir si el usuario hace clic en "Mostrar Solución" inmediatamente después de cambiar el número de discos.
        calculateHanoiSolution(numberOfDisks, 0, 2, 1);
    }

    // Reiniciar el estado del juego para la reproducción de la solución
    towers = [[], [], []];
    for (let i = numberOfDisks; i >= 1; i--) {
        towers[0].push(i);
    }
    renderDisks(); // Estado inicial para la solución

    isGameActive = false; // Deshabilitar la interacción del usuario durante la reproducción de la solución
    stopTimer(); // Detener el temporizador del usuario

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
    if (solutionPlaybackInterval) return; // Ya está reproduciendo

    solutionPlaybackInterval = setInterval(() => {
        if (solutionIndex < solutionSteps.length) {
            executeSolutionStep(solutionIndex);
            solutionIndex++;
            highlightCurrentSolutionStep();
        } else {
            pauseSolution(); // Fin de la solución
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
    // Reiniciar al estado inicial para mostrar la solución
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
        pauseSolution(); // Pausar si está reproduciendo
        solutionIndex = index;

        // Reinicializar las torres para mostrar el estado hasta este paso
        towers = [[], [], []];
        for (let i = numberOfDisks; i >= 1; i--) {
            towers[0].push(i);
        }
        renderDisks(); // Reiniciar al estado inicial

        // Aplicar todos los pasos hasta el índice actual
        for (let i = 0; i < solutionIndex; i++) {
            const step = solutionSteps[i];
            // Quitar temporalmente el disco para moverlo de origen a destino
            const diskToMove = towers[step.from].pop();
            towers[step.to].push(diskToMove);
        }
        renderDisks(); // Actualizar el estado visual

        highlightCurrentSolutionStep();
    }
}

function executeSolutionStep(index) {
    const step = solutionSteps[index];
    if (step) {
        moveDisk(step.from, step.to, true); // true indica un movimiento de la solución
    }
}

// Retroalimentación visual para movimiento inválido
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

// Inicializar el juego al cargar
startNewGame();
solutionSpeedValueSpan.textContent = `${(solutionSpeed / 1000).toFixed(1)}s`; // Visualización inicial de la velocidad

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