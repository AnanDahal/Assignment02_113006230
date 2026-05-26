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
