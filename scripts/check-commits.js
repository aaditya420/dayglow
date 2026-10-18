'use strict';
// Checks a pull request title and its commit subjects against Conventional Commits 1.0.0.
// Usage (CI): PR_TITLE="feat: ..." node scripts/check-commits.js <base-sha> <head-sha>
const { execFileSync } = require('child_process');

const TYPES = ['feat', 'fix', 'perf', 'refactor', 'docs', 'test', 'build', 'ci', 'chore', 'style', 'revert'];
const MAX_HEADER = 100;
const HEADER = new RegExp(`^(${TYPES.join('|')})(\\([a-z0-9][a-z0-9-]*\\))?(!)?: (\\S.*)$`);

/** Returns null when the header is valid, otherwise a short reason. */
function checkHeader(header){
  if (!header) return 'empty message';
  if (header.length > MAX_HEADER) return `header is ${header.length} characters (max ${MAX_HEADER})`;
  const m = HEADER.exec(header);
  if (!m) return `expected "<type>(<scope>)?: <subject>" with type one of ${TYPES.join(', ')}`;
  if (/\.$/.test(m[4])) return 'subject ends with a period';
  return null;
}

function main(){
  const [base, head] = process.argv.slice(2);
  const problems = [];
  const title = process.env.PR_TITLE;
  if (title !== undefined){
    const why = checkHeader(title.trim());
    if (why) problems.push(`PR title "${title}": ${why}`);
  }
  if (base && head){
    const out = execFileSync('git', ['log', '--no-merges', '--format=%H%x09%s', `${base}..${head}`], { encoding: 'utf8' });
    for (const line of out.split('\n').filter(Boolean)){
      const [sha, subject] = line.split('\t');
      const why = checkHeader(subject);
      if (why) problems.push(`${sha.slice(0, 7)} "${subject}": ${why}`);
    }
  }
  if (problems.length){
    for (const p of problems) console.error(`::error::${p}`);
    console.error('\nSee "Commits and pull requests" in CLAUDE.md or https://www.conventionalcommits.org/en/v1.0.0/');
    process.exit(1);
  }
  console.log('Conventional Commits: OK');
}

if (require.main === module) main();
module.exports = { checkHeader, TYPES, MAX_HEADER };
