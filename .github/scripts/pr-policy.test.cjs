const { test } = require('node:test');
const assert = require('node:assert/strict');
const { validate, issueNumber } = require('./pr-policy.cjs');

function fixture() {
  const sha = 'a'.repeat(40);
  return {
    pr: {
      body: `Closes #21\n\n## Verification report\n\nCommit: ${sha}\n\nChecks: node --test\n\nResults: All policy tests pass\n\nLimitations: Phone build not applicable to metadata-only changes\n`,
      base: { ref: 'main' }, head: { ref: 'issue/21-github-backlog-workflow', sha }, draft: false,
    },
    issue: {
      number: 21, state: 'open',
      body: '### Priority\n\nP1 High\n\n### Size\n\nM (a few days)\n\n### Kind\n\nProcess\n\n### Acceptance criteria\n\n- [ ] Reject incomplete review requests.\n\n### Verification plan\n\nExercise valid and invalid metadata.\n',
    },
  };
}

test('accepts a current report and form-generated issue metadata', () => {
  const { pr, issue } = fixture();
  assert.deepEqual(validate(pr, issue), []);
});

test('rejects missing or multiple closing issue lines', () => {
  const { pr } = fixture();
  for (const body of ['', 'Closes #TODO', 'Closes #21\nCloses #22']) {
    assert.throws(() => issueNumber({ ...pr, body }), /exactly one/);
  }
});

test('rejects a branch for another issue and a non-main target', () => {
  const { pr, issue } = fixture();
  pr.head.ref = 'issue/22-other-change';
  pr.base.ref = 'develop';
  assert.equal(validate(pr, issue).length, 2);
});

test('rejects absent issue fields and non-checkbox acceptance criteria', () => {
  const { pr, issue } = fixture();
  issue.body = '## Acceptance criteria\n\nMake it work.';
  assert.equal(validate(pr, issue).length, 4);
});

test('rejects closed issues and PRs linked as issues', () => {
  const { pr, issue } = fixture();
  assert.match(validate(pr, { ...issue, state: 'closed' }).join(), /open issue/);
  assert.match(validate(pr, { ...issue, pull_request: {} }).join(), /open issue/);
});

test('allows a draft without a report but still requires issue metadata', () => {
  const { pr, issue } = fixture();
  pr.draft = true;
  pr.body = 'Closes #21';
  assert.deepEqual(validate(pr, issue), []);
  assert.ok(validate(pr, { ...issue, body: '' }).length);
});

test('rejects missing, placeholder and stale reports before review', () => {
  const { pr, issue } = fixture();
  assert.ok(validate({ ...pr, body: 'Closes #21' }, issue).length);
  assert.match(validate({ ...pr, body: pr.body.replace('All policy tests pass', 'TODO') }, issue).join(), /Complete Results/);
  assert.match(validate({ ...pr, head: { ...pr.head, sha: 'b'.repeat(40) } }, issue).join(), /current head SHA/);
});

test('an empty report field cannot consume the following field', () => {
  const { pr, issue } = fixture();
  pr.body = pr.body.replace('Checks: node --test', 'Checks:');
  assert.match(validate(pr, issue).join(), /Complete Checks/);
});
