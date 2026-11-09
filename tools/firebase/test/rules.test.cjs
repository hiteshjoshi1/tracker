const { before, after, describe, test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const { initializeTestEnvironment, assertFails, assertSucceeds } = require('@firebase/rules-unit-testing');
const {
  collection, doc, setDoc, getDoc, getDocs, updateDoc, deleteDoc, deleteField,
  query, where, orderBy, onSnapshot, Timestamp, writeBatch,
} = require('firebase/firestore');

const collections = ['goals', 'goodDeeds', 'reflections', 'habits', 'quotes'];
const date = Timestamp.fromDate(new Date('2026-01-15T12:00:00Z'));
const data = userId => ({ userId, text: 'Synthetic fixture', name: 'Fixture', date, createdAt: date, updatedAt: date, completed: false, favorite: true });
let env;
let alice;
let bob;
let anonymous;

// Fail closed: this test suite never initializes the app or a real Firebase project.
before(async () => {
  const host = process.env.FIRESTORE_EMULATOR_HOST;
  assert.match(host || '', /^(127\.0\.0\.1|localhost):\d+$/, 'Start via npm run test:rules; a loopback Firestore emulator is required.');
  const [hostname, port] = host.split(':');
  env = await initializeTestEnvironment({
    projectId: 'demo-tracker',
    firestore: { host: hostname, port: Number(port), rules: readFileSync(resolve(__dirname, '../../../firestore.rules'), 'utf8') },
  });
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async context => {
    const db = context.firestore();
    for (const name of collections) {
      await setDoc(doc(db, name, 'alice'), data('alice'));
      await setDoc(doc(db, name, 'bob'), data('bob'));
    }
    await setDoc(doc(db, 'unknown', 'private'), data('alice'));
    await setDoc(doc(db, 'goals', 'alice', 'unknown', 'nested'), data('alice'));
  });
  alice = env.authenticatedContext('alice').firestore();
  bob = env.authenticatedContext('bob').firestore();
  anonymous = env.unauthenticatedContext().firestore();
});

after(async () => { if (env) await env.cleanup(); });

function firstSnapshot(target) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => { unsubscribe(); reject(new Error('Listener timed out')); }, 5000);
    const unsubscribe = onSnapshot(target,
      snapshot => { clearTimeout(timer); unsubscribe(); resolve(snapshot); },
      error => { clearTimeout(timer); unsubscribe(); reject(error); });
  });
}

for (const name of collections) {
  describe(name, () => {
    test('unauthenticated get, query, listener, create, update and delete fail', async () => {
      const record = doc(anonymous, name, 'alice');
      await assertFails(getDoc(record));
      await assertFails(getDocs(query(collection(anonymous, name), where('userId', '==', 'alice'))));
      await assertFails(firstSnapshot(record));
      await assertFails(setDoc(doc(anonymous, name, 'anonymous-create'), data('alice')));
      await assertFails(updateDoc(record, { text: 'forbidden' }));
      await assertFails(deleteDoc(record));
    });

    test('owners can read only their own records and filtered queries/listeners', async () => {
      for (const [db, uid] of [[alice, 'alice'], [bob, 'bob']]) {
        assert.equal((await assertSucceeds(getDoc(doc(db, name, uid)))).data().userId, uid);
        const owned = query(collection(db, name), where('userId', '==', uid));
        const result = await assertSucceeds(getDocs(owned));
        assert.ok(result.docs.length > 0);
        assert.ok(result.docs.every(record => record.data().userId === uid));
        await assertSucceeds(firstSnapshot(owned));
      }
    });

    test('cross-user direct access, query and document/query listeners fail both ways', async () => {
      for (const [db, other] of [[alice, 'bob'], [bob, 'alice']]) {
        await assertFails(getDoc(doc(db, name, other)));
        const unowned = query(collection(db, name), where('userId', '==', other));
        await assertFails(getDocs(unowned));
        await assertFails(firstSnapshot(unowned));
        await assertFails(firstSnapshot(doc(db, name, other)));
      }
    });

    test('unfiltered queries cannot read every user’s records', async () => {
      await assertFails(getDocs(collection(alice, name)));
      await assertFails(getDocs(query(collection(alice, name), where('userId', 'in', ['alice', 'bob']))));
    });

    test('owner create, update, merge and delete succeed', async () => {
      const record = doc(alice, name, 'owner-crud');
      await assertSucceeds(setDoc(record, data('alice')));
      await assertSucceeds(updateDoc(record, { text: 'changed' }));
      await assertSucceeds(setDoc(record, { text: 'merged' }, { merge: true }));
      assert.equal((await getDoc(record)).data().text, 'merged');
      await assertSucceeds(deleteDoc(record));
    });

    test('forged creates with another, missing or invalid owner fail', async () => {
      for (const userId of ['bob', null, 123]) {
        await assertFails(setDoc(doc(alice, name, 'forged-create'), { ...data('alice'), userId }));
      }
      const { userId, ...missingOwner } = data('alice');
      await assertFails(setDoc(doc(alice, name, 'missing-owner'), missingOwner));
    });

    test('cross-user update, overwrite, owner-claim and delete fail both ways', async () => {
      for (const [db, uid, other] of [[alice, 'alice', 'bob'], [bob, 'bob', 'alice']]) {
        const record = doc(db, name, other);
        await assertFails(updateDoc(record, { text: 'forbidden' }));
        await assertFails(setDoc(record, data(uid)));
        await assertFails(setDoc(record, { userId: uid }, { merge: true }));
        await assertFails(deleteDoc(record));
      }
    });

    test('owner cannot transfer, remove or invalidate ownership', async () => {
      const record = doc(alice, name, 'alice');
      for (const userId of ['bob', null, 123, deleteField()]) {
        await assertFails(updateDoc(record, { userId }));
      }
      const { userId, ...missingOwner } = data('alice');
      await assertFails(setDoc(record, missingOwner));
      assert.equal((await getDoc(record)).data().userId, 'alice');
    });

    test('a batch cannot hide an unauthorized write among valid changes', async () => {
      const batch = writeBatch(alice);
      batch.update(doc(alice, name, 'alice'), { text: 'must not commit' });
      batch.update(doc(alice, name, 'bob'), { text: 'forbidden' });
      await assertFails(batch.commit());
      assert.equal((await getDoc(doc(alice, name, 'alice'))).data().text, 'Synthetic fixture');
    });

    test('client-style date range reads and date listeners remain allowed', async () => {
      const ranged = query(collection(alice, name), where('userId', '==', 'alice'), where('date', '>=', date), where('date', '<=', date));
      await assertSucceeds(getDocs(ranged));
      await assertSucceeds(firstSnapshot(ranged));
    });
  });
}

test('habit name sorting and quote favorite/newest queries remain allowed', async () => {
  await assertSucceeds(getDocs(query(collection(alice, 'habits'), where('userId', '==', 'alice'), orderBy('name'))));
  for (const favoriteOnly of [false, true]) {
    const constraints = [where('userId', '==', 'alice')];
    if (favoriteOnly) constraints.push(where('favorite', '==', true));
    constraints.push(orderBy('favorite', 'desc'), orderBy('createdAt', 'desc'));
    await assertSucceeds(getDocs(query(collection(alice, 'quotes'), ...constraints)));
  }
  await assertSucceeds(getDocs(query(collection(alice, 'goals'), where('userId', '==', 'alice'), where('date', '<', date))));
  await assertSucceeds(getDocs(query(collection(alice, 'goals'), where('userId', '==', 'alice'), where('completed', '==', false), where('date', '<', date))));
});

test('unknown collections and nested paths deny authenticated access', async () => {
  for (const path of ['unknown/private', 'goals/alice/unknown/nested']) {
    await assertFails(getDoc(doc(alice, path)));
    await assertFails(setDoc(doc(alice, path), data('alice')));
  }
  await assertFails(getDocs(collection(alice, 'unknown')));
});
