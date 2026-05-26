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
