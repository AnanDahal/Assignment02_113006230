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
