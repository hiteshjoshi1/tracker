const {
  initializeApp,
  getApps,
  deleteApp
} = require('firebase/app');
const authSDK = require('firebase/auth');
const firestoreSDK = require('firebase/firestore');
const {
  initializeFirebase
} = require('../../../config/firebaseEnvironment.cjs');
const PROJECT = 'demo-tracker';
const PASSWORD = 'Tracker-local-only-123!';
const accounts = ['alice', 'bob'];
function assertLocal(env = process.env) {
  for (const name of ['GCLOUD_PROJECT', 'GOOGLE_CLOUD_PROJECT', 'FIREBASE_PROJECT_ID']) {
    if (env[name] && env[name] !== PROJECT) throw new Error(`${name} must be demo-tracker for local tooling.`);
  }
  for (const [name, port] of [['FIRESTORE_EMULATOR_HOST', 8080], ['FIREBASE_AUTH_EMULATOR_HOST', 9099]]) {
    if (env[name] && ![`127.0.0.1:${port}`, `localhost:${port}`].includes(env[name])) throw new Error(`${name} must select the loopback emulator on ${port}.`);
  }
}
async function request(port, path, method, body) {
  assertLocal();
  const result = await fetch(`http://127.0.0.1:${port}${path}`, {
    method,
    headers: {
      Authorization: 'Bearer owner',
      'Content-Type': 'application/json'
    },
    ...(body ? {
      body: JSON.stringify(body)
    } : {}),
    signal: AbortSignal.timeout(10000)
  });
  if (!result.ok) throw new Error(`Local emulator request failed: ${result.status} ${await result.text()}`);
  return result.status === 204 ? {} : result.json();
}
async function reset() {
  assertLocal();
  await request(9099, `/emulator/v1/projects/${PROJECT}/accounts`, 'DELETE');
  await request(8080, `/emulator/v1/projects/${PROJECT}/databases/(default)/documents`, 'DELETE');
}
function client(name) {
  assertLocal();
  return initializeFirebase({
    firebaseMode: 'emulator',
    firebaseProjectId: PROJECT,
    firebaseAuthEmulatorHost: '127.0.0.1:9099',
    firebaseFirestoreEmulatorHost: '127.0.0.1:8080'
  }, {
    isDevelopment: true,
    clientName: name
  }, {
    ...authSDK,
    ...firestoreSDK,
    getApps,
    initializeApp,
    productionAuth: () => {
      throw new Error('Production auth prohibited.');
    },
    productionCache: () => {
      throw new Error('Production cache prohibited.');
    }
  });
}
async function seed() {
  assertLocal();
  await request(9099, `/identitytoolkit.googleapis.com/v1/projects/${PROJECT}/accounts:batchCreate`, 'POST', {
    users: accounts.map(name => ({
      localId: name,
      email: `${name}@tracker.test`,
      rawPassword: PASSWORD,
      displayName: `Local ${name}`,
      emailVerified: true
    })),
    allowOverwrite: true
  });
  for (const name of accounts) {
    const local = client(`seed-${name}`);
    await authSDK.signInWithEmailAndPassword(local.auth, `${name}@tracker.test`, PASSWORD);
    const date = firestoreSDK.Timestamp.fromDate(new Date('2026-01-15T12:00:00Z'));
    for (const collection of ['goals', 'goodDeeds', 'reflections', 'habits', 'quotes']) {
      await firestoreSDK.setDoc(firestoreSDK.doc(local.db, collection, `local-${name}`), {
        userId: name,
        text: 'Synthetic local fixture',
        name: 'Local test habit',
        date,
        createdAt: date,
        updatedAt: date,
        timestamp: date,
        author: 'Synthetic local author',
        completed: false,
        favorite: false,
        categories: [],
        streak: 0,
        longestStreak: 0,
        status: 'untracked',
        lastCompleted: null,
        completionHistory: {}
      });
    }
    await deleteApp(local.app);
  }
  return {
    projectId: PROJECT,
    users: accounts,
    records: 10
  };
}
module.exports = {
  PROJECT,
  PASSWORD,
  assertLocal,
  reset,
  seed,
  client
};
if (require.main === module) {
  const [command, ...rest] = process.argv.slice(2);
  if (rest.length || !['seed', 'reset'].includes(command)) {
    console.error('Usage: node lib/local.cjs seed|reset (demo-tracker loopback emulators only)');
    process.exitCode = 1;
  } else (command === 'seed' ? seed() : reset()).then(() => console.log(`Local ${command} completed for demo-tracker only.`)).catch(error => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
