/**
 * Archivo principal para inicializar y gestionar el juego Torres de Hanoi
 */

// Variables globales
let game;

// Elementos DOM
const newGameBtn = document.getElementById('newGameBtn');
const solutionBtn = document.getElementById('solutionBtn');
const resetBtn = document.getElementById('resetBtn');
const diskCountSelect = document.getElementById('diskCount');
const towers = [
    document.getElementById('tower0'),
    document.getElementById('tower1'),
    document.getElementById('tower2')
];

/**
 * Inicializa el juego
 */
function initGame() {
    const numDisks = parseInt(diskCountSelect.value);
    game = new HanoiGame(numDisks);
    
    // Actualizar la interfaz
    game.updateUI();
}

/**
 * Configura los eventos de la interfaz
 */
function setupEventListeners() {
    // Evento para iniciar un nuevo juego
    newGameBtn.addEventListener('click', () => {
        initGame();
    });
    
    // Evento para mostrar la solución
    solutionBtn.addEventListener('click', () => {
        if (game) {
            game.showSolution();
        }
    });
    
    // Evento para reiniciar el juego
    resetBtn.addEventListener('click', () => {
        if (game) {
            game.init();
        }
    });
    
    // Eventos para las torres
    towers.forEach((tower, index) => {
        tower.addEventListener('click', () => {
            if (game) {
                game.selectTower(index);
            }
        });
    });
    
    // Evento para cambiar el número de discos
    diskCountSelect.addEventListener('change', () => {
        initGame();
    });
}

/**
 * Función que se ejecuta cuando el DOM está completamente cargado
 */
document.addEventListener('DOMContentLoaded', () => {
    // Configurar eventos
    setupEventListeners();
    
    // Inicializar el juego
    initGame();
    
    // Mostrar mensaje de bienvenida
    console.log('¡Bienvenido al juego Torres de Hanoi!');
});