const fs = require('node:fs');

function section(body, heading) {
  return body.match(new RegExp(`^#{2,3} ${heading}\\s*\\n([\\s\\S]*?)(?=^#{2,3} |$(?![\\s\\S]))`, 'im'))?.[1]?.trim() || '';
}

function issueNumber(pr) {
  const links = [...(pr.body || '').matchAll(/^Closes #(\d+)\s*$/gm)];
  if (links.length !== 1) throw new Error('Include exactly one standalone Closes #<number> line.');
  return Number(links[0][1]);
}

function validate(pr, issue) {
  const errors = [];
  const number = issueNumber(pr);
  if (pr.base.ref !== 'main') errors.push('Target main.');
  if (!pr.head.ref.startsWith(`issue/${number}-`) || !/^issue\/\d+-[a-z0-9][a-z0-9-]*$/.test(pr.head.ref)) {
    errors.push(`Name the branch issue/${number}-<slug>.`);
  }
  if (issue.pull_request || issue.number !== number || issue.state !== 'open') errors.push('Link an open issue in this repository.');
  const body = issue.body || '';
  const choices = {
    Priority: ['P0 Critical', 'P1 High', 'P2 Medium', 'P3 Low'],
    Size: ['S (under a day)', 'M (a few days)', 'L (a week or more)'],
    Kind: ['Process', 'Security', 'CI', 'Testing', 'Feature', 'Bug', 'Tech debt', 'Documentation'],
  };
  for (const [heading, options] of Object.entries(choices)) {
    if (!options.includes(section(body, heading))) errors.push(`Set the issue's ${heading} field.`);
  }
  if (!/^- \[[ xX]\] \S/m.test(section(body, 'Acceptance criteria'))) errors.push('Give the issue checkbox acceptance criteria.');
  if (!pr.draft) {
    const report = section(pr.body || '', 'Verification report');
    for (const field of ['Commit', 'Checks', 'Results', 'Limitations']) {
      const value = report.match(new RegExp(`^${field}:[ \\t]*(.+)$`, 'im'))?.[1]?.trim();
      if (!value || /\b(TODO|TBD|PLACEHOLDER)\b/i.test(value)) errors.push(`Complete ${field} in the verification report.`);
    }
    const commit = report.match(/^Commit:[ \t]*(\S+)/im)?.[1];
    if (commit !== pr.head.sha) errors.push('Verification Commit must match the full current head SHA.');
  }
  return errors;
}

async function main() {
  const event = JSON.parse(fs.readFileSync(process.env.GITHUB_EVENT_PATH, 'utf8'));
  const repo = process.env.GITHUB_REPOSITORY;
  const api = process.env.GITHUB_API_URL || 'https://api.github.com';
  async function get(path) {
    const response = await fetch(`${api}/repos/${repo}/${path}`, {
      headers: { Authorization: `Bearer ${process.env.GH_TOKEN}`, Accept: 'application/vnd.github+json' },
      signal: AbortSignal.timeout(30000),
    });
    if (!response.ok) throw new Error(`GitHub API returned ${response.status}.`);
    return response.json();
  }
  // Read current metadata so concurrent description edits cannot validate an old report.
  const pr = await get(`pulls/${event.pull_request.number}`);
  const issue = await get(`issues/${issueNumber(pr)}`);
  const errors = validate(pr, issue);
  if (errors.length) throw new Error(errors.join('\n'));
  console.log(pr.draft ? 'Draft issue metadata is complete.' : 'Issue link and current-commit verification report are complete.');
}

module.exports = { validate, issueNumber };
if (require.main === module) main().catch(error => { console.error(error.message); process.exitCode = 1; });
