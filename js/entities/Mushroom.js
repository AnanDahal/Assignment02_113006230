class Mushroom {
    constructor(col, row, tileMap) {
        this.map = tileMap;
        this.x = col * C.TILE;
        this.y = row * C.TILE;
        this.w = 16 * C.SCALE;
        this.h = 16 * C.SCALE;
        this.vx = C.MUSHROOM_SPEED;
        this.vy = 0;
        this.onGround = false;
        this.collected = false;
        this.spawning = true;
        this.spawnTimer = 0;
        this.startY = this.y;
    }

    update(dt) {
        if (this.collected) return;

        if (this.spawning) {
            this.spawnTimer += dt * 80;
            this.y = this.startY - Math.min(this.spawnTimer, C.TILE);
            if (this.spawnTimer >= C.TILE) {
                this.spawning = false;
                this.y = this.startY - C.TILE;
            }
            return;
        }

        this.vy += C.GRAVITY;
        if (this.vy > C.MAX_FALL) this.vy = C.MAX_FALL;

        this._moveX();
        this._moveY();
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

    draw(ctx) {
        if (this.collected) return;
        // Try to draw using items sprite sheet (items_79 is mushroom)
        if (sprites.frameExists('items', 'items_42')) {
            sprites.drawFrame(ctx, 'items', 'items_42', this.x, this.y);
        } else {
            // Fallback: draw colored mushroom shape
            ctx.fillStyle = '#FF3333';
            ctx.fillRect(this.x + 4, this.y, this.w - 8, this.h * 0.6);
            ctx.beginPath();
            ctx.arc(this.x + this.w/2, this.y + this.h * 0.4, this.w/2, Math.PI, 0);
            ctx.fillStyle = '#FF3333';
            ctx.fill();
            ctx.fillStyle = '#F5C518';
            ctx.fillRect(this.x + 4, this.y + this.h * 0.55, this.w - 8, this.h * 0.45);
            // Spots
            ctx.fillStyle = '#FFF';
            ctx.fillRect(this.x + 6, this.y + 4, 6, 5);
            ctx.fillRect(this.x + this.w - 12, this.y + 6, 5, 5);
        }
    }
}

class Coin {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.vy = -8;
        this.timer = 0.6;
    }

    update(dt) {
        this.vy += 0.5;
        this.y += this.vy;
        this.timer -= dt;
    }

    isDone() { return this.timer <= 0; }

    draw(ctx) {
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(this.x + C.TILE/2, this.y + C.TILE/2, 6, 0, Math.PI*2);
        ctx.fill();
    }
}

class ScorePopup {
    constructor(x, y, value) {
        this.x = x; this.y = y;
        this.value = value;
        this.timer = 0.8;
    }

    update(dt) {
        this.y -= 1;
        this.timer -= dt;
    }

    isDone() { return this.timer <= 0; }

    draw(ctx) {
        ctx.fillStyle = '#FFF';
        ctx.font = 'bold 14px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.value, this.x, this.y);
    }
}
