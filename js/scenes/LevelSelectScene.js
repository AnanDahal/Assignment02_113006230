class LevelSelectScene {
    constructor(game) {
        this.game = game;
        this.selected = 0;
        this.worlds = [
            { name: 'WORLD 1-1', bg: '#5C94FC', desc: 'Classic plains adventure' },
            { name: 'WORLD 1-2', bg: '#1A237E', desc: 'Underground challenges' },
            { name: 'WORLD 1-3', bg: '#5C94FC', desc: 'Sky-high difficulty' },
        ];
    }

    enter() {
        audio.playBGM('bgm1');
    }
    exit() {}

    update(dt) {
        if (Input.wasPressed('ArrowLeft') || Input.wasPressed('ArrowUp')) {
            this.selected = (this.selected - 1 + this.worlds.length) % this.worlds.length;
            audio.playSFX('coin');
        }
        if (Input.wasPressed('ArrowRight') || Input.wasPressed('ArrowDown')) {
            this.selected = (this.selected + 1) % this.worlds.length;
            audio.playSFX('coin');
        }
        if (Input.wasPressed('Enter') || Input.wasPressed('Space')) {
            audio.resumeCtx();
            this.game.startLevel(this.selected + 1);
        }
        if (Input.wasPressed('Escape')) {
            this.game.changeScene('menu');
        }
    }

    draw(ctx) {
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(0, 0, C.W, C.H);

        // Title
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 24px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText('SELECT WORLD', C.W/2, 30);

        // World cards
        const cardW = 200, cardH = 150;
        const startX = (C.W - (cardW + 20) * this.worlds.length + 20) / 2;

        this.worlds.forEach((w, i) => {
            const x = startX + i * (cardW + 20);
            const y = 100;
            const sel = i === this.selected;

            // Card
            ctx.fillStyle = sel ? w.bg : '#0d0d1a';
            ctx.fillRect(x, y, cardW, cardH);
            ctx.strokeStyle = sel ? '#FFD700' : '#444';
            ctx.lineWidth = sel ? 3 : 1;
            ctx.strokeRect(x, y, cardW, cardH);

            // World name
            ctx.fillStyle = sel ? '#FFD700' : '#888';
            ctx.font = `bold ${sel ? 16 : 13}px monospace`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            ctx.fillText(w.name, x + cardW/2, y + 16);

            // Mini level preview
            this._drawMiniLevel(ctx, x + 10, y + 44, cardW - 20, 80, i);

            // Stars / difficulty
            ctx.fillStyle = '#FFD700';
            ctx.font = '12px monospace';
            ctx.fillText('★'.repeat(i + 1), x + cardW/2, y + cardH - 18);

            if (sel) {
                // Animated arrow
                ctx.fillStyle = '#FFD700';
                ctx.font = '20px monospace';
                ctx.fillText('▲', x + cardW/2, y - 22);
            }
        });

        // Description
        ctx.fillStyle = '#FFF';
        ctx.font = '14px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(this.worlds[this.selected].desc, C.W/2, 280);

        ctx.fillStyle = 'rgba(255,255,255,0.6)';
        ctx.font = '11px monospace';
        ctx.fillText('◄► Select   ENTER Start   ESC Back', C.W/2, C.H - 20);
    }

    _drawMiniLevel(ctx, x, y, w, h, levelIdx) {
        ctx.fillStyle = this.worlds[levelIdx].bg;
        ctx.fillRect(x, y, w, h);
        // Ground
        ctx.fillStyle = C.GROUND_FILL;
        ctx.fillRect(x, y + h*0.7, w, h*0.3);
        // Some blocks
        ctx.fillStyle = C.QBLOCK;
        for (let i = 0; i < 3; i++) {
            ctx.fillRect(x + 20 + i*25, y + h*0.4, 12, 12);
        }
        // Pipe
        ctx.fillStyle = C.PIPE;
        ctx.fillRect(x + w*0.6, y + h*0.5, 14, h*0.2);
        // Mario
        sprites.drawFrame(ctx, 'mario_small', 'mario_small_0', x + 8, y + h*0.6 - 16);
    }
}
