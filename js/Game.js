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

        if (this.scene) {
            this.scene.update(dt);
            this.scene.draw(this.ctx);
        }

        Input.clearFrame();
        requestAnimationFrame(t => this._loop(t));
    }
}
