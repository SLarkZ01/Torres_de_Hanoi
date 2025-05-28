const bgMenuMusic = document.getElementById('bgMenuMusic');
bgMenuMusic.volume = 0.5;
function tryPlayMenuMusic() {
    bgMenuMusic.play().catch(() => { });
}
document.addEventListener('DOMContentLoaded', tryPlayMenuMusic);
document.addEventListener('click', tryPlayMenuMusic, { once: true });
document.addEventListener('keydown', tryPlayMenuMusic, { once: true });
bgMenuMusic.addEventListener('ended', function () {
    this.currentTime = 0;
    this.play();
});
window.addEventListener('DOMContentLoaded', () => {
    bgMenuMusic.play().catch(() => { });
});