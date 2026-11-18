/* The progress a device keeps is filed under the names of the lessons (their grade, their unit's name, the night's name:
   see tpCourse.store), not their numbers. So a name the site has used must stay findable: this fails when one of the
   names on tests/lesson-names.json is no longer in the lessons and is not written in window.__tpRenamed
   (project/tp-grades.js) either, renamed or taken out on purpose. It also fails when two playable steps share a name,
   and when a playable step's name is not on the list yet: `node tests/test-names.js --write` adds the new names (it
   never takes any away). */
process.chdir(require('path').join(__dirname, '..')); // paths below are from the repository root
global.window = global;
require('../project/tp-course.js');
require('../project/tp-grades.js');
const fs = require('fs');
const C = window.tpCourse;
const LIST = 'tests/lesson-names.json';
const problems = [];

/* the names of the steps a child can play now */
const now = { nights: new Set(), checks: new Set() };
for (const g of C.ORDER()) {
  for (const s of C.sessions(g)) {
    if (!s.ready) continue;
    const name = C.keptName(s);
    const unit = (C.unit(g, s.unit) || {}).gn || '';
    if (!name) { problems.push(`${s.id}: a step a child can play has no name to keep its progress under`); continue; }
    if (/ \/ |^\s|\s$/.test(unit) || (s.kind === 'night' && / \/ |^\s|\s$/.test(s.gn))) {
      problems.push(`${s.id}: «${name}»: a unit's or night's name may not hold « / » nor begin or end with a space`);
    }
    const set = s.kind === 'check' ? now.checks : now.nights;
    if (set.has(name)) problems.push(`two steps are named «${name}»: their progress would be kept as one`);
    set.add(name);
    if ((C.keptStep(name, s.kind) || {}).id !== s.id) problems.push(`«${name}» does not lead back to ${s.id} (an entry in window.__tpRenamed sends it elsewhere?)`);
  }
}

/* every name the site has used is still found: the same step, a renamed one, or one taken out on purpose (null) */
const listed = fs.existsSync(LIST) ? JSON.parse(fs.readFileSync(LIST, 'utf8')) : { nights: [], checks: [] };
[['nights', 'night'], ['checks', 'check']].forEach(([k, kind]) => {
  (listed[k] || []).forEach((name) => {
    if (C.keptStep(name, kind) === undefined) {
      problems.push(`«${name}» is no longer in the lessons: write its new name in window.__tpRenamed (project/tp-grades.js), or null there if it was taken out on purpose`);
    }
  });
});

/* the names not on the list yet */
const fresh = { nights: [...now.nights].filter((n) => !(listed.nights || []).includes(n)),
  checks: [...now.checks].filter((n) => !(listed.checks || []).includes(n)) };
const count = fresh.nights.length + fresh.checks.length;
if (count && process.argv.includes('--write')) {
  const out = { nights: [...new Set([...(listed.nights || []), ...fresh.nights])].sort(),
    checks: [...new Set([...(listed.checks || []), ...fresh.checks])].sort() };
  fs.writeFileSync(LIST, JSON.stringify(out, null, 1) + '\n');
  console.log(`added ${count} names to ${LIST}`);
} else if (count) {
  problems.push(`${count} lesson names are not on ${LIST} yet (${[...fresh.checks, ...fresh.nights].slice(0, 3).join(', ')}…): run node tests/test-names.js --write`);
}

console.log(`${now.nights.size} nights and ${now.checks.size} big stars named; ${(listed.nights || []).length + (listed.checks || []).length} names on the list`);
console.log(problems.length ? problems.join('\n') : 'no problems');
process.exitCode = problems.length ? 1 : 0;
