const {
  test,
  before,
  after
} = require('node:test');
const assert = require('node:assert/strict');
const {
  deleteApp
} = require('firebase/app');
const {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut
} = require('firebase/auth');
const {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  getDocs,
  onSnapshot,
  Timestamp
} = require('firebase/firestore');
const {
  reset,
  seed,
  client,
  PASSWORD,
  assertLocal
} = require('../lib/local.cjs');
let alice, bob;
before(async () => {
  assertLocal();
  assert.match(process.env.FIRESTORE_EMULATOR_HOST || '', /^(127\.0\.0\.1|localhost):8080$/);
  assert.match(process.env.FIREBASE_AUTH_EMULATOR_HOST || '', /^(127\.0\.0\.1|localhost):9099$/);
  await reset();
  await seed();
  alice = client('smoke-alice');
  bob = client('smoke-bob');
});
after(async () => {
  await Promise.all([alice, bob].filter(Boolean).map(c => deleteApp(c.app)));
});
test('local synthetic login reaches seeded account and logout clears auth', async () => {
  await signInWithEmailAndPassword(alice.auth, 'alice@tracker.test', PASSWORD);
  assert.equal(alice.auth.currentUser.uid, 'alice');
  assert.equal((await getDoc(doc(alice.db, 'goals', 'local-alice'))).data().userId, 'alice');
  await signOut(alice.auth);
  assert.equal(alice.auth.currentUser, null);
  await assert.rejects(() => getDoc(doc(alice.db, 'goals', 'local-alice')), /permission/i);
  await signInWithEmailAndPassword(alice.auth, 'alice@tracker.test', PASSWORD);
});
test('second local account cannot read Alice records or change ownership', async () => {
  await signInWithEmailAndPassword(bob.auth, 'bob@tracker.test', PASSWORD);
  assert.equal(bob.auth.currentUser.uid, 'bob');
  await assert.rejects(() => getDoc(doc(bob.db, 'goals', 'local-alice')), /permission/i);
  await assert.rejects(() => updateDoc(doc(alice.db, 'goals', 'local-alice'), {
    userId: 'bob'
  }), /permission/i);
  const owned = await getDocs(query(collection(bob.db, 'goals'), where('userId', '==', 'bob')));
  assert.equal(owned.size, 1);
});
test('owner CRUD and a live filtered subscription work against emulators', async () => {
  const ref = doc(alice.db, 'goals', 'smoke-created');
  const date = Timestamp.fromDate(new Date('2026-01-15T12:00:00Z'));
  await setDoc(ref, {
    userId: 'alice',
    text: 'Local only',
    date,
    createdAt: date,
    updatedAt: date,
    completed: false
  });
  await new Promise((resolve, reject) => {
    let stop;
    const timer = setTimeout(() => {
      stop?.();
      reject(new Error('Subscription did not receive the local update.'));
    }, 10000);
    stop = onSnapshot(query(collection(alice.db, 'goals'), where('userId', '==', 'alice')), snapshot => {
      if (snapshot.docs.some(d => d.id === 'smoke-created' && d.data().completed)) {
        clearTimeout(timer);
        stop();
        resolve();
      }
    }, error => {
      clearTimeout(timer);
      reject(error);
    });
    updateDoc(ref, {
      completed: true
    }).catch(reject);
  });
  assert.equal((await getDoc(ref)).data().completed, true);
  await deleteDoc(ref);
  assert.equal((await getDocs(query(collection(alice.db, 'goals'), where('userId', '==', 'alice')))).docs.some(d => d.id === 'smoke-created'), false);
});
test('local email signup creates only a synthetic emulator account', async () => {
  const signup = client('signup');
  try {
    const credential = await createUserWithEmailAndPassword(signup.auth, 'signup@tracker.test', PASSWORD);
    assert.equal(credential.user.email, 'signup@tracker.test');
    await signOut(signup.auth);
    assert.equal(signup.auth.currentUser, null);
  } finally {
    await deleteApp(signup.app);
  }
});
test('goal date updates accept Date values and retain owner/date query behavior', async () => {
  const ref = doc(alice.db, 'goals', 'smoke-date-move');
  const originalDate = Timestamp.fromDate(new Date('2026-01-14T12:00:00.000Z'));
  const movedDate = new Date('2026-01-15T17:34:56.789Z');
  try {
    await setDoc(ref, {
      userId: 'alice',
      text: 'Date storage regression',
      date: originalDate,
      createdAt: originalDate,
      updatedAt: originalDate,
      completed: false
    });
    // GoalService.moveToDate forwards the domain Date through updateItem.
    await updateDoc(ref, { date: movedDate });
    const stored = (await getDoc(ref)).data().date;
    assert.ok(stored instanceof Timestamp);
    assert.equal(stored.toMillis(), movedDate.getTime());
    const movedGoals = await getDocs(query(
      collection(alice.db, 'goals'),
      where('userId', '==', 'alice'),
      where('date', '>=', Timestamp.fromDate(new Date('2026-01-15T00:00:00.000Z'))),
      where('date', '<=', Timestamp.fromDate(new Date('2026-01-15T23:59:59.999Z')))
    ));
    assert.ok(movedGoals.docs.some(goal => goal.id === ref.id));
    await assert.rejects(() => getDoc(doc(bob.db, 'goals', ref.id)), /permission/i);
    await assert.rejects(() => updateDoc(ref, { userId: 'bob' }), /permission/i);
  } finally {
    await deleteDoc(ref);
  }
});
test('safe reset and reseed reproduce stable accounts and ten fixtures', async () => {
  await signOut(alice.auth);
  await signOut(bob.auth);
  await reset();
  await seed();
  await signInWithEmailAndPassword(alice.auth, 'alice@tracker.test', PASSWORD);
  assert.equal(alice.auth.currentUser.uid, 'alice');
  for (const name of ['goals', 'goodDeeds', 'reflections', 'habits', 'quotes']) assert.equal((await getDocs(query(collection(alice.db, name), where('userId', '==', 'alice')))).size, 1);
});
