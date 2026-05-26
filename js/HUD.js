class HUD {
    constructor() {
        this.lives = 3;
        this.score = 0;
        this.time  = 400;
        this.coins = 0;
        this.world = '1-1';
        this._timeCountdown = 0;
    }

    reset(world, time) {
        this.time = time || 400;
        this._timeCountdown = 1.0;
        this.world = world || '1-1';
    }

    addScore(v) {
        this.score += v;
    }

    addCoin() {
        this.coins++;
        this.score += 200;
        audio.playSFX('coin');
    }

    tick(dt) {
        if (this.time > 0) {
            this._timeCountdown -= dt;
            if (this._timeCountdown <= 0) {
                this._timeCountdown += 1.0;
                this.time--;
            }
        }
    }

    draw(ctx) {
        // Semi-transparent bar
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(0, 0, C.W, 36);

        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 14px "Press Start 2P", monospace';
        ctx.textBaseline = 'top';

        // Mario label
        ctx.textAlign = 'left';
        ctx.fillText('MARIO', 16, 6);
        ctx.fillStyle = '#FFF';
        ctx.fillText(String(this.score).padStart(6, '0'), 16, 20);

        // Coins
        ctx.fillStyle = '#FFD700';
        ctx.textAlign = 'center';
        ctx.fillText('×' + String(this.coins).padStart(2, '0'), C.W/2 - 30, 13);
        // Coin circle
        ctx.beginPath();
        ctx.arc(C.W/2 - 55, 19, 6, 0, Math.PI*2);
        ctx.fillStyle = '#FFD700';
        ctx.fill();

        // World
        ctx.fillStyle = '#FFD700';
        ctx.fillText('WORLD', C.W/2 + 20, 6);
        ctx.fillStyle = '#FFF';
        ctx.fillText(this.world, C.W/2 + 20, 20);

        // Timer
        ctx.fillStyle = '#FFD700';
        ctx.textAlign = 'right';
        ctx.fillText('TIME', C.W - 16, 6);
        ctx.fillStyle = this.time <= 100 ? '#FF4444' : '#FFF';
        ctx.fillText(String(this.time).padStart(3, ' '), C.W - 16, 20);

        // Lives (bottom-left)
        ctx.fillStyle = '#FFF';
        ctx.textAlign = 'left';
        ctx.font = '13px monospace';
        // Life icon
        sprites.drawImage(ctx, 'life', 8, C.H - 26, 18, 18);
        ctx.fillText('× ' + this.lives, 28, C.H - 22);
    }
}
