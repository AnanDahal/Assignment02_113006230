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
