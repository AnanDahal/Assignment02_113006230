class GameScene {
    constructor(game) {
        this.game = game;
        this.levelNum = 1;
        this.hud = new HUD();
        this.camera = new Camera();
        this.player = null;
        this.tileMap = null;
        this.enemies = [];
        this.mushrooms = [];
        this.coins = [];
        this.popups = [];
        this.questionBlocks = [];
        this.flagReached = false;
        this.flagTimer = 0;
        this.paused = false;
        this.deathPending = false;
        this.deathTimer = 0;
        this.introTimer = 2.5;
        this.introActive = true;
        this.flagPoleY = 0;
        this.flagSlideY = 0;
        this.levelData = null;
    }

    enter(levelNum, hud) {
        this.levelNum = levelNum || 1;
        if (hud) {
            this.hud = hud;
        } else {
            this.hud.lives = 3;
            this.hud.score = 0;
            this.hud.coins = 0;
        }
        this._initLevel();
    }

    _initLevel() {
        this.levelData = buildLevel(this.levelNum);
        this.tileMap = new TileMap(this.levelData.grid, this.levelData.mushroomBlocks);

        const T = C.TILE;
        this.camera.setLevelWidth(this.levelData.width * T);

        this.player = new Player(this.tileMap);
        this.player.spawn(this.levelData.spawnCol, this.levelData.spawnRow);

        this.enemies = this.levelData.enemies.map(e => {
            const col = e.col, row = e.row;
            if (e.type === 'turtle') return new Turtle(col, row, this.tileMap);
            return new Goomba(col, row, this.tileMap);
        });

        this.mushrooms = [];
        this.coins = [];
        this.popups = [];

        // Build question block list
        this.questionBlocks = [];
        const mushroomSet = new Set(this.levelData.mushroomBlocks);
        for (let r = 0; r < this.levelData.height; r++) {
            for (let c = 0; c < this.levelData.width; c++) {
                if (this.tileMap.grid[r][c] === C.T_QBLOCK) {
                    this.questionBlocks.push(new QuestionBlock(c, r, mushroomSet.has(c)));
                }
            }
        }

        this.flagReached = false;
        this.flagTimer = 0;
        this.flagPoleX = this.levelData.flagCol * T;
        this.flagPoleY = 0;
        this.flagSlideY = 0;
        this.paused = false;
        this.deathPending = false;
        this.deathTimer = 0;
        this.introActive = true;
        this.introTimer = 2.5;

        this.hud.reset(`${this.levelNum}-1`);
        audio.playBGM(this.levelData.bgm);

        // Expose for player's hit callbacks
        window._game = this.game;
        this.game.scene = this;
    }

    update(dt) {
        if (this.introActive) {
            this.introTimer -= dt;
            if (this.introTimer <= 0) this.introActive = false;
            return;
        }

        if (this.paused) {
            if (Input.wasPressed('Escape') || Input.wasPressed('KeyP')) this.paused = false;
            return;
        }

        if (Input.wasPressed('Escape') || Input.wasPressed('KeyP')) {
            this.paused = true;
            return;
        }

        if (this.flagReached) {
            this.flagTimer += dt;
            this.flagSlideY = Math.min(this.flagSlideY + 3, 300);
            if (this.flagTimer > 3) {
                fbManager.saveScore(this.hud.score, this.levelNum);
                if (this.levelNum < 3) {
                    this.game.changeScene('levelClear', { hud: this.hud, nextLevel: this.levelNum + 1 });
                } else {
                    this.game.changeScene('levelClear', { hud: this.hud, nextLevel: 0 });
                }
            }
            return;
        }

        if (this.deathPending) {
            this.deathTimer -= dt;
            this.player.update(dt);
            if (this.deathTimer <= 0) {
                this.hud.lives--;
                if (this.hud.lives <= 0) {
                    fbManager.saveScore(this.hud.score, this.levelNum);
                    this.game.changeScene('gameOver', { score: this.hud.score });
                } else {
                    this._respawn();
                }
            }
            return;
        }

        // Timer
        this.hud.tick(dt);
        if (this.hud.time <= 0) {
            this.player.die();
            this._triggerDeath();
            return;
        }

        // Update player
        this.player.update(dt);

        // Check out of bounds (fell into pit)
        if (this.player.y > this.levelData.height * C.TILE + 100) {
            this.player.die();
            this._triggerDeath();
        }

        // Death check
        if (!this.player.alive && !this.deathPending) {
            this._triggerDeath();
        }

        // Activate enemies near player
        const activationRange = C.W + 100;
        this.enemies.forEach(e => {
            if (!e.active && Math.abs(e.x - this.player.x) < activationRange) e.active = true;
            if (e.active) e.update(dt);
        });

        // Player-enemy collisions
        this._checkEnemyCollisions();

        // Mushroom updates & collection
        this.mushrooms = this.mushrooms.filter(m => !m.collected);
        this.mushrooms.forEach(m => {
            m.update(dt);
            if (this._overlaps(this.player, m)) {
                m.collected = true;
                this.player.grow();
                this.hud.addScore(1000);
                this.popups.push(new ScorePopup(m.x, m.y, 1000));
            }
        });

        // Coins
        this.coins = this.coins.filter(c => !c.isDone());
        this.coins.forEach(c => c.update(dt));

        // Popups
        this.popups = this.popups.filter(p => !p.isDone());
        this.popups.forEach(p => p.update(dt));

        // Question block animations
        this.questionBlocks.forEach(qb => qb.update(dt));

        // Check flag
        const px = this.player.x + this.player.w/2;
        if (px >= this.flagPoleX - 16 && !this.flagReached) {
            this.flagReached = true;
            this.player.vx = 0;
            this.hud.addScore(1000 + this.hud.time * 50);
            audio.stopBGM();
            audio.playSFX('levelClear');
        }

        // Camera follows player
        this.camera.follow(this.player);
    }

    _triggerDeath() {
        this.deathPending = true;
        this.deathTimer = 2.5;
    }

    _respawn() {
        this.deathPending = false;
        this.deathTimer = 0;
        // Reset enemies that are off screen
        this._initLevel();
        this.hud.lives = Math.max(0, this.hud.lives);
    }

    hitBlock(col, row) {
        const qb = this.questionBlocks.find(b => b.col === col && b.row === row);
        if (qb) {
            const result = qb.triggerHit();
            if (result === 'coin') {
                this.hud.addCoin();
                this.coins.push(new Coin(col * C.TILE, row * C.TILE));
                this.hud.addScore(200);
            } else if (result === 'mushroom') {
                this.mushrooms.push(new Mushroom(col, row - 1, this.tileMap));
                audio.playSFX('powerUpAppear');
            }
            this.tileMap.set(col, row, C.T_QUSED);
            if (qb) qb.hit = true;
        }
    }

    breakBrick(col, row) {
        this.tileMap.set(col, row, C.T_AIR);
        audio.playSFX('kick');
        this.hud.addScore(50);
    }

    _checkEnemyCollisions() {
        const p = this.player;
        if (!p.alive || p.invincible) return;

        this.enemies.forEach(e => {
            if (!e.alive) return;
            if (!this._overlaps(p, e)) return;

            // Check if stomping (player falling onto top of enemy)
            const playerBottom = p.y + p.bigH;
            const enemyTop = e.y;
            const stompThreshold = 8;

            if (p.vy > 0 && playerBottom <= enemyTop + stompThreshold) {
                e.stomp();
                p.vy = C.JUMP_VEL * 0.6;  // bounce
                this.hud.addScore(100);
                this.popups.push(new ScorePopup(e.x, e.y - 10, 100));
            } else {
                p.hurt();
            }
        });
    }

    _overlaps(a, b) {
        const aH = a.bigH !== undefined ? a.bigH : a.h;
        const bH = b.h;
        return a.x < b.x + b.w && a.x + a.w > b.x &&
               a.y < b.y + bH  && a.y + aH  > b.y;
    }

    draw(ctx) {
        // Sky background
        ctx.fillStyle = C.SKY;
        ctx.fillRect(0, 0, C.W, C.H);

        // Clouds (parallax)
        this._drawClouds(ctx);

        this.camera.begin(ctx);

        // Tilemap
        this.tileMap.draw(ctx, this.camera);

        // Flag pole
        this._drawFlag(ctx);

        // Items
        this.coins.forEach(c => c.draw(ctx));
        this.mushrooms.forEach(m => m.draw(ctx));

        // Enemies
        this.enemies.forEach(e => {
            if (e.alive || e.squished) e.draw(ctx);
        });

        // Player
        this.player.draw(ctx);

        // Score popups
        this.popups.forEach(p => p.draw(ctx));

        this.camera.end(ctx);

        // HUD (screen space)
        this.hud.draw(ctx);

        // Pause overlay
        if (this.paused) this._drawPause(ctx);

        // Intro banner
        if (this.introActive) this._drawIntro(ctx);
    }

    _drawClouds(ctx) {
        const offset = this.camera.x * 0.3;
        ctx.fillStyle = 'rgba(255,255,255,0.85)';
        [[200 - offset % 500, 55], [450 - offset % 500, 35], [700 - offset % 500, 60],
         [950 - offset % 500, 45], [1150 - offset % 500, 65]].forEach(([x, y]) => {
            ctx.beginPath();
            ctx.arc(x, y, 28, 0, Math.PI*2);
            ctx.arc(x+28, y-8, 20, 0, Math.PI*2);
            ctx.arc(x+50, y, 22, 0, Math.PI*2);
            ctx.fill();
        });
    }

    _drawFlag(ctx) {
        const T = C.TILE;
        const px = this.flagPoleX;
        const poleH = 8 * T;
        const baseY = 12 * T;

        // Pole
        ctx.fillStyle = '#999';
        ctx.fillRect(px, baseY - poleH, 4, poleH);

        // Flag
        ctx.fillStyle = '#00AA00';
        ctx.fillRect(px + 4, baseY - poleH + this.flagSlideY, 30, 20);
        ctx.fillStyle = '#008800';
        ctx.fillRect(px + 4, baseY - poleH + this.flagSlideY, 30, 4);
    }

    _drawPause(ctx) {
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(0, 0, C.W, C.H);
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 36px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('PAUSED', C.W/2, C.H/2);
        ctx.font = '16px monospace';
        ctx.fillStyle = '#FFF';
        ctx.fillText('[ESC / P] Resume', C.W/2, C.H/2 + 40);
    }

    _drawIntro(ctx) {
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(C.W/2 - 160, C.H/2 - 50, 320, 100);
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 3;
        ctx.strokeRect(C.W/2 - 160, C.H/2 - 50, 320, 100);
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 20px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`WORLD ${this.levelNum}-1`, C.W/2, C.H/2 - 15);
        ctx.fillStyle = '#FFF';
        ctx.font = '14px monospace';
        ctx.fillText(`Lives: ${this.hud.lives}`, C.W/2, C.H/2 + 15);
    }
}
