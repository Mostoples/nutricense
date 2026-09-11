/* ============================================
   NUTRICENSE - Firebase Configuration

   DUA PROJECT, sengaja dipisah:
     • Hosting  -> project "nutricense" (nutricense.web.app)
     • Auth +
       Firestore -> project "nutrilense-ab3b7"  (config di bawah)

   Auth ikut pindah bersama Firestore, bukan pilihan gaya:
   firestore.rules memakai request.auth, dan token terbitan satu
   project tidak dikenali rules project lain. Memisah keduanya
   membuat semua tulisan terbaca sebagai tidak terautentikasi.

   Hosting tidak terikat config ini sama sekali — ia hanya
   menyajikan berkas statis, jadi tetap di project lama.
   ============================================ */

// ─── Firebase SDK (Modular via CDN compat) ─────────────────────────────────
import { initializeApp }             from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore,
         collection, addDoc, getDocs,
         doc, setDoc, updateDoc,
         query, orderBy, limit,
         onSnapshot, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getAuth,
         signInWithPopup, signOut,
         onAuthStateChanged,
         GoogleAuthProvider,
         signInWithEmailAndPassword,
         createUserWithEmailAndPassword,
         signInAnonymously }           from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getAnalytics,
         isSupported }                 from "https://www.gstatic.com/firebasejs/10.12.2/firebase-analytics.js";

// ─── Firebase Config (from config.js) ──────────────────────────────────────
const firebaseConfig = {
  apiKey:            "AIzaSyDjLnkLV7SqlcyB-uQ0CtNXrLaasbfL3R4",
  authDomain:        "nutrilense-ab3b7.firebaseapp.com",
  databaseURL:       "https://nutrilense-ab3b7-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId:         "nutrilense-ab3b7",
  storageBucket:     "nutrilense-ab3b7.firebasestorage.app",
  messagingSenderId: "686663396068",
  appId:             "1:686663396068:web:23ff52e84be1a94aa7daf1",
  measurementId:     "G-1CLNP3NW02"
};

// ─── Initialize ─────────────────────────────────────────────────────────────
const app  = initializeApp(firebaseConfig);
const db   = getFirestore(app);
const auth = getAuth(app);

/* Analytics dijaga isSupported(): pada mode privat, peramban tanpa
   IndexedDB, atau konteks non-browser, getAnalytics() melempar dan
   akan menggagalkan seluruh modul ini. Hapus blok ini bila
   pengumpulan data tidak diinginkan. */
isSupported()
  .then((ok) => { if (ok) getAnalytics(app); })
  .catch(() => { /* analytics tidak tersedia — abaikan */ });

// ─── Auth Providers ─────────────────────────────────────────────────────────
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

// ═══════════════════════════════════════════════════════════════════════════
//  AUTH SERVICE
// ═══════════════════════════════════════════════════════════════════════════
const AuthService = {

  /** Sign in with Google popup */
  async signInGoogle() {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      return { user: result.user, error: null };
    } catch (err) {
      return { user: null, error: err.message };
    }
  },

  /** Sign in with Email + Password */
  async signInEmail(email, password) {
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      return { user: cred.user, error: null };
    } catch (err) {
      return { user: null, error: err.message };
    }
  },

  /** Register new account with Email + Password */
  async registerEmail(email, password) {
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      return { user: cred.user, error: null };
    } catch (err) {
      return { user: null, error: err.message };
    }
  },

  /** Sign in anonymously (guest / device mode) */
  async signInAnonymous() {
    try {
      const cred = await signInAnonymously(auth);
      return { user: cred.user, error: null };
    } catch (err) {
      return { user: null, error: err.message };
    }
  },

  /** Sign out */
  async logout() {
    try {
      await signOut(auth);
      return { error: null };
    } catch (err) {
      return { error: err.message };
    }
  },

  /** Watch auth state change */
  onAuthChange(callback) {
    return onAuthStateChanged(auth, callback);
  },

  /** Get current user */
  currentUser() {
    return auth.currentUser;
  },
};

// ═══════════════════════════════════════════════════════════════════════════
//  FIRESTORE SERVICE
// ═══════════════════════════════════════════════════════════════════════════
const FirestoreService = {

  /* ── Collection references ── */
  col: {
    scans:    ()        => collection(db, "scans"),
    sensors:  ()        => collection(db, "sensorLogs"),
    users:    ()        => collection(db, "users"),
    schools:  ()        => collection(db, "schools"),
    alerts:   ()        => collection(db, "alerts"),
  },

  /* ─────────────────────────────────────────────────────────────────────
     SCAN LOGS  (collection: scans)
  ───────────────────────────────────────────────────────────────────── */

  /** Save a completed scan result to Firestore */
  async saveScan(scanData, user) {
    try {
      const payload = {
        ...scanData,
        createdAt:  serverTimestamp(),
        userId:     user ? user.uid          : "anonymous",
        userEmail:  user ? (user.email || "anonymous") : "anonymous",
        isAnon:     user ? user.isAnonymous  : true,
        schoolId:   "SFP-7729",
        deviceId:   "NC-BOX-09X",
      };
      const docRef = await addDoc(this.col.scans(), payload);
      return { id: docRef.id, error: null };
    } catch (err) {
      console.error("[Firestore] saveScan error:", err);
      return { id: null, error: err.message };
    }
  },

  /** Fetch latest N scans (ordered by createdAt desc) */
  async getRecentScans(limitCount = 50) {
    try {
      const q = query(
        this.col.scans(),
        orderBy("createdAt", "desc"),
        limit(limitCount)
      );
      const snap = await getDocs(q);
      return {
        data: snap.docs.map(d => ({ id: d.id, ...d.data() })),
        error: null,
      };
    } catch (err) {
      console.error("[Firestore] getRecentScans error:", err);
      return { data: [], error: err.message };
    }
  },

  /** Real-time listener on latest scans */
  subscribeScans(limitCount = 20, callback) {
    const q = query(
      this.col.scans(),
      orderBy("createdAt", "desc"),
      limit(limitCount)
    );
    return onSnapshot(q, (snap) => {
      const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      callback(docs);
    });
  },

  /* ─────────────────────────────────────────────────────────────────────
     SENSOR LOGS  (collection: sensorLogs)
  ───────────────────────────────────────────────────────────────────── */

  /** Save a sensor telemetry snapshot */
  async saveSensorLog(snapshot) {
    try {
      const payload = {
        temperature: snapshot.temperature,
        ph:          snapshot.ph,
        gas:         snapshot.gas,
        humidity:    snapshot.humidity,
        deviceId:    "NC-BOX-09X",
        schoolId:    "SFP-7729",
        createdAt:   serverTimestamp(),
      };
      const docRef = await addDoc(this.col.sensors(), payload);
      return { id: docRef.id, error: null };
    } catch (err) {
      console.error("[Firestore] saveSensorLog error:", err);
      return { id: null, error: err.message };
    }
  },

  /** Fetch recent sensor logs */
  async getRecentSensorLogs(limitCount = 100) {
    try {
      const q = query(
        this.col.sensors(),
        orderBy("createdAt", "desc"),
        limit(limitCount)
      );
      const snap = await getDocs(q);
      return {
        data: snap.docs.map(d => ({ id: d.id, ...d.data() })),
        error: null,
      };
    } catch (err) {
      return { data: [], error: err.message };
    }
  },

  /* ─────────────────────────────────────────────────────────────────────
     USERS  (collection: users)
  ───────────────────────────────────────────────────────────────────── */

  /** Upsert user profile document on login */
  async upsertUserProfile(user) {
    if (!user) return;
    try {
      const userRef = doc(db, "users", user.uid);
      await setDoc(userRef, {
        uid:         user.uid,
        email:       user.email       || null,
        displayName: user.displayName || "Anonymous User",
        photoURL:    user.photoURL    || null,
        isAnon:      user.isAnonymous,
        lastLogin:   serverTimestamp(),
        role:        "officer",        // default role
        schoolId:    "SFP-7729",
      }, { merge: true });
    } catch (err) {
      console.error("[Firestore] upsertUserProfile error:", err);
    }
  },

  /* ─────────────────────────────────────────────────────────────────────
     ALERTS  (collection: alerts)
  ───────────────────────────────────────────────────────────────────── */

  /** Log a critical food safety alert */
  async saveAlert(alertData, user) {
    try {
      const payload = {
        ...alertData,
        resolvedAt: null,
        resolved:   false,
        userId:     user ? user.uid : "system",
        deviceId:   "NC-BOX-09X",
        schoolId:   "SFP-7729",
        createdAt:  serverTimestamp(),
      };
      const docRef = await addDoc(this.col.alerts(), payload);
      return { id: docRef.id, error: null };
    } catch (err) {
      return { id: null, error: err.message };
    }
  },

  /** Mark alert as resolved */
  async resolveAlert(alertId) {
    try {
      const ref = doc(db, "alerts", alertId);
      await updateDoc(ref, {
        resolved:   true,
        resolvedAt: serverTimestamp(),
      });
      return { error: null };
    } catch (err) {
      return { error: err.message };
    }
  },
};

// ─── Exports ────────────────────────────────────────────────────────────────
export { app, db, auth, AuthService, FirestoreService };
