/**
 * Clase que implementa la lógica del juego Torres de Hanoi
 */
class HanoiGame {
    /**
     * Constructor del juego
     * @param {Number} numDisks - Número de discos para el juego
     */
    constructor(numDisks) {
        this.numDisks = numDisks;
        this.towers = [[], [], []];
        this.moveCount = 0;
        this.selectedTower = null;
        this.isGameOver = false;
        this.timerInterval = null;
        this.startTime = null;
        this.optimalMoves = [];
        this.solutionIndex = 0;
        this.solutionMode = false;
        this.solutionTree = null;
        
        // Inicializar el juego
        this.init();
    }
    
    /**
     * Inicializa el estado del juego
     */
    init() {
        // Limpiar torres
        this.towers = [[], [], []];
        
        // Colocar discos en la primera torre
        for (let i = this.numDisks; i >= 1; i--) {
            this.towers[0].push(i);
        }
        
        // Reiniciar contadores y estado
        this.moveCount = 0;
        this.selectedTower = null;
        this.isGameOver = false;
        this.solutionIndex = 0;
        this.solutionMode = false;
        
        // Actualizar contador de movimientos
        document.getElementById('moveCount').textContent = this.moveCount;
        
        // Actualizar movimientos mínimos
        const minMoves = Math.pow(2, this.numDisks) - 1;
        document.getElementById('minMoves').textContent = minMoves;
        
        // Generar secuencia de movimientos óptima
        this.optimalMoves = generateOptimalMoves(this.numDisks);
        
        // Construir árbol de soluciones
        this.buildTree();
        
        // Iniciar temporizador
        this.startTimer();
        
        // Actualizar interfaz
        this.updateUI();
        
        // Limpiar mensaje de estado
        document.getElementById('gameStatus').textContent = '';
    }
    
    /**
     * Construye el árbol de soluciones
     */
    buildTree() {
        // Crear estado inicial de las torres
        const initialTowers = [[], [], []];
        for (let i = this.numDisks; i >= 1; i--) {
            initialTowers[0].push(i);
        }
        
        // Construir árbol de soluciones (limitado a 3 discos para evitar árboles muy grandes)
        const effectiveDisks = Math.min(this.numDisks, 3);
        this.solutionTree = buildSolutionTree(effectiveDisks, 0, 1, 2, 0, null, initialTowers);
        
        // Visualizar el árbol
        const treeVisualizer = new TreeVisualizer('treeCanvas');
        treeVisualizer.drawTree(this.solutionTree);
    }
    
    /**
     * Inicia el temporizador del juego
     */
    startTimer() {
        // Detener temporizador existente si hay uno
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }
        
        this.startTime = new Date();
        
        this.timerInterval = setInterval(() => {
            const currentTime = new Date();
            const elapsedTime = new Date(currentTime - this.startTime);
            const minutes = String(elapsedTime.getMinutes()).padStart(2, '0');
            const seconds = String(elapsedTime.getSeconds()).padStart(2, '0');
            
            document.getElementById('timer').textContent = `${minutes}:${seconds}`;
        }, 1000);
    }
    
    /**
     * Detiene el temporizador del juego
     */
    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }
    
    /**
     * Maneja la selección de una torre
     * @param {Number} towerIndex - Índice de la torre seleccionada (0, 1, 2)
     */
    selectTower(towerIndex) {
        // Si el juego ha terminado o está en modo solución, no permitir movimientos
        if (this.isGameOver || this.solutionMode) return;
        
        // Si no hay torre seleccionada previamente, seleccionar esta
        if (this.selectedTower === null) {
            // Verificar que la torre tenga discos
            if (this.towers[towerIndex].length === 0) return;
            
            this.selectedTower = towerIndex;
            this.updateUI();
        } else {
            // Ya hay una torre seleccionada, intentar mover
            this.moveDisk(this.selectedTower, towerIndex);
            this.selectedTower = null;
            this.updateUI();
        }
    }
    
    /**
     * Intenta mover un disco de una torre a otra
     * @param {Number} fromTower - Índice de la torre de origen
     * @param {Number} toTower - Índice de la torre de destino
     * @returns {Boolean} - True si el movimiento fue válido, false en caso contrario
     */
    moveDisk(fromTower, toTower) {
        // Verificar que las torres sean diferentes
        if (fromTower === toTower) return false;
        
        // Verificar que haya discos en la torre de origen
        if (this.towers[fromTower].length === 0) return false;
        
        const diskToMove = this.towers[fromTower][this.towers[fromTower].length - 1];
        
        // Verificar que el movimiento sea válido (disco más pequeño encima)
        if (this.towers[toTower].length > 0 && 
            this.towers[toTower][this.towers[toTower].length - 1] < diskToMove) {
            // Movimiento inválido - mostrar animación de error
            const towerElement = document.getElementById(`tower${fromTower}`);
            towerElement.classList.add('invalid-move');
            setTimeout(() => {
                towerElement.classList.remove('invalid-move');
            }, 500);
            return false;
        }
        
        // Realizar el movimiento
        const disk = this.towers[fromTower].pop();
        this.towers[toTower].push(disk);
        this.moveCount++;
        
        // Actualizar contador de movimientos
        document.getElementById('moveCount').textContent = this.moveCount;
        
        // Verificar si el juego ha terminado
        this.checkGameOver();
        
        return true;
    }
    
    /**
     * Verifica si el juego ha terminado (todos los discos en la última torre)
     */
    checkGameOver() {
        if (this.towers[2].length === this.numDisks) {
            this.isGameOver = true;
            this.stopTimer();
            
            // Mostrar mensaje de victoria
            const gameStatus = document.getElementById('gameStatus');
            gameStatus.textContent = '¡Felicidades! Has completado el puzzle.';
            gameStatus.classList.add('celebrate');
            
            // Mostrar estadísticas
            const minMoves = Math.pow(2, this.numDisks) - 1;
            const efficiency = Math.round((minMoves / this.moveCount) * 100);
            
            setTimeout(() => {
                alert(`¡Felicidades! Has completado el puzzle en ${this.moveCount} movimientos.\n` +
                      `Movimientos mínimos posibles: ${minMoves}\n` +
                      `Eficiencia: ${efficiency}%`);
            }, 500);
        }
    }
    
    /**
     * Muestra la solución paso a paso
     */
    showSolution() {
        // Si ya está en modo solución o el juego ha terminado, no hacer nada
        if (this.solutionMode || this.isGameOver) return;
        
        this.solutionMode = true;
        this.solutionIndex = 0;
        
        // Reiniciar el juego para mostrar la solución desde el principio
        this.init();
        this.solutionMode = true;
        
        // Mostrar el primer movimiento después de un breve retraso
        setTimeout(() => this.showNextMove(), 1000);
    }
    
    /**
     * Muestra el siguiente movimiento de la solución
     */
    showNextMove() {
        if (!this.solutionMode || this.solutionIndex >= this.optimalMoves.length) {
            this.solutionMode = false;
            return;
        }
        
        const [fromTower, toTower] = this.optimalMoves[this.solutionIndex];
        
        // Resaltar torres involucradas
        const fromElement = document.getElementById(`tower${fromTower}`);
        const toElement = document.getElementById(`tower${toTower}`);
        
        fromElement.classList.add('selected');
        setTimeout(() => {
            fromElement.classList.remove('selected');
            toElement.classList.add('selected');
            
            // Realizar el movimiento
            this.moveDisk(fromTower, toTower);
            this.updateUI();
            
            setTimeout(() => {
                toElement.classList.remove('selected');
                
                // Avanzar al siguiente movimiento
                this.solutionIndex++;
                
                // Si hay más movimientos, mostrar el siguiente después de un retraso
                if (this.solutionIndex < this.optimalMoves.length) {
                    setTimeout(() => this.showNextMove(), 1000);
                } else {
                    this.solutionMode = false;
                }
            }, 500);
        }, 500);
    }
    
    /**
     * Actualiza la interfaz de usuario para reflejar el estado actual del juego
     */
    updateUI() {
        // Actualizar la visualización de las torres y discos
        for (let i = 0; i < 3; i++) {
            const disksContainer = document.querySelector(`#tower${i} .disks-container`);
            disksContainer.innerHTML = '';
            
            // Crear elementos para cada disco en la torre
            for (let j = 0; j < this.towers[i].length; j++) {
                const diskValue = this.towers[i][j];
                const diskElement = document.createElement('div');
                diskElement.className = `disk disk-${diskValue}`;
                diskElement.textContent = diskValue;
                disksContainer.appendChild(diskElement);
            }
            
            // Resaltar torre seleccionada
            const towerElement = document.getElementById(`tower${i}`);
            if (i === this.selectedTower) {
                towerElement.classList.add('selected');
            } else {
                towerElement.classList.remove('selected');
            }
        }
    }
}