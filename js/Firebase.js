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
