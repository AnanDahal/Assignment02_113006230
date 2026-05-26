class Goomba {
    constructor(col, row, tileMap) {
        this.map = tileMap;
        this.x = col * C.TILE;
        this.y = row * C.TILE;
        this.w = 20 * C.SCALE;  // 20px sprite, 2x scale = 40
        this.h = 24 * C.SCALE;  // 24px sprite, 2x scale = 48
        this.vx = -C.ENEMY_SPEED;
        this.vy = 0;
        this.onGround = false;
        this.alive = true;
        this.squished = false;
        this.squishTimer = 0;
        this.animTimer = 0;
        this.animFrame = 0;
        this.active = false;  // activated when player approaches
    }

    update(dt) {
        if (this.squished) {
            this.squishTimer -= dt;
            return;
        }
        if (!this.alive) return;

        this.vy += C.GRAVITY;
        if (this.vy > C.MAX_FALL) this.vy = C.MAX_FALL;

        this._moveX();
        this._moveY();

        this.animTimer += dt * 6;
        this.animFrame = Math.floor(this.animTimer) % 2;
    }

    _moveX() {
        this.x += this.vx;
        const T = C.TILE;
        const top = Math.floor(this.y / T);
        const bot = Math.floor((this.y + this.h - 1) / T);

        if (this.vx < 0) {
            const left = Math.floor(this.x / T);
            for (let r = top; r <= bot; r++) {
                if (this.map.isSolid(this.map.get(left, r))) {
                    this.x = (left + 1) * T;
                    this.vx = Math.abs(this.vx);
                    break;
                }
            }
        } else {
            const right = Math.floor((this.x + this.w - 1) / T);
            for (let r = top; r <= bot; r++) {
                if (this.map.isSolid(this.map.get(right, r))) {
                    this.x = right * T - this.w;
                    this.vx = -Math.abs(this.vx);
                    break;
                }
            }
        }

        // Turn at edge of platform
        const colBelow = Math.floor((this.vx < 0 ? this.x : this.x + this.w) / T);
        const groundRow = Math.floor((this.y + this.h) / T);
        if (this.onGround && !this.map.isSolid(this.map.get(colBelow, groundRow))) {
            this.vx = -this.vx;
        }
    }

    _moveY() {
        this.y += this.vy;
        const T = C.TILE;
        const left  = Math.floor(this.x / T);
        const right = Math.floor((this.x + this.w - 1) / T);
        const botRow = Math.floor((this.y + this.h - 1) / T);

        this.onGround = false;
        if (this.vy >= 0) {
            for (let c = left; c <= right; c++) {
                if (this.map.isSolid(this.map.get(c, botRow))) {
                    this.y = botRow * T - this.h;
                    this.vy = 0;
                    this.onGround = true;
                    break;
                }
            }
        }
    }

    stomp() {
        this.squished = true;
        this.squishTimer = 0.5;
        this.alive = false;
        audio.playSFX('stomp');
        setTimeout(() => { this.squished = false; }, 500);
    }

    kick() {
        this.alive = false;
        this.squished = false;
        audio.playSFX('kick');
    }

    draw(ctx) {
        if (!this.squished && !this.alive) return;
        const frame = this.squished ? 'Goomba_4' : `Goomba_${this.animFrame}`;
        // Fallback draw
        if (!sprites.frameExists('goomba', frame)) {
            ctx.fillStyle = '#8B4513';
            ctx.fillRect(this.x, this.y, this.w, this.h);
            return;
        }
        sprites.drawFrame(ctx, 'goomba', frame, this.x, this.y);
    }
}

class Turtle extends Goomba {
    constructor(col, row, tileMap) {
        super(col, row, tileMap);
        this.w = 16 * C.SCALE;
        this.h = 24 * C.SCALE;
        this.shell = false;
        this.shellVx = 0;
        this.shellTimer = 0;
    }

    stomp() {
        if (!this.shell) {
            this.shell = true;
            this.vx = 0;
            this.shellTimer = 5;
            audio.playSFX('stomp');
        } else {
            // Kick shell
            this.shellVx = this.vx > 0 ? 8 : -8;
            audio.playSFX('kick');
        }
    }

    update(dt) {
        if (this.shell) {
            this.shellTimer -= dt;
            if (this.shellTimer <= 0 && this.shellVx === 0) {
                this.shell = false;
                this.vx = -C.ENEMY_SPEED;
            }
            if (this.shellVx !== 0) {
                this.vx = this.shellVx;
                super.update(dt);
            }
            return;
        }
        super.update(dt);
    }

    draw(ctx) {
        const frame = this.shell ? 'Turtle_4' : `Turtle_${this.animFrame % 2}`;
        if (!sprites.frameExists('turtle', frame)) {
            ctx.fillStyle = this.shell ? '#228B22' : '#006400';
            ctx.fillRect(this.x, this.y, this.w, this.h);
            return;
        }
        sprites.drawFrame(ctx, 'turtle', frame, this.x, this.y);
    }
}
