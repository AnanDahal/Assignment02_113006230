class GameOverScene {
    constructor(game) {
        this.game = game;
        this.score = 0;
        this.timer = 0;
        this.canContinue = false;
    }

    enter(data) {
        this.score = (data && data.score) || 0;
        this.timer = 0;
        this.canContinue = false;
        audio.stopBGM();
        audio.playBGM('gameOver');
        setTimeout(() => { this.canContinue = true; }, 2500);
    }
    exit() { audio.stopBGM(); }

    update(dt) {
        this.timer += dt;
        if (this.canContinue && (Input.wasPressed('Enter') || Input.wasPressed('Space'))) {
            this.game.changeScene('menu');
        }
    }

    draw(ctx) {
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, C.W, C.H);

        const alpha = Math.min(1, this.timer / 1.5);

        ctx.globalAlpha = alpha;
        ctx.fillStyle = '#FF2222';
        ctx.font = 'bold 52px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('GAME OVER', C.W/2, C.H/2 - 30);

        ctx.fillStyle = '#FFD700';
        ctx.font = '22px monospace';
        ctx.fillText(`SCORE: ${String(this.score).padStart(6,'0')}`, C.W/2, C.H/2 + 30);

        if (this.canContinue) {
            const flash = Math.floor(this.timer * 3) % 2 === 0;
            if (flash) {
                ctx.fillStyle = '#FFF';
                ctx.font = '16px monospace';
                ctx.fillText('PRESS ENTER TO CONTINUE', C.W/2, C.H/2 + 80);
            }
        }
        ctx.globalAlpha = 1;
    }
}
