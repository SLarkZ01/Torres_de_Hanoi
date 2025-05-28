/**
 * Clase que representa un nodo en el árbol binario de soluciones para Torres de Hanoi
 */
class TreeNode {
    /**
     * Constructor para crear un nuevo nodo del árbol
     * @param {Array} towers - Estado actual de las torres (array de arrays)
     * @param {Array} move - Movimiento que llevó a este estado [fromTower, toTower]
     * @param {Number} depth - Profundidad en el árbol (número de movimientos)
     */
    constructor(towers, move, depth) {
        this.towers = JSON.parse(JSON.stringify(towers)); // Copia profunda del estado de las torres
        this.move = move;     // Movimiento que llevó a este estado [fromTower, toTower]
        this.depth = depth;   // Profundidad en el árbol (número de movimientos)
        this.left = null;     // Hijo izquierdo (siguiente movimiento alternativo 1)
        this.right = null;    // Hijo derecho (siguiente movimiento alternativo 2)
    }

    /**
     * Crea una representación en cadena del nodo
     * @returns {String} - Representación del nodo
     */
    toString() {
        let moveStr = this.move ? `${this.move[0]} → ${this.move[1]}` : "Inicio";
        return `Movimiento: ${moveStr}, Profundidad: ${this.depth}`;
    }
}

/**
 * Construye el árbol de soluciones para el problema de Torres de Hanoi
 * @param {Number} n - Número de discos
 * @param {Number} source - Torre de origen (0, 1, 2)
 * @param {Number} auxiliary - Torre auxiliar (0, 1, 2)
 * @param {Number} target - Torre destino (0, 1, 2)
 * @param {Number} depth - Profundidad actual en el árbol
 * @param {Array} move - Movimiento actual [fromTower, toTower]
 * @param {Array} currentTowers - Estado actual de las torres
 * @returns {TreeNode} - Raíz del árbol de soluciones
 */
function buildSolutionTree(n, source, auxiliary, target, depth, move, currentTowers) {
    // Crear una copia del estado actual de las torres
    let towersCopy = JSON.parse(JSON.stringify(currentTowers));
    
    // Crear nodo actual
    const currentNode = new TreeNode(towersCopy, move, depth);
    
    if (n === 0) {
        return currentNode;
    }
    
    if (n === 1) {
        // Simular el movimiento del disco
        if (move && towersCopy[move[0]].length > 0) {
            const disk = towersCopy[move[0]].pop();
            towersCopy[move[1]].push(disk);
        }
        return currentNode;
    }
    
    // Construir subárbol izquierdo - mover n-1 discos de source a auxiliary
    currentNode.left = buildSolutionTree(n-1, source, target, auxiliary, depth+1, [source, auxiliary], towersCopy);
    
    // Simular el movimiento del disco n de source a target
    if (towersCopy[source].length > 0) {
        const disk = towersCopy[source].pop();
        towersCopy[target].push(disk);
    }
    
    // Construir subárbol derecho - mover n-1 discos de auxiliary a target
    currentNode.right = buildSolutionTree(n-1, auxiliary, source, target, depth+1, [auxiliary, target], towersCopy);
    
    return currentNode;
}

/**
 * Genera la secuencia de movimientos óptima para resolver Torres de Hanoi
 * @param {Number} numDisks - Número de discos
 * @returns {Array} - Secuencia de movimientos [fromTower, toTower]
 */
function generateOptimalMoves(numDisks) {
    const moves = [];
    
    function hanoi(n, source, auxiliary, target) {
        if (n === 1) {
            moves.push([source, target]);
            return;
        }
        
        hanoi(n-1, source, target, auxiliary);
        moves.push([source, target]);
        hanoi(n-1, auxiliary, source, target);
    }
    
    hanoi(numDisks, 0, 1, 2);
    return moves;
}