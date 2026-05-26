window.addEventListener('DOMContentLoaded', async () => {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');

    // Loading screen
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, C.W, C.H);
    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 20px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('LOADING...', C.W/2, C.H/2);

    // Load audio (non-blocking – game still works if audio fails)
    audio.loadAll().catch(e => console.warn('Audio load error:', e));

    // Load all visual assets
    try {
        await loadAllAssets();
    } catch(e) {
        console.warn('Asset load error:', e);
    }

    // Update loading display
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, C.W, C.H);
    ctx.fillStyle = '#00FF00';
    ctx.fillText('READY!', C.W/2, C.H/2);

    // Small delay so "READY!" is visible
    await new Promise(r => setTimeout(r, 300));

    // Start game
    const game = new Game(canvas);
    window._game = game;
    game.init();
    game.start();
});
