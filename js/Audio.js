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
