/**
 * Clase para visualizar el árbol binario de soluciones
 */
class TreeVisualizer {
    /**
     * Constructor del visualizador
     * @param {String} canvasId - ID del elemento canvas donde se dibujará el árbol
     */
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.nodeRadius = 30;
        this.levelHeight = 80;
        this.highlightedPath = [];
        
        // Ajustar tamaño del canvas
        this.resizeCanvas();
        
        // Manejar redimensionamiento de ventana
        window.addEventListener('resize', () => this.resizeCanvas());
    }
    
    /**
     * Ajusta el tamaño del canvas al contenedor
     */
    resizeCanvas() {
        const container = this.canvas.parentElement;
        this.canvas.width = container.clientWidth;
        this.canvas.height = container.clientHeight;
    }
    
    /**
     * Dibuja el árbol de soluciones
     * @param {TreeNode} root - Nodo raíz del árbol
     * @param {Array} highlightedPath - Camino a resaltar en el árbol
     */
    drawTree(root, highlightedPath = []) {
        this.highlightedPath = highlightedPath;
        
        // Limpiar canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Calcular ancho total del árbol (2^maxDepth - 1) * espaciado horizontal
        const maxDepth = this.getMaxDepth(root);
        const totalWidth = Math.pow(2, maxDepth) * this.nodeRadius * 2;
        
        // Ajustar tamaño del canvas si es necesario
        if (totalWidth > this.canvas.width) {
            this.canvas.width = totalWidth;
        }
        
        // Dibujar el árbol recursivamente
        this.drawNode(root, this.canvas.width / 2, 50, this.canvas.width / 4);
        
        // Dibujar leyenda
        this.drawLegend();
    }
    
    /**
     * Obtiene la profundidad máxima del árbol
     * @param {TreeNode} node - Nodo a evaluar
     * @param {Number} depth - Profundidad actual
     * @returns {Number} - Profundidad máxima
     */
    getMaxDepth(node, depth = 0) {
        if (!node) return depth;
        
        const leftDepth = this.getMaxDepth(node.left, depth + 1);
        const rightDepth = this.getMaxDepth(node.right, depth + 1);
        
        return Math.max(leftDepth, rightDepth);
    }
    
    /**
     * Dibuja un nodo del árbol y sus hijos recursivamente
     * @param {TreeNode} node - Nodo a dibujar
     * @param {Number} x - Posición x del nodo
     * @param {Number} y - Posición y del nodo
     * @param {Number} horizontalSpacing - Espaciado horizontal entre nodos
     */
    drawNode(node, x, y, horizontalSpacing) {
        if (!node) return;
        
        // Dibujar conexiones a los hijos
        if (node.left) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, y);
            this.ctx.lineTo(x - horizontalSpacing, y + this.levelHeight);
            this.ctx.strokeStyle = '#6c757d';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
        }
        
        if (node.right) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, y);
            this.ctx.lineTo(x + horizontalSpacing, y + this.levelHeight);
            this.ctx.strokeStyle = '#6c757d';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
        }
        
        // Dibujar nodo
        this.ctx.beginPath();
        this.ctx.arc(x, y, this.nodeRadius, 0, Math.PI * 2);
        
        // Determinar si el nodo está en el camino resaltado
        const isHighlighted = this.isNodeInPath(node);
        
        if (isHighlighted) {
            this.ctx.fillStyle = '#28a745';
        } else {
            this.ctx.fillStyle = '#007bff';
        }
        
        this.ctx.fill();
        this.ctx.strokeStyle = '#0056b3';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
        
        // Dibujar texto del nodo
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '12px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        
        // Mostrar el movimiento en el nodo
        let nodeText = node.move ? `${node.move[0]}→${node.move[1]}` : 'Inicio';
        this.ctx.fillText(nodeText, x, y);
        
        // Dibujar hijos recursivamente
        if (node.left) {
            this.drawNode(node.left, x - horizontalSpacing, y + this.levelHeight, horizontalSpacing / 2);
        }
        
        if (node.right) {
            this.drawNode(node.right, x + horizontalSpacing, y + this.levelHeight, horizontalSpacing / 2);
        }
    }
    
    /**
     * Verifica si un nodo está en el camino resaltado
     * @param {TreeNode} node - Nodo a verificar
     * @returns {Boolean} - True si el nodo está en el camino resaltado
     */
    isNodeInPath(node) {
        if (!this.highlightedPath || this.highlightedPath.length === 0) return false;
        
        return this.highlightedPath.some(pathNode => {
            return JSON.stringify(pathNode.move) === JSON.stringify(node.move) && 
                   pathNode.depth === node.depth;
        });
    }
    
    /**
     * Dibuja una leyenda para el árbol
     */
    drawLegend() {
        const legendX = 20;
        const legendY = this.canvas.height - 60;
        
        // Nodo normal
        this.ctx.beginPath();
        this.ctx.arc(legendX + 15, legendY, 10, 0, Math.PI * 2);
        this.ctx.fillStyle = '#007bff';
        this.ctx.fill();
        this.ctx.strokeStyle = '#0056b3';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
        
        this.ctx.fillStyle = '#000000';
        this.ctx.font = '14px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText('Nodo normal', legendX + 30, legendY);
        
        // Nodo en el camino actual
        this.ctx.beginPath();
        this.ctx.arc(legendX + 15, legendY + 30, 10, 0, Math.PI * 2);
        this.ctx.fillStyle = '#28a745';
        this.ctx.fill();
        this.ctx.strokeStyle = '#0056b3';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
        
        this.ctx.fillStyle = '#000000';
        this.ctx.fillText('Camino actual', legendX + 30, legendY + 30);
    }
}