const DEMO_PROJECT = 'demo-tracker';
const initializedClients = new WeakMap();
function endpoint(value, port, label) {
  if (typeof value !== 'string') throw new Error(`${label} is required in emulator mode.`);
  const match = /^(localhost|127\.0\.0\.1|10\.0\.2\.2):(\d+)$/.exec(value);
  if (!match || Number(match[2]) !== port) throw new Error(`${label} must be localhost, 127.0.0.1 or 10.0.2.2 on port ${port}.`);
  return {
    host: match[1],
    port
  };
}
function resolveEnvironment(extra = {}, {
  isDevelopment = false
} = {}) {
  const mode = extra.firebaseMode || 'production';
  if (!['production', 'emulator'].includes(mode)) throw new Error('Select firebaseMode production or emulator explicitly.');
  if (mode === 'production') {
    if (isDevelopment) throw new Error('Development builds require explicit emulator configuration; production access is disabled.');
    if (!extra.firebaseProjectId || extra.firebaseProjectId.startsWith('demo-')) throw new Error('A real Firebase project is required for a production release.');
    if (extra.firebaseAuthEmulatorHost || extra.firebaseFirestoreEmulatorHost) throw new Error('Production mode cannot contain emulator endpoints.');
    return {
      mode,
      projectId: extra.firebaseProjectId,
      appName: '[DEFAULT]',
      userStorageKey: '@user'
    };
  }
  if (extra.firebaseProjectId !== DEMO_PROJECT) throw new Error('Emulator mode requires project demo-tracker; real projects are rejected.');
  return {
    mode,
    projectId: DEMO_PROJECT,
    appName: 'tracker-emulator',
    userStorageKey: '@tracker/emulator/demo-tracker/user',
    auth: endpoint(extra.firebaseAuthEmulatorHost, 9099, 'Auth emulator endpoint'),
    firestore: endpoint(extra.firebaseFirestoreEmulatorHost, 8080, 'Firestore emulator endpoint')
  };
}
function initializeFirebase(extra, runtime, sdk) {
  // Every environment choice is checked before even looking up an SDK app.
  const environment = resolveEnvironment(extra, runtime);
  if (runtime.clientName && environment.mode === 'emulator') environment.appName = `tracker-emulator-${runtime.clientName}`;
  const existing = sdk.getApps().find(app => app.name === environment.appName);
  const signature = JSON.stringify(environment);
  if (existing) {
    if (existing.options?.projectId !== environment.projectId || initializedClients.get(existing) !== signature) {
      throw new Error('Existing Firebase app is unverified or has conflicting project/endpoints; restart the app.');
    }
    return {
      app: existing,
      auth: sdk.getAuth(existing),
      db: sdk.getFirestore(existing),
      environment
    };
  }
  const local = environment.mode === 'emulator';
  const config = local ? {
    projectId: DEMO_PROJECT,
    apiKey: 'demo-tracker-local-key',
    authDomain: 'demo-tracker.local',
    appId: 'demo-tracker-local-app'
  } : {
    apiKey: extra.firebaseApiKey,
    authDomain: extra.firebaseAuthDomain,
    projectId: extra.firebaseProjectId,
    storageBucket: extra.firebaseStorageBucket,
    messagingSenderId: extra.firebaseMessagingSenderId,
    appId: extra.firebaseAppId
  };
  const app = sdk.initializeApp(config, environment.appName);
  const auth = local ? sdk.initializeAuth(app, {
    persistence: sdk.inMemoryPersistence
  }) : sdk.productionAuth(app);
  const db = sdk.initializeFirestore(app, local ? {
    localCache: sdk.memoryLocalCache(),
    ...(runtime.platform === 'android' ? {
      experimentalForceLongPolling: true
    } : {})
  } : sdk.productionCache());
  if (local) {
    sdk.connectAuthEmulator(auth, `http://${environment.auth.host}:${environment.auth.port}`, {
      disableWarnings: true
    });
    sdk.connectFirestoreEmulator(db, environment.firestore.host, environment.firestore.port);
  }
  initializedClients.set(app, signature);
  return {
    app,
    auth,
    db,
    environment
  };
}
module.exports = {
  DEMO_PROJECT,
  resolveEnvironment,
  initializeFirebase
};
