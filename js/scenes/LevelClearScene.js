class LevelClearScene {
    constructor(game) {
        this.game = game;
        this.nextLevel = 0;
        this.hud = null;
        this.timer = 0;
        this.canContinue = false;
    }

    enter(data) {
        this.nextLevel = data.nextLevel || 0;
        this.hud = data.hud || null;
        this.timer = 0;
        this.canContinue = false;
        audio.stopBGM();
        audio.playSFX('levelClear');
        setTimeout(() => { this.canContinue = true; }, 3000);
    }
    exit() {}

    update(dt) {
        this.timer += dt;
        if (this.canContinue && (Input.wasPressed('Enter') || Input.wasPressed('Space'))) {
            if (this.nextLevel > 0) {
                this.game.startLevel(this.nextLevel, this.hud);
            } else {
                this.game.changeScene('menu');
            }
        }
    }

    draw(ctx) {
        // Sky background
        ctx.fillStyle = C.SKY;
        ctx.fillRect(0, 0, C.W, C.H);

        const a = Math.min(1, this.timer / 1.0);
        ctx.globalAlpha = a;

        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 36px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('COURSE CLEAR!', C.W/2, C.H/2 - 60);

        if (this.hud) {
            ctx.fillStyle = '#FFF';
            ctx.font = '20px monospace';
            ctx.fillText(`SCORE: ${String(this.hud.score).padStart(6,'0')}`, C.W/2, C.H/2);
        }

        if (this.nextLevel > 0) {
            ctx.fillStyle = '#FFF';
            ctx.font = '16px monospace';
            ctx.fillText(`WORLD ${this.nextLevel}-1 UP NEXT`, C.W/2, C.H/2 + 40);
        } else {
            ctx.fillStyle = '#FFD700';
            ctx.font = '20px monospace';
            ctx.fillText('YOU WIN!  THANK YOU!', C.W/2, C.H/2 + 40);
        }

        if (this.canContinue) {
            const flash = Math.floor(this.timer * 3) % 2 === 0;
            if (flash) {
                ctx.fillStyle = '#FFF';
                ctx.font = '14px monospace';
                ctx.fillText('PRESS ENTER TO CONTINUE', C.W/2, C.H/2 + 90);
            }
        }
        ctx.globalAlpha = 1;
    }
}
