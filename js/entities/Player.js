class Player {
    constructor(tileMap) {
        this.map = tileMap;
        this.reset();
    }

    reset() {
        this.x = 0; this.y = 0;
        this.vx = 0; this.vy = 0;
        this.w = C.TILE; this.h = C.TILE;
        this.onGround = false;
        this.facingRight = true;
        this.state = 'idle';  // idle walk jump die grow shrink
        this.big = false;
        this.invincible = false;
        this.invTimer = 0;
        this.alive = true;
        this.dieTimer = 0;

        this.animTimer = 0;
        this.animFrame = 0;
        // All frames from row 0 (y=1) of the sprite sheet – same color palette
        this.walkFrames  = ['mario_small_8', 'mario_small_15', 'mario_small_18'];
        this.idleFrame   = 'mario_small_11';
        this.jumpFrame   = 'mario_small_25';
        this.dieFrame    = 'mario_small_7';
        this.skidFrame   = 'mario_small_22';

        this.bigWalkFrames = ['mario_big_1', 'mario_big_2', 'mario_big_4'];
        this.bigIdleFrame  = 'mario_big_0';
        this.bigJumpFrame  = 'mario_big_25';
        this.bigDuckFrame  = 'mario_big_14';
    }

    spawn(col, row) {
        this.x = col * C.TILE;
        this.y = row * C.TILE;
        this.vx = 0; this.vy = 0;
        this.onGround = false;
        this.alive = true;
        this.state = 'idle';
        this.dieTimer = 0;
    }

    get bigH() { return this.big ? C.TILE * 2 : C.TILE; }

    update(dt) {
        if (!this.alive) {
            this.dieTimer += dt;
            if (this.dieTimer < 0.4) {
                this.vy -= 0.8;  // brief upward bounce on die
            } else {
                this.vy += C.GRAVITY * 2;
            }
            this.y += this.vy;
            return;
        }

        if (this.state === 'grow' || this.state === 'shrink') {
            this.animTimer += dt;
            if (this.animTimer > 0.6) {
                this.state = 'idle';
                this.w = C.TILE;
                this.h = this.bigH;
            }
            return;
        }

        // Invincibility
        if (this.invincible) {
            this.invTimer -= dt;
            if (this.invTimer <= 0) this.invincible = false;
        }

        const run = Input.run();
        const maxSpeed = run ? C.RUN_SPEED : C.WALK_SPEED;

        // Horizontal input
        if (Input.left()) {
            this.vx -= 0.8;
            this.facingRight = false;
            if (this.vx < -maxSpeed) this.vx = -maxSpeed;
        } else if (Input.right()) {
            this.vx += 0.8;
            this.facingRight = true;
            if (this.vx > maxSpeed) this.vx = maxSpeed;
        } else {
            // Decelerate
            this.vx *= 0.8;
            if (Math.abs(this.vx) < 0.1) this.vx = 0;
        }

        // Jump
        if (Input.jumpPressed() && this.onGround) {
            this.vy = C.JUMP_VEL;
            this.onGround = false;
            audio.playSFX('jump');
        }

        // Gravity
        this.vy += C.GRAVITY;
        if (this.vy > C.MAX_FALL) this.vy = C.MAX_FALL;

        // Move and collide
        this._moveX();
        this._moveY();

        // Determine animation state
        const pressing = Input.left() || Input.right();
        if (!this.onGround) {
            this.state = 'jump';
        } else if (pressing && Math.abs(this.vx) > 0.2) {
            // Check if skidding (moving opposite to input)
            if ((this.vx > 0 && Input.left()) || (this.vx < 0 && Input.right())) {
                this.state = 'skid';
            } else {
                this.state = 'walk';
            }
        } else {
            this.state = 'idle';
        }

        // Animate walk
        if (this.state === 'walk') {
            this.animTimer += dt * Math.abs(this.vx) * 8;
            this.animFrame = Math.floor(this.animTimer) % 3;
        } else {
            this.animFrame = 0;
        }
    }

    _moveX() {
        this.x += this.vx;
        const T = C.TILE;
        const h = this.bigH;
        const left  = Math.floor(this.x / T);
        const right = Math.floor((this.x + this.w - 1) / T);
        const top   = Math.floor(this.y / T);
        const bot   = Math.floor((this.y + h - 1) / T);

        if (this.vx < 0) {
            for (let r = top; r <= bot; r++) {
                if (this.map.isSolid(this.map.get(left, r))) {
                    this.x = (left + 1) * T;
                    this.vx = 0;
                    break;
                }
            }
        } else if (this.vx > 0) {
            for (let r = top; r <= bot; r++) {
                if (this.map.isSolid(this.map.get(right, r))) {
                    this.x = right * T - this.w;
                    this.vx = 0;
                    break;
                }
            }
        }
        // Don't go left of level
        if (this.x < 0) { this.x = 0; this.vx = 0; }
    }

    _moveY() {
        this.y += this.vy;
        const T = C.TILE;
        const h = this.bigH;
        const left  = Math.floor(this.x / T);
        const right = Math.floor((this.x + this.w - 1) / T);
        const topRow = Math.floor(this.y / T);
        const botRow = Math.floor((this.y + h - 1) / T);

        if (this.vy < 0) {
            // Moving up – check ceiling
            this.onGround = false;
            for (let c = left; c <= right; c++) {
                const tile = this.map.get(c, topRow);
                if (this.map.isSolid(tile)) {
                    this.y = (topRow + 1) * T;
                    this.vy = 0;
                    // Trigger block hit
                    if (tile === C.T_QBLOCK) {
                        window._game && window._game.scene && window._game.scene.hitBlock && window._game.scene.hitBlock(c, topRow);
                    }
                    if (tile === C.T_BRICK && this.big) {
                        window._game && window._game.scene && window._game.scene.breakBrick && window._game.scene.breakBrick(c, topRow);
                    }
                    break;
                }
            }
        } else if (this.vy >= 0) {
            // Moving down – check floor
            for (let c = left; c <= right; c++) {
                if (this.map.isSolid(this.map.get(c, botRow))) {
                    this.y = botRow * T - h;
                    this.vy = 0;
                    this.onGround = true;
                    break;
                }
            }
        }
    }

    hurt() {
        if (this.invincible) return;
        if (this.big) {
            this.big = false;
            this.h = C.TILE;
            this.y += C.TILE;  // shift down since got smaller
            this.invincible = true;
            this.invTimer = 2.0;
            this.state = 'shrink';
            this.animTimer = 0;
            audio.playSFX('powerDown');
        } else {
            this.die();
        }
    }

    die() {
        if (this.alive) {
            this.alive = false;
            this.vy = C.JUMP_VEL * 0.8;
            this.vx = 0;
            this.dieTimer = 0;
            audio.stopBGM();
            audio.playSFX('loseLife');
        }
    }

    grow() {
        if (!this.big) {
            this.big = true;
            this.y -= C.TILE; // expand upward
            this.h = C.TILE * 2;
            this.state = 'grow';
            this.animTimer = 0;
            audio.playSFX('powerUp');
        }
    }

    get bottom() { return this.y + this.bigH; }
    get right()  { return this.x + this.w; }
    get centerX(){ return this.x + this.w / 2; }

    draw(ctx) {
        if (!this.alive) {
            const sheet = this.big ? 'mario_big' : 'mario_small';
            sprites.drawFrame(ctx, sheet, this.dieFrame, this.x, this.y, !this.facingRight);
            return;
        }

        // Blinking during invincibility
        if (this.invincible && Math.floor(this.invTimer * 10) % 2 === 0) return;

        const sheet = this.big ? 'mario_big' : 'mario_small';
        let frameName;

        if (this.state === 'jump') {
            frameName = this.big ? this.bigJumpFrame : this.jumpFrame;
        } else if (this.state === 'skid') {
            frameName = this.big ? 'mario_big_5' : this.skidFrame;
        } else if (this.state === 'walk') {
            const frames = this.big ? this.bigWalkFrames : this.walkFrames;
            frameName = frames[this.animFrame];
        } else if (this.state === 'grow' || this.state === 'shrink') {
            frameName = this.big ? this.bigIdleFrame : this.idleFrame;
        } else {
            frameName = this.big ? this.bigIdleFrame : this.idleFrame;
        }

        // Fallback if frame doesn't exist
        if (!sprites.frameExists(sheet, frameName)) {
            frameName = this.big ? 'mario_big_0' : 'mario_small_0';
        }
        if (!sprites.frameExists(sheet, frameName)) {
            // Draw colored rect as ultimate fallback
            ctx.fillStyle = '#D40000';
            ctx.fillRect(this.x, this.y, this.w, this.bigH);
            return;
        }

        sprites.drawFrame(ctx, sheet, frameName, this.x, this.y, !this.facingRight);
    }
}
