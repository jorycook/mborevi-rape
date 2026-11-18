// Where a board is opened: with this project's runtime (runtime/board.html), or with CANVAS=1 the way the design canvas
// opens it (project/X.dc.html, which needs the canvas's runtime saved locally as project/support.js).
module.exports = (name) => process.env.CANVAS
  ? 'http://127.0.0.1:8766/project/' + name
  : 'http://127.0.0.1:8766/runtime/board.html?b=' + name;
