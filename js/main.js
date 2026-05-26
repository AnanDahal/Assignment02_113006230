window.addEventListener('DOMContentLoaded', async () => {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');

    function drawLoading(msg) {
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, C.W, C.H);
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 20px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(msg, C.W/2, C.H/2);
        ctx.fillStyle = '#555';
        ctx.font = '11px monospace';
        ctx.fillText('build v5', C.W/2, C.H/2 + 30);
    }

    drawLoading('LOADING...');

    // Load audio (non-blocking)
    audio.loadAll().catch(e => console.warn('Audio load error:', e));

    // Load visual assets with a 6-second timeout so we never hang
    try {
        await Promise.race([
            loadAllAssets(),
            new Promise(resolve => setTimeout(resolve, 6000))
        ]);
    } catch(e) {
        console.warn('Asset load error:', e);
    }

    drawLoading('READY!');
    await new Promise(r => setTimeout(r, 300));

    const game = new Game(canvas);
    window._game = game;
    game.init();
    game.start();
});
