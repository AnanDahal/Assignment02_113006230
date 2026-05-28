// ===== js\Constants.js =====
const C = {
    W: 800, H: 450,
    TILE: 32,
    SCALE: 2,
    GRAVITY: 0.35,
    MAX_FALL: 11,
    WALK_SPEED: 2.2,
    RUN_SPEED: 3.8,
    JUMP_VEL: -9.5,
    ENEMY_SPEED: 1.5,
    MUSHROOM_SPEED: 2.0,
    // Tile types
    T_AIR: 0,
    T_GROUND: 1,
    T_BRICK: 2,
    T_QBLOCK: 3,
    T_QUSED: 4,
    T_SOLID: 5,
    T_PIPE_TL: 6, T_PIPE_TR: 7,
    T_PIPE_BL: 8, T_PIPE_BR: 9,
    T_COIN: 10,
    T_STAIR: 11,
    T_CASTLE: 12,
    T_INVISIBLE: 13,
    // Game states
    STATE_MENU: 'menu',
    STATE_LEVEL_SELECT: 'levelSelect',
    STATE_GAME: 'game',
    STATE_GAME_OVER: 'gameOver',
    STATE_LEVEL_CLEAR: 'levelClear',
    // Colors
    SKY: '#5C94FC',
    GROUND_TOP: '#E56820',
    GROUND_FILL: '#AB4611',
    BRICK_TOP: '#C84B11',
    BRICK_FILL: '#AB4611',
    QBLOCK: '#FAC000',
    QBLOCK_DARK: '#D49000',
    PIPE: '#24B048',
    PIPE_DARK: '#167030',
    SOLID: '#AAAAAA',
    STAIR: '#C87830',
};


// ===== js\Sprites.js =====
// Sprite sheet management with Cocos2D plist parsing
class SpriteManager {
    constructor() {
        this.images = {};
        this.sheets = {};
        this.loaded = 0;
        this.total = 0;
    }

    _parsePlist(xml) {
        const doc = new DOMParser().parseFromString(xml, 'text/xml');
        const root = doc.querySelector('plist dict');
        return this._parseDict(root);
    }

    _parseDict(node) {
        const obj = {};
        const ch = Array.from(node.children);
        for (let i = 0; i + 1 < ch.length; i += 2)
            obj[ch[i].textContent] = this._parseVal(ch[i + 1]);
        return obj;
    }

    _parseVal(node) {
        const t = node.tagName;
        if (t === 'dict') return this._parseDict(node);
        if (t === 'array') return Array.from(node.children).map(c => this._parseVal(c));
        if (t === 'string') return node.textContent;
        if (t === 'integer') return parseInt(node.textContent);
        if (t === 'real') return parseFloat(node.textContent);
        if (t === 'true') return true;
        if (t === 'false') return false;
        return null;
    }

    _parseRect(s) {
        const m = s.match(/\{+(-?[\d.]+),(-?[\d.]+)\},{(-?[\d.]+),(-?[\d.]+)\}+/);
        return m ? { x: +m[1], y: +m[2], w: +m[3], h: +m[4] } : { x:0,y:0,w:16,h:16 };
    }

    _parseSize(s) {
        const m = s.match(/\{(-?[\d.]+),(-?[\d.]+)\}/);
        return m ? { w: +m[1], h: +m[2] } : { w:16, h:16 };
    }

    async loadSheet(name, imgPath, plistPath) {
        this.total += 2;
        return new Promise(resolve => {
            let done = 0;
            const tryResolve = () => { if (++done === 2) resolve(); };

            const img = new Image();
            img.onload = () => { this.loaded++; tryResolve(); };
            img.onerror = () => { this.loaded++; tryResolve(); };
            img.src = imgPath;
            this.images[name] = img;

            fetch(plistPath)
                .then(r => r.text())
                .then(xml => {
                    const data = this._parsePlist(xml);
                    const rawFrames = data.frames || {};
                    const frames = {};
                    for (const [k, v] of Object.entries(rawFrames)) {
                        const frameName = k.replace(/\.png$/i, '');
                        const rect = this._parseRect(v.textureRect || '{{0,0},{16,16}}');
                        const size = this._parseSize(v.spriteSize || '{16,16}');
                        frames[frameName] = {
                            sx: rect.x, sy: rect.y, sw: rect.w, sh: rect.h,
                            dw: size.w, dh: size.h,
                            rotated: v.textureRotated === true
                        };
                    }
                    this.sheets[name] = { img, frames };
                    this.loaded++;
                    tryResolve();
                })
                .catch(() => {
                    this.sheets[name] = { img, frames: {} };
                    this.loaded++;
                    tryResolve();
                });
        });
    }

    async loadImage(name, path) {
        this.total++;
        return new Promise(resolve => {
            const img = new Image();
            img.onload = () => { this.loaded++; resolve(); };
            img.onerror = () => { this.loaded++; resolve(); };
            img.src = path;
            this.images[name] = img;
        });
    }

    // Draw a sprite frame, scaled 2x, optional flipX
    drawFrame(ctx, sheetName, frameName, dx, dy, flipX = false) {
        const sheet = this.sheets[sheetName];
        if (!sheet) return;
        const f = sheet.frames[frameName];
        if (!f) return;
        if (!sheet.img || !sheet.img.complete || sheet.img.naturalWidth === 0) return;
        const sc = C.SCALE;
        const dw = f.dw * sc, dh = f.dh * sc;

        ctx.save();
        if (flipX) {
            ctx.translate(dx + dw, dy);
            ctx.scale(-1, 1);
            dx = 0; dy = 0;
        } else {
            ctx.translate(dx, dy);
        }

        if (f.rotated) {
            ctx.translate(0, dh);
            ctx.rotate(-Math.PI / 2);
            ctx.drawImage(sheet.img, f.sx, f.sy, f.sh, f.sw, 0, 0, f.sh * sc, f.sw * sc);
        } else {
            ctx.drawImage(sheet.img, f.sx, f.sy, f.sw, f.sh, 0, 0, dw, dh);
        }
        ctx.restore();
    }

    // Draw raw image
    drawImage(ctx, name, dx, dy, dw, dh) {
        const img = this.images[name];
        if (img && img.complete && img.naturalWidth > 0) ctx.drawImage(img, dx, dy, dw, dh);
    }

    frameExists(sheetName, frameName) {
        return !!(this.sheets[sheetName] && this.sheets[sheetName].frames[frameName]);
    }

    frameSize(sheetName, frameName) {
        const sheet = this.sheets[sheetName];
        if (!sheet) return {w:32, h:32};
        const f = sheet.frames[frameName];
        if (!f) return {w:32, h:32};
        return {w: f.dw * C.SCALE, h: f.dh * C.SCALE};
    }
}

const sprites = new SpriteManager();

async function loadAllAssets() {
    const p = 'assets/images/';
    await Promise.all([
        sprites.loadSheet('mario_small', p+'player/mario_small.png', p+'player/mario_small.plist'),
        sprites.loadSheet('mario_big',   p+'player/mario_big.png',   p+'player/mario_big.plist'),
        sprites.loadSheet('goomba',      p+'enemies/Goomba.png',     p+'enemies/Goomba.plist'),
        sprites.loadSheet('turtle',      p+'enemies/Turtle.png',     p+'enemies/Turtle.plist'),
        sprites.loadSheet('items',       p+'tiles/items.png',        p+'tiles/items.plist'),
        sprites.loadSheet('effects',     p+'tiles/effects.png',      p+'tiles/effects.plist'),
        sprites.loadImage('menu_bg',     p+'ui/menu_bg.png'),
        sprites.loadImage('title_0',     p+'ui/title_0.png'),
        sprites.loadImage('title_1',     p+'ui/title_1.png'),
        sprites.loadImage('life',        p+'ui/life.png'),
        sprites.loadImage('world',       p+'ui/world.png'),
        sprites.loadImage('flag',        p+'ui/flag.png'),
        sprites.loadImage('tileset',     p+'tiles/tileset.png'),
    ]);
}


// ===== js\Audio.js =====
class AudioManager {
    constructor() {
        this.ctx = null;
        this.buffers = {};
        this.bgmSource = null;
        this.bgmGain = null;
        this.sfxGain = null;
        this.muted = false;
        this.bgmName = null;
    }

    init() {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        this.bgmGain = this.ctx.createGain();
        this.bgmGain.gain.value = 0.5;
        this.bgmGain.connect(this.ctx.destination);

        this.sfxGain = this.ctx.createGain();
        this.sfxGain.gain.value = 0.7;
        this.sfxGain.connect(this.ctx.destination);
    }

    async load(name, url) {
        try {
            const resp = await fetch(url);
            const ab = await resp.arrayBuffer();
            if (this.ctx) {
                this.buffers[name] = await this.ctx.decodeAudioData(ab);
            }
        } catch(e) {
            console.warn('Audio load failed:', name, e);
        }
    }

    async loadAll() {
        this.init();
        const base = 'assets/audio/';
        await Promise.all([
            this.load('bgm1',       base+'bgm_1.mp3'),
            this.load('bgm2',       base+'bgm_2.mp3'),
            this.load('bgm3',       base+'bgm_3.mp3'),
            this.load('gameOver',   base+'Game Over.mp3'),
            this.load('levelClear', base+'levelClear.mp3'),
            this.load('jump',       base+'jump.wav'),
            this.load('stomp',      base+'stomp.wav'),
            this.load('coin',       base+'coin.wav'),
            this.load('powerUp',    base+'PowerUp.mp3'),
            this.load('powerUpAppear', base+'powerUpAppear.wav'),
            this.load('powerDown',  base+'powerDown.wav'),
            this.load('loseLife',   base+'loseOneLife.wav'),
            this.load('kick',       base+'kick.wav'),
        ]);
    }

    playBGM(name) {
        if (!this.ctx || this.bgmName === name) return;
        this.stopBGM();
        this.bgmName = name;
        const buf = this.buffers[name];
        if (!buf) return;
        this.bgmSource = this.ctx.createBufferSource();
        this.bgmSource.buffer = buf;
        this.bgmSource.loop = true;
        this.bgmSource.connect(this.bgmGain);
        this.bgmSource.start(0);
    }

    stopBGM() {
        if (this.bgmSource) {
            try { this.bgmSource.stop(); } catch(e) {}
            this.bgmSource = null;
        }
        this.bgmName = null;
    }

    playSFX(name) {
        if (!this.ctx || this.muted) return;
        const buf = this.buffers[name];
        if (!buf) return;
        const src = this.ctx.createBufferSource();
        src.buffer = buf;
        src.connect(this.sfxGain);
        src.start(0);
    }

    resumeCtx() {
        if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
    }
}

const audio = new AudioManager();


// ===== js\Input.js =====
const Input = {
    keys: {},
    justPressed: {},
    justReleased: {},

    init() {
        window.addEventListener('keydown', e => {
            if (!this.keys[e.code]) this.justPressed[e.code] = true;
            this.keys[e.code] = true;
            if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key))
                e.preventDefault();
        });
        window.addEventListener('keyup', e => {
            this.keys[e.code] = false;
            this.justReleased[e.code] = true;
        });
    },

    isDown(code) { return !!this.keys[code]; },
    wasPressed(code) { return !!this.justPressed[code]; },
    wasReleased(code) { return !!this.justReleased[code]; },

    clearFrame() {
        this.justPressed = {};
        this.justReleased = {};
    },

    left()  { return this.isDown('ArrowLeft')  || this.isDown('KeyA'); },
    right() { return this.isDown('ArrowRight') || this.isDown('KeyD'); },
    jump()  { return this.isDown('ArrowUp') || this.isDown('KeyW') || this.isDown('Space'); },
    run()   { return this.isDown('ShiftLeft') || this.isDown('ShiftRight') || this.isDown('KeyZ'); },
    jumpPressed() { return this.wasPressed('ArrowUp') || this.wasPressed('KeyW') || this.wasPressed('Space'); },
};


// ===== js\Camera.js =====
class Camera {
    constructor() {
        this.x = 0;
        this.y = 0;
        this.maxX = 0;
    }

    setLevelWidth(w) {
        this.maxX = Math.max(0, w - C.W);
    }

    follow(entity) {
        const cx = entity.x + entity.w / 2 - C.W / 2;
        this.x = Math.max(0, Math.min(cx, this.maxX));
    }

    toScreenX(wx) { return wx - this.x; }
    toScreenY(wy) { return wy - this.y; }

    inView(x, y, w, h) {
        return x + w > this.x && x < this.x + C.W &&
               y + h > this.y && y < this.y + C.H;
    }

    begin(ctx) {
        ctx.save();
        ctx.translate(-Math.floor(this.x), -Math.floor(this.y));
    }

    end(ctx) {
        ctx.restore();
    }
}


// ===== js\Level.js =====
// ── Tile Map ─────────────────────────────────────────────────────────────────
class TileMap {
    constructor(grid, mushroomBlocks) {
        this.grid = grid;           // grid[row][col]
        this.rows = grid.length;
        this.cols = grid[0].length;
        this.mushroomCols = new Set(mushroomBlocks || []);
        this.hitCallbacks = [];
    }

    get(col, row) {
        if (row < 0 || row >= this.rows || col < 0 || col >= this.cols) {
            return C.T_AIR;
        }
        return this.grid[row][col];
    }

    set(col, row, type) {
        if (row >= 0 && row < this.rows && col >= 0 && col < this.cols)
            this.grid[row][col] = type;
    }

    isSolid(type) {
        return type === C.T_GROUND || type === C.T_BRICK || type === C.T_QBLOCK ||
               type === C.T_QUSED  || type === C.T_SOLID || type === C.T_STAIR  ||
               type === C.T_CASTLE || type === C.T_PIPE_TL || type === C.T_PIPE_TR ||
               type === C.T_PIPE_BL || type === C.T_PIPE_BR || type === C.T_INVISIBLE;
    }

    draw(ctx, camera) {
        const T = C.TILE;
        const startCol = Math.max(0, Math.floor(camera.x / T));
        const endCol   = Math.min(this.cols - 1, Math.ceil((camera.x + C.W) / T));
        const startRow = 0;
        const endRow   = this.rows - 1;

        for (let r = startRow; r <= endRow; r++) {
            for (let c = startCol; c <= endCol; c++) {
                const t = this.grid[r][c];
                if (t === C.T_AIR) continue;
                const px = c * T;
                const py = r * T;
                this._drawTile(ctx, t, px, py);
            }
        }
    }

    _drawTile(ctx, type, px, py) {
        const T = C.TILE;
        switch (type) {
            case C.T_GROUND:
            case C.T_STAIR:
            case C.T_CASTLE:
                ctx.fillStyle = C.GROUND_FILL;
                ctx.fillRect(px, py, T, T);
                ctx.fillStyle = C.GROUND_TOP;
                ctx.fillRect(px, py, T, 4);
                ctx.strokeStyle = '#6B2800';
                ctx.lineWidth = 1;
                ctx.strokeRect(px + 0.5, py + 0.5, T - 1, T - 1);
                break;

            case C.T_BRICK:
                ctx.fillStyle = C.BRICK_FILL;
                ctx.fillRect(px, py, T, T);
                ctx.fillStyle = C.BRICK_TOP;
                ctx.fillRect(px, py, T, T - 2);
                // Mortar lines
                ctx.fillStyle = '#6B2800';
                ctx.fillRect(px, py + T/2 - 1, T, 2);
                ctx.fillRect(px + T/4, py, 2, T/2);
                ctx.fillRect(px + 3*T/4, py, 2, T/2);
                ctx.fillRect(px, py + T/2, 2, T/2);
                ctx.fillRect(px + T/2, py + T/2, 2, T/2);
                ctx.fillRect(px + T - 2, py + T/2, 2, T/2);
                break;

            case C.T_QBLOCK:
                this._drawQBlock(ctx, px, py, false);
                break;

            case C.T_QUSED:
                this._drawQBlock(ctx, px, py, true);
                break;

            case C.T_SOLID:
                ctx.fillStyle = C.SOLID;
                ctx.fillRect(px, py, T, T);
                ctx.strokeStyle = '#666';
                ctx.lineWidth = 1;
                ctx.strokeRect(px + 0.5, py + 0.5, T - 1, T - 1);
                break;

            case C.T_PIPE_TL:
                ctx.fillStyle = C.PIPE;
                ctx.fillRect(px, py, T, T);
                ctx.fillStyle = C.PIPE_DARK;
                ctx.fillRect(px + T - 4, py, 4, T);
                ctx.fillRect(px, py + T - 4, T, 4);
                ctx.strokeStyle = C.PIPE_DARK;
                ctx.lineWidth = 2;
                ctx.strokeRect(px + 1, py + 1, T - 2, T - 2);
                break;

            case C.T_PIPE_TR:
                ctx.fillStyle = C.PIPE;
                ctx.fillRect(px, py, T, T);
                ctx.fillStyle = C.PIPE_DARK;
                ctx.fillRect(px, py, 4, T);
                ctx.fillRect(px, py + T - 4, T, 4);
                ctx.strokeStyle = C.PIPE_DARK;
                ctx.lineWidth = 2;
                ctx.strokeRect(px + 1, py + 1, T - 2, T - 2);
                break;

            case C.T_PIPE_BL:
                ctx.fillStyle = C.PIPE;
                ctx.fillRect(px, py, T, T);
                ctx.fillStyle = C.PIPE_DARK;
                ctx.fillRect(px + T - 4, py, 4, T);
                ctx.strokeStyle = C.PIPE_DARK;
                ctx.lineWidth = 2;
                ctx.strokeRect(px + 1, py + 1, T - 2, T - 2);
                break;

            case C.T_PIPE_BR:
                ctx.fillStyle = C.PIPE;
                ctx.fillRect(px, py, T, T);
                ctx.fillStyle = C.PIPE_DARK;
                ctx.fillRect(px, py, 4, T);
                ctx.strokeStyle = C.PIPE_DARK;
                ctx.lineWidth = 2;
                ctx.strokeRect(px + 1, py + 1, T - 2, T - 2);
                break;
        }
    }

    _drawQBlock(ctx, px, py, used) {
        const T = C.TILE;
        if (used) {
            ctx.fillStyle = '#8B6914';
            ctx.fillRect(px, py, T, T);
            ctx.strokeStyle = '#5A4008';
            ctx.lineWidth = 2;
            ctx.strokeRect(px + 1, py + 1, T - 2, T - 2);
        } else {
            ctx.fillStyle = C.QBLOCK;
            ctx.fillRect(px, py, T, T);
            ctx.fillStyle = C.QBLOCK_DARK;
            ctx.fillRect(px, py, T, 3);
            ctx.fillRect(px, py, 3, T);
            ctx.fillRect(px + T - 3, py, 3, T);
            ctx.fillRect(px, py + T - 3, T, 3);
            // Draw "?"
            ctx.fillStyle = '#FFF';
            ctx.font = 'bold 18px monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('?', px + T / 2, py + T / 2 + 1);
        }
    }
}

// ── Level definitions ─────────────────────────────────────────────────────────
function buildLevel(num) {
    const W = 212, H = 14, T = C.T_AIR;
    const G = C.T_GROUND, B = C.T_BRICK, Q = C.T_QBLOCK, U = C.T_QUSED;
    const S = C.T_SOLID;
    const TL = C.T_PIPE_TL, TR = C.T_PIPE_TR, BL = C.T_PIPE_BL, BR = C.T_PIPE_BR;
    const ST = C.T_STAIR, CA = C.T_CASTLE;

    const grid = Array.from({length: H}, () => new Array(W).fill(T));

    function fill(r, c1, c2, type) {
        for (let c = c1; c <= c2; c++) grid[r][c] = type;
    }
    function col(c, r1, r2, type) {
        for (let r = r1; r <= r2; r++) grid[r][c] = type;
    }

    if (num === 1) {
        // Ground rows 12-13 (full except gaps)
        fill(12, 0, 211, G); fill(13, 0, 211, G);
        // Gap 1
        fill(12, 30, 34, T); fill(13, 30, 34, T);
        // Gap 2
        fill(12, 57, 63, T); fill(13, 57, 63, T);
        // Gap 3
        fill(12, 153, 159, T); fill(13, 153, 159, T);

        // Row 8 blocks (standard platform height)
        grid[8][16] = Q;  // Q-block (coin)
        grid[8][20] = B;  grid[8][21] = Q; grid[8][22] = B;  // BQB
        grid[8][23] = Q;  grid[8][24] = B;                    // QB

        // Row 8 bricks and blocks – later section
        fill(8, 78, 78, B); grid[8][79] = Q; fill(8, 80, 80, B);
        fill(8, 82, 85, B); grid[8][86] = Q;

        // Pipes (row 10-11 pipe1, 9-11 pipe2, 8-11 pipe3)
        grid[10][28] = TL; grid[10][29] = TR;
        grid[11][28] = BL; grid[11][29] = BR;

        grid[9][40] = TL; grid[9][41] = TR;
        grid[10][40] = BL; grid[10][41] = BR;
        grid[11][40] = BL; grid[11][41] = BR;  // extend body

        grid[8][47] = TL; grid[8][48] = TR;
        grid[9][47] = BL; grid[9][48] = BR;
        grid[10][47] = BL; grid[10][48] = BR;
        grid[11][47] = BL; grid[11][48] = BR;

        // Upper brick platform (row 6)
        fill(6, 93, 100, B); grid[6][96] = Q;

        // Bridge section (col 108-120)
        fill(8, 108, 108, S); fill(8, 109, 111, B); grid[8][112] = Q; fill(8, 113, 120, B);

        // Steps / staircase going up (before flag pole)
        for (let s = 0; s < 8; s++) {
            for (let r = 12 - s; r <= 13; r++) grid[r][185 + s] = ST;
        }
        // Castle block to the right
        for (let r = 9; r <= 13; r++) col(200, r, r, CA);
        for (let r = 10; r <= 13; r++) col(201, r, r, CA);
        for (let r = 11; r <= 13; r++) col(202, r, r, CA);
        for (let r = 9; r <= 13; r++) { col(203, r, r, CA); col(204, r, r, CA); col(205, r, r, CA); }

        // Some ceiling / underground style blocks for the first hidden area
        fill(4, 0, 15, S);

        return {
            grid,
            bgm: 'bgm1',
            enemies: [
                {type:'goomba', col:25, row:11},
                {type:'goomba', col:27, row:11},
                {type:'goomba', col:38, row:11},
                {type:'goomba', col:52, row:11},
                {type:'goomba', col:53, row:11},
                {type:'goomba', col:91, row:11},
                {type:'goomba', col:92, row:11},
                {type:'goomba', col:130,row:11},
                {type:'goomba', col:131,row:11},
                {type:'goomba', col:145,row:11},
                {type:'turtle', col:115,row:11},
            ],
            mushroomBlocks: [21, 79, 96],  // columns of Q-blocks that have mushrooms
            spawnCol: 1, spawnRow: 11,
            flagCol: 193,
            width: W, height: H,
        };
    }

    if (num === 2) {
        fill(12, 0, 211, G); fill(13, 0, 211, G);
        fill(12, 25, 30, T); fill(13, 25, 30, T);
        fill(12, 82, 86, T); fill(13, 82, 86, T);
        fill(12, 132, 136, T); fill(13, 132, 136, T);

        grid[8][15] = Q; grid[8][18] = Q; grid[8][21] = Q;
        fill(8, 50, 54, B); grid[8][52] = Q;
        fill(6, 65, 72, B); grid[6][68] = Q;
        fill(8, 100, 107, B);

        grid[10][23] = TL; grid[10][24] = TR;
        grid[11][23] = BL; grid[11][24] = BR;
        grid[9][70] = TL; grid[9][71] = TR;
        grid[10][70] = BL; grid[10][71] = BR;
        grid[11][70] = BL; grid[11][71] = BR;

        for (let s = 0; s < 8; s++) {
            for (let r = 12 - s; r <= 13; r++) grid[r][185 + s] = ST;
        }
        for (let r = 9; r <= 13; r++) { col(200, r, r, CA); col(201, r, r, CA); }
        for (let r = 10; r <= 13; r++) { col(202, r, r, CA); col(203, r, r, CA); }
        for (let r = 9; r <= 13; r++) { col(204, r, r, CA); col(205, r, r, CA); }

        return {
            grid, bgm: 'bgm2',
            enemies: [
                {type:'goomba', col:33, row:11},
                {type:'goomba', col:35, row:11},
                {type:'goomba', col:45, row:11},
                {type:'turtle', col:60, row:11},
                {type:'goomba', col:90, row:11},
                {type:'goomba', col:91, row:11},
                {type:'goomba', col:118,row:11},
                {type:'turtle', col:148,row:11},
            ],
            mushroomBlocks: [18, 52, 68],
            spawnCol: 1, spawnRow: 11,
            flagCol: 193,
            width: W, height: H,
        };
    }

    // Level 3
    fill(12, 0, 211, G); fill(13, 0, 211, G);
    fill(12, 21, 25, T); fill(13, 21, 25, T);
    fill(12, 51, 55, T); fill(13, 51, 55, T);
    fill(12, 102, 106, T); fill(13, 102, 106, T);
    fill(12, 157, 161, T); fill(13, 157, 161, T);

    grid[8][12] = Q; grid[8][17] = Q; grid[8][22] = B; grid[8][23] = B;
    fill(8, 40, 47, B); grid[8][43] = Q; grid[8][44] = Q;
    fill(8, 85, 95, B); grid[8][88] = Q; grid[8][92] = Q;

    grid[9][19] = TL; grid[9][20] = TR;
    grid[10][19] = BL; grid[10][20] = BR;
    grid[11][19] = BL; grid[11][20] = BR;

    grid[10][48] = TL; grid[10][49] = TR;
    grid[11][48] = BL; grid[11][49] = BR;

    for (let s = 0; s < 8; s++) {
        for (let r = 12 - s; r <= 13; r++) grid[r][185 + s] = ST;
    }
    for (let r = 9; r <= 13; r++) { col(200, r, r, CA); col(201, r, r, CA); }
    for (let r = 10; r <= 13; r++) { col(202, r, r, CA); col(203, r, r, CA); }
    for (let r = 9; r <= 13; r++) { col(204, r, r, CA); col(205, r, r, CA); }

    return {
        grid, bgm: 'bgm3',
        enemies: [
            {type:'goomba', col:27, row:11},
            {type:'goomba', col:29, row:11},
            {type:'turtle', col:35, row:11},
            {type:'goomba', col:60, row:11},
            {type:'turtle', col:61, row:11},
            {type:'goomba', col:75, row:11},
            {type:'goomba', col:110,row:11},
            {type:'turtle', col:111,row:11},
            {type:'goomba', col:140,row:11},
            {type:'goomba', col:141,row:11},
            {type:'turtle', col:165,row:11},
        ],
        mushroomBlocks: [12, 43, 88],
        spawnCol: 1, spawnRow: 11,
        flagCol: 193,
        width: W, height: H,
    };
}


// ===== js\entities\Player.js =====
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


// ===== js\entities\Goomba.js =====
class Goomba {
    constructor(col, row, tileMap) {
        this.map = tileMap;
        this.x = col * C.TILE;
        this.y = row * C.TILE;
        this.w = 20 * C.SCALE;  // 20px sprite, 2x scale = 40
        this.h = 24 * C.SCALE;  // 24px sprite, 2x scale = 48
        this.vx = 0;
        this.vy = 0;
        this.onGround = false;
        this.alive = true;
        this.squished = false;
        this.squishTimer = 0;
        this.animTimer = 0;
        this.animFrame = 0;
        this.active = false;  // activated when player approaches
        this.vx = (col % 2 === 0) ? -C.ENEMY_SPEED : C.ENEMY_SPEED;
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
        const frame = this.shell ? 'turtle_4' : `turtle_${this.animFrame % 2}`;
        if (!sprites.frameExists('turtle', frame)) {
            ctx.fillStyle = this.shell ? '#228B22' : '#3A7D44';
            ctx.fillRect(this.x, this.y, this.w, this.h);
            return;
        }
        sprites.drawFrame(ctx, 'turtle', frame, this.x, this.y, !this.shell && this.vx > 0);
    }
}


// ===== js\entities\Mushroom.js =====
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
        if (sprites.frameExists('items', 'items_46')) {
            sprites.drawFrame(ctx, 'items', 'items_46', this.x, this.y);
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


// ===== js\entities\QuestionBlock.js =====
class QuestionBlock {
    constructor(col, row, hasMushroom) {
        this.col = col;
        this.row = row;
        this.hasMushroom = hasMushroom;
        this.hit = false;
        this.bounceOffset = 0;
        this.bounceTimer = 0;
        this.activated = false;
    }

    triggerHit() {
        if (this.hit) return null;
        this.hit = true;
        this.bounceOffset = -8;
        this.bounceTimer = 0.25;
        audio.playSFX(this.hasMushroom ? 'powerUpAppear' : 'coin');
        return this.hasMushroom ? 'mushroom' : 'coin';
    }

    update(dt) {
        if (this.bounceTimer > 0) {
            this.bounceTimer -= dt;
            this.bounceOffset = -8 * (this.bounceTimer / 0.25);
        } else {
            this.bounceOffset = 0;
        }
    }
}


// ===== js\HUD.js =====
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


// ===== js\Firebase.js =====
const firebaseConfig = {
    apiKey:            "AIzaSyAOvh-HlYc8L4RSBLOZvZ_GNIlLmuHVLJ0",
    authDomain:        "webmario-113006230.firebaseapp.com",
    projectId:         "webmario-113006230",
    storageBucket:     "webmario-113006230.firebasestorage.app",
    messagingSenderId: "974163210457",
    appId:             "1:974163210457:web:91f77abe76b7add9d84ec8"
};

class FirebaseManager {
    constructor() {
        this.app  = null;
        this.auth = null;
        this.db   = null;
        this.user = null;
        this.ready = false;
    }

    init() {
        try {
            if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
            this.app  = firebase.app();
            this.auth = firebase.auth();
            this.db   = firebase.firestore();
            this.auth.onAuthStateChanged(u => {
                this.user = u;
                this._updateUI();
            });
            this.ready = true;
        } catch(e) {
            console.warn('Firebase init failed – running offline:', e);
        }
    }

    _updateUI() {
        const el = document.getElementById('userInfo');
        if (el) el.textContent = this.user ? `Logged in: ${this.user.email}` : '';
    }

    async login(email, pw) {
        if (!this.ready) return {ok:false, err:'Firebase not ready'};
        try {
            await this.auth.signInWithEmailAndPassword(email, pw);
            return {ok:true};
        } catch(e) { return {ok:false, err:e.message}; }
    }

    async signup(email, pw) {
        if (!this.ready) return {ok:false, err:'Firebase not ready'};
        try {
            await this.auth.createUserWithEmailAndPassword(email, pw);
            return {ok:true};
        } catch(e) { return {ok:false, err:e.message}; }
    }

    logout() {
        if (this.auth) this.auth.signOut();
    }

    async saveScore(score, world) {
        if (!this.ready || !this.db) return;
        try {
            await this.db.collection('leaderboard').add({
                uid:   this.user ? this.user.uid   : 'guest',
                email: this.user ? this.user.email : 'Guest',
                score, world,
                ts: firebase.firestore.FieldValue.serverTimestamp()
            });
        } catch(e) { console.warn('Score save failed:', e); }
    }

    async getLeaderboard() {
        if (!this.ready || !this.db) return [];
        try {
            const snap = await this.db.collection('leaderboard')
                .orderBy('score','desc').limit(10).get();
            return snap.docs.map(d => d.data());
        } catch(e) { return []; }
    }

    async saveProgress(data) {
        if (!this.ready || !this.db || !this.user) return;
        try {
            await this.db.collection('progress').doc(this.user.uid).set(data);
        } catch(e) {}
    }

    async loadProgress() {
        if (!this.ready || !this.db || !this.user) return null;
        try {
            const d = await this.db.collection('progress').doc(this.user.uid).get();
            return d.exists ? d.data() : null;
        } catch(e) { return null; }
    }
}

const fbManager = new FirebaseManager();

// Auth modal helpers
function showAuthModal() {
    document.getElementById('loginModal').classList.add('active');
}
function hideAuthModal() {
    document.getElementById('loginModal').classList.remove('active');
}
function initAuthUI() {
    document.getElementById('loginBtn').onclick = async () => {
        const email = document.getElementById('emailInput').value;
        const pw    = document.getElementById('passwordInput').value;
        const res = await fbManager.login(email, pw);
        if (res.ok) hideAuthModal();
        else document.getElementById('authError').textContent = res.err;
    };
    document.getElementById('signupBtn').onclick = async () => {
        const email = document.getElementById('emailInput').value;
        const pw    = document.getElementById('passwordInput').value;
        const res = await fbManager.signup(email, pw);
        if (res.ok) hideAuthModal();
        else document.getElementById('authError').textContent = res.err;
    };
    document.getElementById('guestBtn').onclick = hideAuthModal;
}


// ===== js\scenes\MenuScene.js =====
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
        const menuBg = sprites.images['menu_bg'];
        if (menuBg && menuBg.complete && menuBg.naturalWidth > 0) {
            ctx.drawImage(menuBg, 0, 0, C.W, C.H);
        } else {
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


// ===== js\scenes\LevelSelectScene.js =====
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
        sprites.drawFrame(ctx, 'mario_small', 'mario_small_1', x + 8, y + h*0.6 - 16);
    }
}


// ===== js\scenes\GameScene.js =====
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
        this.cheatMode = false;
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
            if (Input.wasPressed('KeyC')) this.cheatMode = !this.cheatMode;
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
                if (!this.cheatMode) fbManager.saveScore(this.hud.score, this.levelNum);
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
                    if (!this.cheatMode) fbManager.saveScore(this.hud.score, this.levelNum);
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
            } else if (!this.cheatMode) {
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
        // Sky gradient
        const skyGrad = ctx.createLinearGradient(0, 0, 0, C.H);
        skyGrad.addColorStop(0, '#4080E8');
        skyGrad.addColorStop(0.6, C.SKY);
        skyGrad.addColorStop(1, '#A8D4FF');
        ctx.fillStyle = skyGrad;
        ctx.fillRect(0, 0, C.W, C.H);

        // Background hills + clouds (parallax)
        this._drawBackground(ctx);
        this._drawClouds(ctx);

        this.camera.begin(ctx);

        // Tilemap
        this.tileMap.draw(ctx, this.camera);

        // Flag pole
        this._drawFlag(ctx);

        // Items
        this.coins.forEach(c => c.draw(ctx));
        this.mushrooms.forEach(m => m.draw(ctx));

        // Enemies (only draw once activated so they don't appear off-ground during intro)
        this.enemies.forEach(e => {
            if (e.active && (e.alive || e.squished)) e.draw(ctx);
        });

        // Player
        this.player.draw(ctx);

        // Score popups
        this.popups.forEach(p => p.draw(ctx));

        this.camera.end(ctx);

        // HUD (screen space)
        this.hud.draw(ctx);

        // Cheat mode indicator
        if (this.cheatMode) {
            ctx.fillStyle = 'rgba(0,255,136,0.15)';
            ctx.fillRect(0, 0, C.W, C.H);
            ctx.fillStyle = '#00FF88';
            ctx.font = 'bold 11px monospace';
            ctx.textAlign = 'right';
            ctx.textBaseline = 'bottom';
            ctx.fillText('CHEAT MODE', C.W - 10, C.H - 8);
        }

        // Pause overlay
        if (this.paused) this._drawPause(ctx);

        // Intro banner
        if (this.introActive) this._drawIntro(ctx);
    }

    _drawBackground(ctx) {
        const T = C.TILE;
        const groundY = 12 * T;  // y pixel of ground
        const camX = this.camera.x;

        // Far hills (slow parallax 0.15)
        const farOff = camX * 0.15;
        ctx.fillStyle = '#2E7D32';
        [[300, 0.9], [700, 0.7], [1050, 1.0], [1400, 0.8], [1750, 0.95]].forEach(([bx, s]) => {
            const x = bx - farOff % 2000;
            ctx.beginPath();
            ctx.ellipse(x, groundY, 180 * s, 55 * s, 0, Math.PI, 0);
            ctx.closePath();
            ctx.fill();
        });

        // Near hills (medium parallax 0.4)
        const nearOff = camX * 0.4;
        ctx.fillStyle = '#388E3C';
        [[150, 0.8], [480, 1.0], [820, 0.85], [1160, 1.05], [1500, 0.9]].forEach(([bx, s]) => {
            const x = bx - nearOff % 1700;
            ctx.beginPath();
            ctx.ellipse(x, groundY, 120 * s, 36 * s, 0, Math.PI, 0);
            ctx.closePath();
            ctx.fill();
        });

        // Bushes at horizon (parallax 0.7, drawn at ground level)
        const bushOff = camX * 0.7;
        ctx.fillStyle = '#1B5E20';
        [[60, 1], [280, 0.8], [500, 1.1], [720, 0.9], [940, 1.0],
         [1160, 0.85], [1380, 1.05], [1600, 0.9]].forEach(([bx, s]) => {
            const x = bx - bushOff % 1700;
            ctx.beginPath();
            ctx.arc(x,      groundY, 18 * s, Math.PI, 0);
            ctx.arc(x + 22, groundY, 14 * s, Math.PI, 0);
            ctx.arc(x - 18, groundY, 13 * s, Math.PI, 0);
            ctx.fill();
        });
    }

    _drawClouds(ctx) {
        const offset = this.camera.x * 0.3;
        const positions = [[160,50],[420,30],[680,58],[940,38],[1200,55],[1460,42]];
        positions.forEach(([bx, by]) => {
            const x = bx - offset % 1600;
            // Shadow
            ctx.fillStyle = 'rgba(180,200,240,0.6)';
            ctx.beginPath();
            ctx.arc(x + 3, by + 5,  17, 0, Math.PI*2);
            ctx.arc(x + 28, by - 5, 22, 0, Math.PI*2);
            ctx.arc(x + 55, by + 5, 17, 0, Math.PI*2);
            ctx.fill();
            // White cloud
            ctx.fillStyle = '#FFFFFF';
            ctx.beginPath();
            ctx.arc(x,     by + 3,  17, 0, Math.PI*2);
            ctx.arc(x + 25, by - 7, 22, 0, Math.PI*2);
            ctx.arc(x + 52, by + 3, 17, 0, Math.PI*2);
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
        ctx.fillStyle = 'rgba(0,0,0,0.65)';
        ctx.fillRect(0, 0, C.W, C.H);

        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 36px monospace';
        ctx.fillText('PAUSED', C.W/2, C.H/2 - 60);

        ctx.font = '16px monospace';
        ctx.fillStyle = '#FFF';
        ctx.fillText('[ESC / P]  Resume', C.W/2, C.H/2);

        // Cheat mode toggle
        const cheatColor = this.cheatMode ? '#00FF88' : '#888';
        ctx.fillStyle = cheatColor;
        ctx.font = 'bold 16px monospace';
        ctx.fillText(`[C]  Cheat Mode: ${this.cheatMode ? 'ON' : 'OFF'}`, C.W/2, C.H/2 + 44);

        if (this.cheatMode) {
            ctx.fillStyle = '#FF8800';
            ctx.font = '12px monospace';
            ctx.fillText('Enemies cannot hurt you  |  Score not saved', C.W/2, C.H/2 + 72);
        } else {
            ctx.fillStyle = '#555';
            ctx.font = '12px monospace';
            ctx.fillText('Turn on to play without enemy damage', C.W/2, C.H/2 + 72);
        }
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


// ===== js\scenes\GameOverScene.js =====
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


// ===== js\scenes\LevelClearScene.js =====
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


// ===== js\Game.js =====
class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.scene = null;
        this.scenes = {};
        this.lastTime = 0;
        this.running = false;
    }

    init() {
        this.scenes = {
            menu:        new MenuScene(this),
            levelSelect: new LevelSelectScene(this),
            game:        new GameScene(this),
            gameOver:    new GameOverScene(this),
            levelClear:  new LevelClearScene(this),
        };
        Input.init();
        fbManager.init();
        initAuthUI();
    }

    changeScene(name, data) {
        if (this.scene && this.scene.exit) this.scene.exit();
        this.scene = this.scenes[name];
        if (this.scene && this.scene.enter) this.scene.enter(data);
    }

    startLevel(num, hud) {
        if (this.scene && this.scene.exit) this.scene.exit();
        this.scene = this.scenes['game'];
        this.scene.enter(num, hud);
    }

    start() {
        this.running = true;
        this.changeScene('menu');
        requestAnimationFrame(t => this._loop(t));
    }

    _loop(timestamp) {
        if (!this.running) return;
        const dt = Math.min((timestamp - this.lastTime) / 1000, 1/30);
        this.lastTime = timestamp;

        try {
            if (this.scene) {
                this.scene.update(dt);
                this.scene.draw(this.ctx);
            }
        } catch(e) {
            console.error('Game loop error:', e);
        }

        Input.clearFrame();
        requestAnimationFrame(t => this._loop(t));
    }
}


// ===== CC 2.4.8 Bootstrap (replaces main.js) =====
(function() {
    'use strict';

    var GAME_CSS = [
        '* { margin: 0; padding: 0; box-sizing: border-box; }',
        'body { background: #111; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; font-family: monospace; }',
        '#gameCanvas { image-rendering: pixelated; image-rendering: crisp-edges; border: 3px solid #444; display: block; max-width: 100vw; }',
        '#userInfo { color: #FFD700; font-size: 11px; margin-top: 6px; height: 16px; }',
        '#controls { color: #666; font-size: 10px; margin-top: 8px; text-align: center; line-height: 1.6; }',
        '#loginModal { display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.75); z-index: 200; align-items: center; justify-content: center; }',
        '#loginModal.active { display: flex; }',
        '.modal-box { background: #1a1a2e; border: 3px solid #FFD700; border-radius: 8px; padding: 28px 24px; width: 320px; text-align: center; color: white; }',
        '.modal-box h2 { color: #FFD700; margin-bottom: 18px; font-size: 18px; }',
        '.modal-box input { width: 100%; padding: 9px 10px; margin: 5px 0; background: #0d0d1a; border: 1px solid #555; color: white; border-radius: 4px; font-family: monospace; font-size: 13px; }',
        '.modal-box button { width: 100%; padding: 10px; margin: 5px 0; cursor: pointer; border: none; border-radius: 4px; font-size: 13px; font-family: monospace; font-weight: bold; }',
        '.btn-primary { background: #4CAF50; color: white; }',
        '.btn-secondary { background: #2196F3; color: white; }',
        '.btn-close { background: #555; color: #ccc; }',
        '#authError { color: #FF4444; font-size: 12px; margin-top: 8px; min-height: 18px; }'
    ].join('\n');

    var MODAL_HTML =
        '<div id="loginModal">' +
        '<div class="modal-box">' +
        '<h2>&#127918; WEB MARIO</h2>' +
        '<p style="color:#aaa;font-size:11px;margin-bottom:12px;">Login to save your score!</p>' +
        '<input type="email" id="emailInput" placeholder="Email">' +
        '<input type="password" id="passwordInput" placeholder="Password">' +
        '<button class="btn-primary" id="loginBtn">LOGIN</button>' +
        '<button class="btn-secondary" id="signupBtn">SIGN UP</button>' +
        '<button class="btn-close" id="guestBtn">PLAY AS GUEST</button>' +
        '<p id="authError"></p>' +
        '</div></div>';

    function injectStyles() {
        if (document.getElementById('mario-css')) return;
        var style = document.createElement('style');
        style.id = 'mario-css';
        style.textContent = GAME_CSS;
        document.head.appendChild(style);
    }

    function injectModal() {
        if (document.getElementById('loginModal')) return;
        document.body.insertAdjacentHTML('beforeend', MODAL_HTML);
    }

    function injectUserInfo() {
        if (document.getElementById('userInfo')) return;
        var div = document.createElement('div');
        div.id = 'userInfo';
        document.body.appendChild(div);
    }

    function injectControls() {
        if (document.getElementById('controls')) return;
        var div = document.createElement('div');
        div.id = 'controls';
        div.innerHTML = '&#8592; &#8594; Move &nbsp;|&nbsp; &#8593; / Space Jump &nbsp;|&nbsp; Shift Run &nbsp;|&nbsp; P/Esc Pause';
        document.body.appendChild(div);
    }

    function hideCC() {
        var el = document.getElementById('GameDiv') || document.getElementById('Cocos2dGameContainer');
        if (el) el.style.display = 'none';
        var cv = document.getElementById('GameCanvas');
        if (cv) cv.style.display = 'none';
        document.body.style.background = '#111';
    }

    function getOrCreateCanvas() {
        var canvas = document.getElementById('gameCanvas');
        if (!canvas) {
            canvas = document.createElement('canvas');
            canvas.id = 'gameCanvas';
            canvas.width = 800;
            canvas.height = 450;
            document.body.appendChild(canvas);
        }
        return canvas;
    }

    function showError(ctx, msg) {
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, 800, 450);
        ctx.fillStyle = '#FF4444';
        ctx.font = 'bold 14px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('ERROR: ' + String(msg).substring(0, 80), 400, 225);
        ctx.fillStyle = '#888';
        ctx.font = '11px monospace';
        ctx.fillText('Check browser console for details', 400, 255);
    }

    function loadFirebaseSDK() {
        return new Promise(function(resolve) {
            if (typeof firebase !== 'undefined') { resolve(); return; }
            var sdks = [
                'https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js',
                'https://www.gstatic.com/firebasejs/9.22.0/firebase-auth-compat.js',
                'https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore-compat.js'
            ];
            function next(i) {
                if (i >= sdks.length) { resolve(); return; }
                var s = document.createElement('script');
                s.src = sdks[i];
                s.onload = function() { next(i + 1); };
                s.onerror = function() { console.warn('Firebase SDK failed: ' + sdks[i]); resolve(); };
                document.head.appendChild(s);
            }
            next(0);
        });
    }

    async function startMarioGame() {
        injectStyles();
        hideCC();

        var canvas = getOrCreateCanvas();
        var ctx = canvas.getContext('2d');

        // Loading screen
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, 800, 450);
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 20px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('LOADING...', 400, 225);
        ctx.fillStyle = '#555';
        ctx.font = '11px monospace';
        ctx.fillText('build v12-cc', 400, 255);

        // Load Firebase SDK
        await loadFirebaseSDK();

        // Inject UI elements
        injectModal();
        injectUserInfo();
        injectControls();

        // Load audio (non-blocking)
        try { audio.loadAll().catch(function(e) { console.warn('Audio:', e); }); } catch(e) {}

        // Load visual assets with 6s timeout
        try {
            await Promise.race([
                loadAllAssets(),
                new Promise(function(resolve) { setTimeout(resolve, 6000); })
            ]);
        } catch(e) {
            console.warn('Asset load error:', e);
        }

        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, 800, 450);
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 20px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('READY!', 400, 225);

        await new Promise(function(r) { setTimeout(r, 300); });

        try {
            var game = new Game(canvas);
            window._game = game;
            game.init();
            game.start();
        } catch(e) {
            console.error('Game start error:', e);
            showError(ctx, e.message || String(e));
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() { startMarioGame(); });
    } else {
        startMarioGame();
    }
})();