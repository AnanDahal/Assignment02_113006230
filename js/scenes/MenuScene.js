class MenuScene {
    constructor(game) {
        this.game = game;
        this.selected = 0;
        this.buttons = ['START GAME', 'LEADERBOARD', 'LOGIN'];
        this.leaderboard = [];
        this.showLB = false;
        this.animTimer = 0;
        this.marioX = 50;
    }

    enter() {
        audio.playBGM('bgm1');
        this.showLB = false;
        fbManager.getLeaderboard().then(lb => { this.leaderboard = lb; });
    }

    exit() {}

    update(dt) {
        this.animTimer += dt;
        this.marioX = 50 + Math.sin(this.animTimer) * 10;

        if (this.showLB) {
            if (Input.wasPressed('Escape') || Input.wasPressed('KeyB')) {
                this.showLB = false;
            }
            return;
        }

        if (Input.wasPressed('ArrowUp')) {
            this.selected = (this.selected - 1 + this.buttons.length) % this.buttons.length;
            audio.playSFX('coin');
        }
        if (Input.wasPressed('ArrowDown')) {
            this.selected = (this.selected + 1) % this.buttons.length;
            audio.playSFX('coin');
        }
        if (Input.wasPressed('Enter') || Input.wasPressed('Space')) {
            audio.resumeCtx();
            if (this.selected === 0) {
                this.game.changeScene('levelSelect');
            } else if (this.selected === 1) {
                this.showLB = true;
                fbManager.getLeaderboard().then(lb => { this.leaderboard = lb; });
            } else {
                showAuthModal();
            }
        }
    }

    draw(ctx) {
        // Background
        ctx.drawImage(sprites.images['menu_bg'] || document.createElement('canvas'),
                      0, 0, C.W, C.H);
        // Sky fallback
        if (!sprites.images['menu_bg'] || !sprites.images['menu_bg'].complete) {
            ctx.fillStyle = C.SKY;
            ctx.fillRect(0, 0, C.W, C.H);
            this._drawClouds(ctx);
        }

        // Title
        const titleImg = sprites.images['title_1'];
        if (titleImg && titleImg.complete && titleImg.naturalWidth > 0) {
            const tw = Math.min(450, titleImg.naturalWidth * 2);
            const th = tw * titleImg.naturalHeight / titleImg.naturalWidth;
            ctx.drawImage(titleImg, (C.W - tw) / 2, 60, tw, th);
        } else {
            // Text title
            ctx.fillStyle = '#FFD700';
            ctx.font = 'bold 48px monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.shadowColor = '#000';
            ctx.shadowBlur = 4;
            ctx.fillText('SUPER MARIO', C.W/2, 110);
            ctx.shadowBlur = 0;
        }

        if (this.showLB) {
            this._drawLeaderboard(ctx);
            return;
        }

        // Animated Mario character
        sprites.drawFrame(ctx, 'mario_small', 'mario_small_1', this.marioX, C.H - 80);

        // Buttons
        this.buttons.forEach((btn, i) => {
            const y = 240 + i * 50;
            const sel = i === this.selected;
            ctx.fillStyle = sel ? '#FFD700' : 'rgba(0,0,0,0.6)';
            ctx.fillRect(C.W/2 - 120, y - 16, 240, 36);
            ctx.strokeStyle = sel ? '#FFD700' : '#888';
            ctx.lineWidth = 2;
            ctx.strokeRect(C.W/2 - 120, y - 16, 240, 36);
            ctx.fillStyle = sel ? '#000' : '#FFF';
            ctx.font = `bold ${sel ? 16 : 14}px monospace`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(btn, C.W/2, y + 2);
        });

        // Arrow pointer
        ctx.fillStyle = '#FF4444';
        ctx.font = '18px monospace';
        ctx.textAlign = 'right';
        ctx.fillText('▶', C.W/2 - 126, 256 + this.selected * 50);

        // Controls hint
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        ctx.font = '11px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('↑↓ Navigate  ENTER Select', C.W/2, C.H - 16);
    }

    _drawClouds(ctx) {
        const cx = (this.animTimer * 20) % (C.W + 200);
        ctx.fillStyle = 'rgba(255,255,255,0.8)';
        [[cx - 200, 60], [cx + 100, 30], [cx + 350, 80]].forEach(([x, y]) => {
            ctx.beginPath();
            ctx.arc(x, y, 30, 0, Math.PI*2); ctx.arc(x+30, y-10, 22, 0, Math.PI*2);
            ctx.arc(x+55, y, 25, 0, Math.PI*2); ctx.fill();
        });
    }

    _drawLeaderboard(ctx) {
        ctx.fillStyle = 'rgba(0,0,0,0.85)';
        ctx.fillRect(C.W/2 - 200, 80, 400, 320);
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 3;
        ctx.strokeRect(C.W/2 - 200, 80, 400, 320);

        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 18px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText('LEADERBOARD', C.W/2, 96);

        ctx.fillStyle = '#FFF';
        ctx.font = '13px monospace';
        if (this.leaderboard.length === 0) {
            ctx.fillText('No scores yet!', C.W/2, 150);
        } else {
            this.leaderboard.forEach((entry, i) => {
                const y = 130 + i * 24;
                ctx.textAlign = 'left';
                ctx.fillText(`${i+1}. ${(entry.email||'?').substring(0,15)}`, C.W/2 - 180, y);
                ctx.textAlign = 'right';
                ctx.fillText(String(entry.score||0).padStart(6,'0'), C.W/2 + 180, y);
            });
        }
        ctx.fillStyle = '#888';
        ctx.textAlign = 'center';
        ctx.fillText('[ESC / B] Back', C.W/2, 372);
    }
}
