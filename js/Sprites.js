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
                        const name = k.replace(/\.png$/i, '');
                        const rect = this._parseRect(v.textureRect || '{{0,0},{16,16}}');
                        const size = this._parseSize(v.spriteSize || '{16,16}');
                        frames[name] = {
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
        if (img) ctx.drawImage(img, dx, dy, dw, dh);
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
