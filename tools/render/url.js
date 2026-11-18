// Where a board is opened: with this project's runtime (runtime/board.html), or with CANVAS=1 the way the design canvas
// opens it (project/X.dc.html, which needs the canvas's runtime saved locally as project/support.js).
module.exports = (name) => process.env.CANVAS
  ? module.exports.BASE + 'project/' + name
  : module.exports.BASE + 'runtime/board.html?b=' + name;
/* the server on the repository: BASE=http://127.0.0.1:8768/ to use another */
module.exports.BASE = process.env.BASE || 'http://127.0.0.1:8766/';
