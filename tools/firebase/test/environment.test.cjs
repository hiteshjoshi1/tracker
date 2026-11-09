const {
  test
} = require('node:test');
const assert = require('node:assert/strict');
const {
  resolveEnvironment,
  initializeFirebase
} = require('../../../config/firebaseEnvironment.cjs');
const {
  assertLocal
} = require('../lib/local.cjs');
const local = {
  firebaseMode: 'emulator',
  firebaseProjectId: 'demo-tracker',
  firebaseAuthEmulatorHost: '127.0.0.1:9099',
  firebaseFirestoreEmulatorHost: '127.0.0.1:8080'
};
for (const host of ['localhost', '127.0.0.1', '10.0.2.2']) test(`accepts explicit demo-only ${host} routing`, () => {
  const env = resolveEnvironment({
    ...local,
    firebaseAuthEmulatorHost: `${host}:9099`,
    firebaseFirestoreEmulatorHost: `${host}:8080`
  }, {
    isDevelopment: true
  });
  assert.equal(env.mode, 'emulator');
  assert.notEqual(env.userStorageKey, '@user');
});
for (const [label, patch] of Object.entries({
  'production project': {
    firebaseProjectId: 'real-project'
  },
  'missing project': {
    firebaseProjectId: undefined
  },
  'missing auth': {
    firebaseAuthEmulatorHost: undefined
  },
  'missing firestore': {
    firebaseFirestoreEmulatorHost: undefined
  },
  'public host': {
    firebaseFirestoreEmulatorHost: 'firestore.googleapis.com:8080'
  },
  'URL instead of host': {
    firebaseAuthEmulatorHost: 'http://localhost:9099'
  },
  'wrong port': {
    firebaseFirestoreEmulatorHost: 'localhost:443'
  },
  'unknown mode': {
    firebaseMode: 'staging'
  },
  'host suffix': {
    firebaseFirestoreEmulatorHost: 'localhost.evil.test:8080'
  }
})) test(`rejects ${label} before touching SDK`, () => {
  let touched = false;
  assert.throws(() => initializeFirebase({
    ...local,
    ...patch
  }, {
    isDevelopment: true
  }, {
    getApps: () => {
      touched = true;
      return [];
    }
  }));
  assert.equal(touched, false);
});
test('debug mode cannot select default/explicit production, while ordinary release remains possible', () => {
  const prod = {
    firebaseProjectId: 'existing-personal-project'
  };
  assert.throws(() => resolveEnvironment(prod, {
    isDevelopment: true
  }), /Development/);
  assert.throws(() => resolveEnvironment({
    ...prod,
    firebaseMode: 'production'
  }, {
    isDevelopment: true
  }), /Development/);
  assert.equal(resolveEnvironment(prod).mode, 'production');
  assert.throws(() => resolveEnvironment({
    ...prod,
    firebaseAuthEmulatorHost: 'localhost:9099'
  }), /Production mode/);
});
test('connects both emulators before returning a client, with named app and memory persistence', () => {
  const events = [];
  const app = {
    name: 'tracker-emulator',
    options: {
      projectId: 'demo-tracker'
    }
  };
  const auth = {};
  const db = {};
  const client = initializeFirebase(local, {
    isDevelopment: true
  }, {
    getApps: () => [],
    initializeApp: (config, name) => {
      assert.equal(config.projectId, 'demo-tracker');
      assert.equal(name, 'tracker-emulator');
      events.push('app');
      return app;
    },
    initializeAuth: (_app, options) => {
      assert.equal(options.persistence, 'memory');
      events.push('auth');
      return auth;
    },
    inMemoryPersistence: 'memory',
    initializeFirestore: (_app, options) => {
      assert.equal(options.localCache, 'memory-cache');
      events.push('db');
      return db;
    },
    memoryLocalCache: () => 'memory-cache',
    connectAuthEmulator: (instance, url) => {
      assert.equal(instance, auth);
      assert.equal(url, 'http://127.0.0.1:9099');
      events.push('connect-auth');
    },
    connectFirestoreEmulator: (instance, host, port) => {
      assert.equal(instance, db);
      assert.equal(host, '127.0.0.1');
      assert.equal(port, 8080);
      events.push('connect-db');
    }
  });
  assert.equal(client.app, app);
  assert.deepEqual(events, ['app', 'auth', 'db', 'connect-auth', 'connect-db']);
});
test('unverified app name collisions and wrong project cannot be reused', () => {
  for (const projectId of ['real-project', 'demo-tracker']) assert.throws(() => initializeFirebase(local, {
    isDevelopment: true
  }, {
    getApps: () => [{
      name: 'tracker-emulator',
      options: {
        projectId
      }
    }]
  }), /unverified/);
});
test('only successfully connected apps can be reused, with unchanged endpoints', () => {
  const app = {
    name: 'tracker-emulator',
    options: {
      projectId: 'demo-tracker'
    }
  };
  let apps = [];
  let connects = 0;
  const sdk = {
    getApps: () => apps,
    initializeApp: () => {
      apps = [app];
      return app;
    },
    initializeAuth: () => 'auth',
    initializeFirestore: () => 'db',
    memoryLocalCache: () => 'memory',
    inMemoryPersistence: 'memory',
    connectAuthEmulator: () => {
      connects++;
    },
    connectFirestoreEmulator: () => {
      connects++;
    },
    getAuth: () => 'auth',
    getFirestore: () => 'db'
  };
  initializeFirebase(local, {
    isDevelopment: true
  }, sdk);
  assert.equal(initializeFirebase(local, {
    isDevelopment: true
  }, sdk).app, app);
  assert.equal(connects, 2);
  assert.throws(() => initializeFirebase({
    ...local,
    firebaseAuthEmulatorHost: 'localhost:9099'
  }, {
    isDevelopment: true
  }, sdk), /conflicting/);
});
test('failed connection leaves an app that cannot be reused with cloud defaults', () => {
  const app = {
    name: 'tracker-emulator',
    options: {
      projectId: 'demo-tracker'
    }
  };
  let apps = [];
  const sdk = {
    getApps: () => apps,
    initializeApp: () => {
      apps = [app];
      return app;
    },
    initializeAuth: () => 'auth',
    initializeFirestore: () => 'db',
    memoryLocalCache: () => 'memory',
    connectAuthEmulator: () => {
      throw new Error('No local transport');
    }
  };
  assert.throws(() => initializeFirebase(local, {
    isDevelopment: true
  }, sdk), /No local transport/);
  assert.throws(() => initializeFirebase(local, {
    isDevelopment: true
  }, sdk), /unverified/);
});
test('tool reset/seed rejects real projects or non-loopback endpoints', () => {
  for (const env of [{
    GCLOUD_PROJECT: 'production'
  }, {
    GOOGLE_CLOUD_PROJECT: 'production'
  }, {
    FIREBASE_PROJECT_ID: 'production'
  }, {
    FIRESTORE_EMULATOR_HOST: 'example.com:8080'
  }, {
    FIREBASE_AUTH_EMULATOR_HOST: '10.0.2.2:9099'
  }]) assert.throws(() => assertLocal(env));
  assert.doesNotThrow(() => assertLocal({
    GCLOUD_PROJECT: 'demo-tracker',
    FIRESTORE_EMULATOR_HOST: '127.0.0.1:8080',
    FIREBASE_AUTH_EMULATOR_HOST: 'localhost:9099'
  }));
});
