// This suite exercises the service without initializing Firebase or using a project.
function loadGoalService() {
  jest.resetModules();

  class FakeTimestamp {
    private constructor(private readonly milliseconds: number) {}

    static fromDate(date: Date) {
      return new FakeTimestamp(date.getTime());
    }

    toDate() {
      return new Date(this.milliseconds);
    }
  }

  const updatedAt = { kind: 'server-timestamp' };
  const batch = {
    update: jest.fn(),
    commit: jest.fn().mockResolvedValue(undefined),
  };
  const firestore = {
    Timestamp: FakeTimestamp,
    collection: jest.fn((_db: unknown, name: string) => ({ name })),
    doc: jest.fn((collection: unknown, id: string) => ({ collection, id })),
    updateDoc: jest.fn().mockResolvedValue(undefined),
    getDocs: jest.fn(),
    where: jest.fn((field: string, operator: string, value: unknown) => ({ field, operator, value })),
    query: jest.fn((collection: unknown, ...constraints: unknown[]) => ({ collection, constraints })),
    serverTimestamp: jest.fn(() => updatedAt),
    writeBatch: jest.fn(() => batch),
  };
  jest.doMock('../config/firebase', () => ({ db: { name: 'fake-firestore' } }));
  jest.doMock('firebase/firestore', () => firestore);
  const { GoalService } = require('../services/firebaseService') as typeof import('../services/firebaseService');
  return { service: new GoalService(), firestore, batch, updatedAt };
}

test('moving a goal preserves its exact date and writes the update timestamp', async () => {
  const { service, firestore, updatedAt } = loadGoalService();
  const date = new Date('2026-01-15T17:34:56.789Z');

  await service.moveToDate('goal-to-move', date);

  // Date is a supported Firestore write value; the service must not truncate it
  // to midnight or widen Goal.date to a database-specific timestamp type.
  expect(firestore.updateDoc).toHaveBeenCalledTimes(1);
  expect(firestore.updateDoc).toHaveBeenCalledWith(
    { collection: { name: 'goals' }, id: 'goal-to-move' },
    { date, updatedAt },
  );
  expect(date.toISOString()).toBe('2026-01-15T17:34:56.789Z');
});

test('date queries keep the user filter and full local-day range and return Dates', async () => {
  const { service, firestore } = loadGoalService();
  const date = new Date(2026, 0, 15, 14, 32, 10, 123);
  firestore.getDocs.mockResolvedValue({
    docs: [{ id: 'goal', data: () => ({ date: firestore.Timestamp.fromDate(date) }) }],
  });

  const goals = await service.getItemsByDate('owner-a', date);

  expect(firestore.query).toHaveBeenCalledWith(
    { name: 'goals' },
    { field: 'userId', operator: '==', value: 'owner-a' },
    { field: 'date', operator: '>=', value: firestore.Timestamp.fromDate(new Date(2026, 0, 15)) },
    { field: 'date', operator: '<=', value: firestore.Timestamp.fromDate(new Date(2026, 0, 15, 23, 59, 59, 999)) },
  );
  expect(goals).toEqual([{ id: 'goal', date }]);
  expect(goals[0].date).toBeInstanceOf(Date);
});

test('rollover preserves exactly the legacy completed values and moves incomplete records to local midnight', async () => {
  const { service, firestore, batch, updatedAt } = loadGoalService();
  const rawRecords: Record<string, unknown>[] = [
    { completed: true },
    { completed: 1 },
    { completed: 'true' },
    { completed: false },
    { completed: 0 },
    { completed: 'false' },
    {},
    { completed: null },
    { completed: '1' },
    { completed: 'TRUE' },
    { completed: 2 },
  ];
  const docs = rawRecords.map((data, index) => ({ ref: { id: `goal-${index}` }, data: () => data }));
  firestore.getDocs.mockResolvedValue({ empty: false, docs });
  const target = new Date(2026, 0, 15, 14, 32, 10, 123);
  const midnight = firestore.Timestamp.fromDate(new Date(2026, 0, 15));

  await expect(service.rolloverUncompletedToDate('owner-a', target)).resolves.toBe(8);

  expect(firestore.query).toHaveBeenCalledWith(
    { name: 'goals' },
    { field: 'userId', operator: '==', value: 'owner-a' },
    { field: 'date', operator: '<', value: midnight },
  );
  expect(batch.update.mock.calls).toEqual(docs.slice(3).map(({ ref }) => [ref, { date: midnight, updatedAt }]));
  expect(batch.commit).toHaveBeenCalledTimes(1);
  expect(target.getHours()).toBe(14);
});

test('rollover with no past goals does not create or commit a batch', async () => {
  const { service, firestore, batch } = loadGoalService();
  firestore.getDocs.mockResolvedValue({ empty: true, docs: [] });

  await expect(service.rolloverUncompletedToDate('owner-a', new Date(2026, 0, 15))).resolves.toBe(0);

  expect(firestore.writeBatch).not.toHaveBeenCalled();
  expect(batch.commit).not.toHaveBeenCalled();
});

test('rollover reports a failed batch instead of returning an uncommitted count', async () => {
  const { service, firestore, batch } = loadGoalService();
  firestore.getDocs.mockResolvedValue({
    empty: false,
    docs: [{ ref: { id: 'goal' }, data: () => ({ completed: false }) }],
  });
  const failure = new Error('local write failed');
  batch.commit.mockRejectedValue(failure);

  await expect(service.rolloverUncompletedToDate('owner-a', new Date(2026, 0, 15))).rejects.toBe(failure);
});
