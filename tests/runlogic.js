process.chdir(require('path').join(__dirname, '..')); // paths below are from the repository root
// runs an artboard's logic class in Node (no rendering): catches exceptions in renderVals before sending
global.document = { addEventListener(){} }; global.navigator = {};
global.window = global;
['tp-sound.js', 'tp-course.js', 'tp-grades.js', 'tp-pics.js', 'tp-sky.js'].forEach((f) => require('../project/' + f));
const fs = require('fs');
const file = process.argv[2];
const props = process.argv[3] ? JSON.parse(process.argv[3]) : {};
const s = fs.readFileSync(file, 'utf8');
const js = /<script type="text\/x-dc" data-dc-script[^>]*>([\s\S]*?)<\/script>/.exec(s)[1];
global.DCLogic = class { constructor(p) { this.props = p || {}; this.state = {}; } setState(x) { this.state = Object.assign({}, this.state, typeof x === 'function' ? x(this.state) : x); } };
global.setTimeout = (fn, ms) => 0; global.clearTimeout = () => {};
const Component = new Function(js + '\nreturn Component;')();
const c = new Component(props);
if (c.componentDidMount) c.componentDidMount();
const v = c.renderVals();
// every {{ hole }} in the markup must resolve to something (not undefined)
const holes = [...s.replace(/<script[\s\S]*?<\/script>/g, '').matchAll(/\{\{\s*([\w.$]+)\s*\}\}/g)].map((m) => m[1]);
const loops = {};
for (const m of s.matchAll(/<sc-for list="\{\{\s*([\w.]+)\s*\}\}" as="(\w+)"/g)) loops[m[2]] = m[1];
const get = (o, p) => p.split('.').reduce((a, k) => (a == null ? undefined : a[k]), o);
const missing = new Set();
for (const h of holes) {
  if (/^(true|false|\d+)$/.test(h) || h === '$index') continue;
  const head = h.split('.')[0];
  let val;
  if (loops[head]) { const arr = get(v, loops[head]) || []; const it = arr[0]; val = it === undefined ? '(empty list)' : get({ [head]: it }, h); }
  else val = get(v, h);
  if (val === undefined) missing.add(h);
}
console.log(file.split('/').pop(), 'OK', 'missing holes:', [...missing].join(', ') || 'none');
