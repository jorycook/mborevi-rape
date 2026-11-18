/* Mborevi Rape web runtime: plays the app's .dc.html boards in an ordinary browser, outside the design canvas.
 *
 * A board is an HTML file with an <x-dc> template and a <script type="text/x-dc" data-dc-script> logic class:
 *   - {{ path }} holes are dotted lookups into the values the class's renderVals() returns (or a literal: true,
 *     false, null, a number, a quoted string); a hole that is a whole attribute passes the raw value (a function,
 *     a ref, a number), a hole inside other text interpolates;
 *   - <sc-if value="{{ c }}"> keeps its content when c is truthy; <sc-for list="{{ xs }}" as="x"> repeats it with
 *     x and $index in scope; <dc-import name="Card" a="{{ v }}"> mounts the sibling board Card.dc.html with props
 *     (attributes keep the case they are written in; kebab-case becomes camelCase; hint-* attributes are ignored);
 *   - <helmet> holds head content (styles, font links, meta), added to the page while it is rendered;
 *   - the class extends DCLogic, a React class component whose render() fills the template.
 * The head's <script src> files (except the canvas's own support.js) load once, in order, before the first render.
 * This project's own code, written from the format's authoring rules; it needs React 18 and ReactDOM 18 as globals. */
(function () {
  'use strict';
  var React = window.React, ReactDOM = window.ReactDOM;
  if (!React || !ReactDOM) throw new Error('dc runtime: React and ReactDOM must load first');
  var h = React.createElement;
  var SELF = (document.currentScript && document.currentScript.src) || document.baseURI; /* this file's URL */
  /* boardLinks: 'viewer' opens a linked board in runtime/board.html, 'app' opens the page that mounted the app (a new
     tab then starts the app again). fonts: a map from a stylesheet URL prefix to the URL to use instead (the site
     serves its own copy of the Google fonts). */
  var options = { boardLinks: 'viewer', fonts: null };
  var NAME = /^[A-Za-z0-9_][A-Za-z0-9_.-]*$/; /* a sibling board's name: no slashes, no scheme */

  /* ---------- names ---------- */
  /* HTML attributes an HTML parser lowercases, written the way React wants them */
  var ATTR = {
    'class': 'className', 'for': 'htmlFor', tabindex: 'tabIndex', readonly: 'readOnly', maxlength: 'maxLength',
    minlength: 'minLength', autocomplete: 'autoComplete', autofocus: 'autoFocus', contenteditable: 'contentEditable',
    spellcheck: 'spellCheck', crossorigin: 'crossOrigin', srcset: 'srcSet', colspan: 'colSpan', rowspan: 'rowSpan',
    datetime: 'dateTime', enterkeyhint: 'enterKeyHint', inputmode: 'inputMode', accesskey: 'accessKey',
    novalidate: 'noValidate', formaction: 'formAction', referrerpolicy: 'referrerPolicy', playsinline: 'playsInline',
    usemap: 'useMap', itemprop: 'itemProp', 'http-equiv': 'httpEquiv', 'accept-charset': 'acceptCharset',
    classname: 'className', htmlfor: 'htmlFor', defaultvalue: 'defaultValue', defaultchecked: 'defaultChecked'
  };
  /* SVG presentation attributes React knows in camelCase (transform-origin is not one: it passes as written) */
  ['alignment-baseline', 'baseline-shift', 'clip-path', 'clip-rule', 'color-interpolation-filters', 'dominant-baseline',
    'fill-opacity', 'fill-rule', 'flood-color', 'flood-opacity', 'font-family', 'font-size', 'font-style', 'font-weight',
    'image-rendering', 'letter-spacing', 'lighting-color', 'marker-end', 'marker-mid', 'marker-start', 'paint-order',
    'pointer-events', 'shape-rendering', 'stop-color', 'stop-opacity', 'stroke-dasharray', 'stroke-dashoffset',
    'stroke-linecap', 'stroke-linejoin', 'stroke-miterlimit', 'stroke-opacity', 'stroke-width', 'text-anchor',
    'text-decoration', 'text-rendering', 'vector-effect', 'word-spacing', 'writing-mode'
  ].forEach(function (n) { ATTR[n] = camel(n); });
  ATTR['xlink:href'] = 'xlinkHref'; ATTR['xml:space'] = 'xmlSpace';
  /* React's events, so that a lowercase onclick (or ondragenter…) still becomes onClick; capture variants too */
  var EVENTS = {};
  ('Abort AnimationEnd AnimationIteration AnimationStart AuxClick BeforeInput Blur CanPlay CanPlayThrough Change Click ' +
    'Close CompositionEnd CompositionStart CompositionUpdate ContextMenu Copy Cut DoubleClick Drag DragEnd DragEnter ' +
    'DragExit DragLeave DragOver DragStart Drop DurationChange Emptied Encrypted Ended Error Focus GotPointerCapture ' +
    'Input Invalid KeyDown KeyPress KeyUp Load LoadedData LoadedMetadata LoadStart LostPointerCapture MouseDown ' +
    'MouseEnter MouseLeave MouseMove MouseOut MouseOver MouseUp Paste Pause Play Playing PointerCancel PointerDown ' +
    'PointerEnter PointerLeave PointerMove PointerOut PointerOver PointerUp Progress RateChange Reset Resize Scroll ' +
    'Seeked Seeking Select Stalled Submit Suspend TimeUpdate Toggle TouchCancel TouchEnd TouchMove TouchStart ' +
    'TransitionEnd VolumeChange Waiting Wheel')
    .split(' ').forEach(function (n) {
      EVENTS['on' + n.toLowerCase()] = 'on' + n;
      EVENTS['on' + n.toLowerCase() + 'capture'] = 'on' + n + 'Capture';
    });
  function camel(attr) { return attr.replace(/-([a-z])/g, function (m, c) { return c.toUpperCase(); }); }
  function propName(name) {
    var low = name.toLowerCase();
    if (EVENTS[low]) return EVENTS[low];
    if (ATTR[low]) return ATTR[low];
    return name; /* aria-*, data-*, role, d, viewBox, and names written in camelCase, pass as they are */
  }
  /* An HTML parser lowercases attribute names; the board's source keeps the case its author wrote (onPick,
     itemCount, className). The names with capitals are read from the source, tag by tag. */
  function caseMap(source) {
    var map = {}, tag, re = /<[A-Za-z][^\s/>]*((?:[^>"']|"[^"]*"|'[^']*')*)>/g, attr = /([^\s=/>"']+)(?=\s*=|\s|\/|$)/g, m;
    while ((tag = re.exec(source))) {
      var inside = tag[1].replace(/"[^"]*"|'[^']*'/g, ' ');
      attr.lastIndex = 0;
      while ((m = attr.exec(inside))) {
        var name = m[1], low = name.toLowerCase();
        if (name !== low && !map[low]) map[low] = name;
      }
    }
    return map;
  }

  /* ---------- holes ---------- */
  var HOLE = /\{\{\s*([^}]*?)\s*\}\}/g;
  function literal(expr) {
    if (expr === 'true') return { v: true };
    if (expr === 'false') return { v: false };
    if (expr === 'null') return { v: null };
    if (expr === 'undefined') return { v: undefined };
    if (/^-?\d+(\.\d+)?$/.test(expr)) return { v: Number(expr) };
    var q = expr.match(/^'(.*)'$|^"(.*)"$/);
    if (q) return { v: q[1] != null ? q[1] : q[2] };
    return null;
  }
  function lookup(expr, scope) {
    var lit = literal(expr);
    if (lit) return lit.v;
    var parts = expr.split('.'), v = scope;
    for (var i = 0; i < parts.length; i++) {
      if (v == null) return undefined;
      v = v[parts[i]];
    }
    return v;
  }
  /* a string with holes, compiled to parts: strings and {expr} */
  function parse(text) {
    var out = [], last = 0, m;
    HOLE.lastIndex = 0;
    while ((m = HOLE.exec(text))) {
      if (m.index > last) out.push(text.slice(last, m.index));
      out.push({ expr: m[1] });
      last = m.index + m[0].length;
    }
    if (last < text.length) out.push(text.slice(last));
    return out;
  }
  /* text holes: nothing for null and booleans, arrays run together (as React children do) */
  function textOf(v) {
    if (v == null || v === false || v === true) return '';
    if (Array.isArray(v)) return v.map(textOf).join('');
    return String(v);
  }
  /* attribute holes inside other text: booleans are written out */
  function attrText(v) { return v == null ? '' : String(v); }
  function interp(parts, scope, fmt) {
    var s = '';
    for (var i = 0; i < parts.length; i++) s += typeof parts[i] === 'string' ? parts[i] : fmt(lookup(parts[i].expr, scope));
    return s;
  }
  /* sc-if value / sc-for list: a hole (spaces around it allowed), or a literal written as it is */
  function control(value) {
    var v = (value || '').trim(), parts = parse(v);
    if (parts.length === 1 && typeof parts[0] !== 'string') return { expr: parts[0].expr };
    if (!parts.length) return { lit: undefined };
    if (parts.length === 1) { var l = literal(v); return { lit: l ? l.v : v }; }
    return { lit: undefined };
  }
  function controlValue(c, scope) { return c.expr != null ? lookup(c.expr, scope) : c.lit; }

  /* ---------- inline styles: CSS text to a React style object ---------- */
  var styleCache = {}, styleCount = 0;
  function declarations(css) {
    var out = [], cur = '', q = null, depth = 0;
    css = css.replace(/\/\*[\s\S]*?\*\//g, '');
    for (var i = 0; i < css.length; i++) {
      var c = css[i];
      if (q) { cur += c; if (c === '\\' && i + 1 < css.length) cur += css[++i]; else if (c === q) q = null; continue; }
      if (c === '"' || c === "'") { q = c; cur += c; continue; }
      if (c === '(') depth++;
      else if (c === ')') depth = Math.max(0, depth - 1);
      if (c === ';' && depth === 0) { out.push(cur); cur = ''; continue; }
      cur += c;
    }
    out.push(cur);
    return out;
  }
  function styleKey(name) {
    if (name.indexOf('--') === 0) return name;
    name = name.toLowerCase();
    if (name.indexOf('-ms-') === 0) return camel(name.slice(1));
    var v = name.match(/^-(webkit|moz|o)-(.*)$/);
    if (v) return v[1].charAt(0).toUpperCase() + v[1].slice(1) + camel('-' + v[2]);
    return camel(name);
  }
  var canCheck = typeof CSS !== 'undefined' && typeof CSS.supports === 'function';
  /* { style, important }: later declarations win where the browser accepts them, as in a style attribute */
  function styleObject(css) {
    if (styleCache[css]) return styleCache[css];
    if (++styleCount > 4000) { styleCache = {}; styleCount = 0; } /* styles that animate make many strings */
    var style = {}, important = null;
    declarations(css).forEach(function (decl) {
      var i = decl.indexOf(':');
      if (i < 0) return;
      var name = decl.slice(0, i).trim(), value = decl.slice(i + 1).trim();
      if (!name || value === '') return;
      var imp = /!\s*important\s*$/i.test(value);
      if (imp) value = value.replace(/!\s*important\s*$/i, '').trim();
      if (canCheck && name.indexOf('--') !== 0 && !CSS.supports(name, value)) return;
      if (imp) (important = important || {})[name] = value;
      else style[styleKey(name)] = value;
    });
    return (styleCache[css] = { style: style, important: important });
  }

  /* ---------- URLs written in a board are relative to the board ---------- */
  function boardURL(value, board) {
    if (typeof value !== 'string' || !value || /^(#|[a-z][a-z0-9+.-]*:|\/\/)/i.test(value)) return value;
    var u = new URL(value, board.url);
    /* a link to another board opens that board in this runtime's viewer (when the board does not handle the click) */
    var m = u.pathname.match(/\/([A-Za-z0-9_][A-Za-z0-9_.-]*\.dc\.html)$/);
    if (m && u.href.indexOf(new URL('.', board.url).href) === 0) {
      if (options.boardLinks === 'app') return location.href.split('#')[0];
      return new URL('board.html?b=' + m[1], SELF).href + u.hash;
    }
    return u.href;
  }

  /* ---------- templates: DOM nodes compiled to a small tree ---------- */
  function compileNodes(nodes, board) {
    var out = [];
    for (var i = 0; i < nodes.length; i++) {
      var c = compileNode(nodes[i], board);
      if (c) out.push(c);
    }
    return out;
  }
  function attrsOf(node, board) {
    var out = [];
    for (var i = 0; i < node.attributes.length; i++) {
      var a = node.attributes[i];
      out.push({ name: board.names[a.name] || a.name, value: a.value });
    }
    return out;
  }
  var INPUTS = { input: 1, textarea: 1, select: 1, option: 1 };
  function compileNode(node, board) {
    if (node.nodeType === 3) {
      var t = node.nodeValue;
      /* whitespace that only lays out the source (it holds a line break) is not content, as in JSX */
      if (!t || (/^[ \t\r\n\f]*$/.test(t) && /[\r\n]/.test(t))) return null;
      return { k: 'text', parts: parse(t) };
    }
    if (node.nodeType !== 1) return null;
    var tag = node.localName;
    var attrs = attrsOf(node, board);
    var get = function (n) { for (var i = 0; i < attrs.length; i++) if (attrs[i].name.toLowerCase() === n) return attrs[i].value; return null; };
    if (tag === 'helmet') return { k: 'helmet', els: Array.prototype.slice.call(node.children) };
    if (tag === 'sc-if') return { k: 'if', cond: control(get('value')), kids: compileNodes(node.childNodes, board) };
    if (tag === 'sc-for') return { k: 'for', list: control(get('list')), as: get('as') || 'item', kids: compileNodes(node.childNodes, board) };
    if (tag === 'dc-import') {
      var props = [];
      attrs.forEach(function (a) {
        var low = a.name.toLowerCase();
        if (low === 'name' || low.indexOf('hint-') === 0) return;
        props.push({ name: /[A-Z]/.test(a.name) ? a.name : camel(low), parts: parse(a.value) });
      });
      var name = (get('name') || '').trim();
      board.imports.push(name);
      return { k: 'import', name: name, props: props, kids: compileNodes(node.childNodes, board) };
    }
    var list = [];
    attrs.forEach(function (a) {
      var low = a.name.toLowerCase();
      if (low.indexOf('hint-') === 0) return;
      var prop = propName(a.name), parts = parse(a.value);
      var hole = parts.length === 1 && typeof parts[0] !== 'string';
      if (INPUTS[tag] && !hole && (prop === 'checked' || prop === 'value')) prop = prop === 'checked' ? 'defaultChecked' : 'defaultValue';
      /* inert: written plainly it is on; a whole hole turns it on when its value is true, off when false or empty */
      if (prop === 'inert') { list.push(hole ? { prop: 'inert', parts: parts, flag: true } : { prop: 'inert', parts: [''] }); return; }
      var url = prop === 'href' || prop === 'src';
      if (url && !hole && parts.length < 2) parts = [boardURL(a.value, board)];
      list.push({ prop: prop, parts: parts, url: url });
    });
    var kids = tag === 'style' ? [{ k: 'text', parts: [node.textContent] }] : compileNodes(node.childNodes, board);
    return { k: 'el', tag: tag, attrs: list, kids: kids };
  }

  /* ---------- rendering ---------- */
  var BOOL = { disabled: 1, hidden: 1, checked: 1, selected: 1, readOnly: 1, required: 1, multiple: 1, autoFocus: 1,
    open: 1, controls: 1, loop: 1, muted: 1, autoPlay: 1, playsInline: 1, noValidate: 1, reversed: 1,
    defaultChecked: 1 };
  function attrValue(a, scope) {
    var p = a.parts;
    if (p.length === 1 && typeof p[0] !== 'string') return lookup(p[0].expr, scope); /* a whole hole: the raw value */
    if (p.length === 1) return p[0];
    if (p.length === 0) return BOOL[a.prop] ? true : '';
    return interp(p, scope, attrText);
  }
  /* every child keeps its slot (null when an sc-if is off), so a sibling never shifts and React never remounts it */
  function renderKids(kids, scope, ctx) {
    var out = new Array(kids.length);
    for (var i = 0; i < kids.length; i++) out[i] = renderNode(kids[i], scope, ctx);
    return out;
  }
  function frag(kids, key) { return h.apply(null, [React.Fragment, key == null ? null : { key: key }].concat(kids)); }
  function renderNode(n, scope, ctx) {
    if (n.k === 'text') {
      return n.parts.length === 1 && typeof n.parts[0] === 'string' ? n.parts[0] : interp(n.parts, scope, textOf);
    }
    if (n.k === 'helmet') return h(Helmet, { els: n.els, base: ctx.url });
    if (n.k === 'if') return controlValue(n.cond, scope) ? frag(renderKids(n.kids, scope, ctx)) : null;
    if (n.k === 'for') {
      var xs = controlValue(n.list, scope);
      if (!xs || typeof xs.length !== 'number' || !xs.length || typeof xs === 'string') return null;
      var items = [];
      for (var i = 0; i < xs.length; i++) {
        var s = Object.create(scope);
        s[n.as] = xs[i];
        s.$index = i;
        items.push(frag(renderKids(n.kids, s, ctx), i));
      }
      return h(React.Fragment, null, items); /* one slot for the whole list; its items are keyed by index */
    }
    if (n.k === 'import') {
      var props = {};
      n.props.forEach(function (p) { props[p.name] = attrValue({ parts: p.parts }, scope); });
      if (n.kids.length) props.children = renderKids(n.kids, scope, ctx);
      return h(ctx.child(n.name), props);
    }
    var props2 = {}, important = null;
    for (var j = 0; j < n.attrs.length; j++) {
      var a = n.attrs[j];
      var v = attrValue(a, scope);
      if (a.flag) v = v ? '' : null;
      if (v == null) continue;
      if (a.prop === 'style') {
        if (typeof v === 'string') { var st = styleObject(v); v = st.style; important = st.important; }
        else if (typeof v !== 'object') continue;
      } else if (a.url && typeof v === 'string' && a.parts.length === 1 && typeof a.parts[0] !== 'string') {
        v = boardURL(v, ctx.board);
      }
      props2[a.prop] = v;
    }
    if (important) props2.ref = withImportant(props2.ref, important);
    return h.apply(null, [n.tag, props2].concat(renderKids(n.kids, scope, ctx)));
  }
  /* !important declarations cannot go through React's style object: they are set on the element itself */
  function withImportant(ref, important) {
    return function (el) {
      if (el) Object.keys(important).forEach(function (k) { el.style.setProperty(k, important[k], 'important'); });
      if (typeof ref === 'function') ref(el);
      else if (ref && typeof ref === 'object') ref.current = el;
    };
  }

  /* ---------- head content ---------- */
  var heads = {};
  function headNode(el, baseUrl, shared) {
    var tag = el.localName;
    if (tag !== 'style' && tag !== 'link' && tag !== 'meta') return null;
    var key = tag === 'style' ? 'style:' + el.textContent : tag + ':' + el.outerHTML;
    if (shared && heads[key]) return null;
    var n = document.createElement(tag);
    for (var i = 0; i < el.attributes.length; i++) n.setAttribute(el.attributes[i].name, el.attributes[i].value);
    if (tag === 'style') n.textContent = el.textContent;
    if (tag === 'link' && el.getAttribute('href')) n.href = fontURL(new URL(el.getAttribute('href'), baseUrl).href);
    if (shared) heads[key] = 1;
    document.head.appendChild(n);
    return n;
  }
  function fontURL(href) {
    var map = options.fonts;
    if (map) for (var k in map) if (href.indexOf(k) === 0) return new URL(map[k], document.baseURI).href;
    return href;
  }
  /* a <helmet> inside the template (in an sc-if, say) adds its content while it is rendered and takes it away when
     it is not. Its text is used as written: holes in a stylesheet are not filled, as on the canvas, and a <title> is
     left to the page. */
  class Helmet extends React.Component {
    componentDidMount() {
      var base = this.props.base;
      this.nodes = this.props.els.map(function (el) { return headNode(el, base, false); }).filter(Boolean);
    }
    componentWillUnmount() { (this.nodes || []).forEach(function (n) { if (n.parentNode) n.parentNode.removeChild(n); }); }
    render() { return null; }
  }

  /* ---------- a board that fails ---------- */
  /* Whatever throws while a board draws, in it or in a board it imports, reaches this guard around the page's board,
     which says so and offers to start again (the site keeps the child's progress, so starting again goes back to the
     path). A board inside another is not guarded on its own: a screen with a hole in it would leave a child with no
     way on. */
  class Guard extends React.Component {
    constructor(props) { super(props); this.state = { failed: false }; }
    static getDerivedStateFromError() { return { failed: true }; }
    componentDidCatch(error, info) { console.error('dc runtime: ' + this.props.name + ' failed:', error, info && info.componentStack || ''); }
    render() {
      if (!this.state.failed) return this.props.children;
      return h('div', { role: 'alert', style: { padding: '120px 28px', textAlign: 'center', color: '#FFF7EC',
          font: '700 17px/1.45 system-ui, sans-serif' } },
        h('p', null, 'Algo no salió bien.'),
        h('button', { type: 'button', onClick: function () { location.reload(); }, style: { marginTop: '18px',
          padding: '14px 26px', borderRadius: '999px', border: '3px solid #3B2418', background: '#FFD34E', color: '#3B2418',
          font: '800 17px system-ui, sans-serif', cursor: 'pointer' } }, 'Volver a empezar'));
    }
  }

  /* ---------- the logic base class ---------- */
  class DCLogic extends React.Component {
    constructor(props) { super(props); if (!this.state) this.state = {}; }
    renderVals() { return {}; }
    componentDidMount() {}
    componentDidUpdate() {}
    componentWillUnmount() {}
    /* the new state is this.state at once (the canvas does the same), and React renders it as usual */
    setState(update, callback) {
      var partial = typeof update === 'function' ? update(this.state, this.props) : update;
      if (partial == null) { if (callback) super.setState(null, callback); return; }
      var next = Object.assign({}, this.state, partial);
      this.state = next;
      super.setState(next, callback);
    }
  }
  window.DCLogic = DCLogic;

  /* ---------- boards: load, compile, wrap ---------- */
  var boards = {}, scripts = {};
  function resolve(url, base) { return new URL(url, base || document.baseURI).href; }
  /* a script is revalidated first (GitHub Pages lets browsers keep files for 10 minutes; a board revalidated next to
     an engine from the cache would not match after a deploy), then added as a <script> that the browser runs in
     order; one that throws while it runs counts as failed */
  function runScript(src) {
    if (scripts[src]) return scripts[src];
    var p = new Promise(function (ok, fail) {
      var el = document.createElement('script'), err = null;
      var onerr = function (ev) { if (ev.filename === src) err = ev.error || new Error(ev.message); };
      window.addEventListener('error', onerr);
      el.src = src;
      el.async = false;
      el.onload = function () { window.removeEventListener('error', onerr); if (err) fail(err); else ok(); };
      el.onerror = function () { window.removeEventListener('error', onerr); fail(new Error('could not load ' + src)); };
      document.head.appendChild(el);
    }).catch(function (e) { delete scripts[src]; throw e; });
    return (scripts[src] = p);
  }
  function loadScripts(list) {
    var todo = list.filter(function (src) { return !scripts[src]; });
    var fresh = todo.map(function (src) { return fetch(src, { cache: 'no-cache' }).catch(function () {}); });
    return Promise.all(fresh).then(function () { return Promise.all(list.map(runScript)); });
  }
  /* one quiet retry: a phone on a weak connection drops a request now and then */
  function fetchText(url, tries) {
    var ctl = typeof AbortController === 'function' ? new AbortController() : null;
    var timer = ctl ? setTimeout(function () { ctl.abort(); }, 15000) : 0;
    return fetch(url, { cache: 'no-cache', signal: ctl ? ctl.signal : undefined }).then(function (r) {
      clearTimeout(timer);
      if (!r.ok) throw new Error(url + ' answered ' + r.status);
      return r.text();
    }).catch(function (e) {
      clearTimeout(timer);
      if ((tries || 0) >= 1) throw e;
      return new Promise(function (ok) { setTimeout(ok, 800); }).then(function () { return fetchText(url, 1); });
    });
  }
  function Missing() { return null; }
  function load(url, chain) {
    url = resolve(url);
    chain = chain || [];
    if (new URL(url).origin !== location.origin) return Promise.reject(new Error('dc runtime: ' + url + ' is not on this site'));
    if (boards[url]) return chain.indexOf(url) >= 0 ? Promise.resolve(boards[url]) : boards[url].ready;
    var board = { url: url, imports: [], children: {}, names: {} };
    boards[url] = board;
    var below = chain.concat(url);
    board.ready = fetchText(url).then(function (text) {
      /* <dc-import … /> is not closed by an HTML parser: close it, so what follows stays its sibling */
      text = text.replace(/<dc-import\b((?:[^>"']|"[^"]*"|'[^']*')*?)\s*\/>/g, '<dc-import$1></dc-import>');
      var doc = new DOMParser().parseFromString(text, 'text/html');
      var srcs = [];
      Array.prototype.forEach.call(doc.head.querySelectorAll('script[src]'), function (s) {
        var src = resolve(s.getAttribute('src'), url);
        if (/(^|\/)support\.js(\?|$)/.test(src)) return; /* the canvas's own runtime is not needed here */
        if (new URL(src).origin !== location.origin) return;
        srcs.push(src);
      });
      Array.prototype.forEach.call(doc.head.querySelectorAll('style, link[rel="stylesheet"]'), function (el) { headNode(el, url, true); });
      var root = doc.querySelector('x-dc');
      if (!root) throw new Error('dc runtime: ' + url + ' has no <x-dc>');
      var start = text.indexOf('<x-dc'), end = text.lastIndexOf('</x-dc>');
      board.names = caseMap(start >= 0 && end > start ? text.slice(start, end) : text);
      /* the helmets at the top of the template belong to the board: their content goes in the page once */
      Array.prototype.forEach.call(root.children, function (el) {
        if (el.localName === 'helmet') Array.prototype.forEach.call(el.children, function (c) { headNode(c, url, true); });
      });
      var top = Array.prototype.filter.call(root.childNodes, function (n) { return !(n.nodeType === 1 && n.localName === 'helmet'); });
      board.tree = compileNodes(top, board);
      var logic = doc.querySelector('script[type="text/x-dc"]');
      board.source = logic ? logic.textContent : 'class Component extends DCLogic {}';
      var kids = board.imports.filter(function (name, i, all) { return all.indexOf(name) === i; }).map(function (name) {
        if (!NAME.test(name)) { console.error('dc runtime: ' + url + ' imports a board with a bad name: ' + name); return null; }
        var u = resolve(name + '.dc.html', url);
        board.children[name] = u;
        return load(u, below); /* a board that cannot load fails the one that imports it: the page offers to try again */
      });
      return Promise.all([loadScripts(srcs), Promise.all(kids)]);
    }).then(function () {
      /* the logic class runs as written, as on the canvas */
      var Logic = new Function('DCLogic', 'React', board.source + '\n;return Component;\n//# sourceURL=' + url)(DCLogic, React);
      var ctx = {
        url: url,
        board: board,
        child: function (name) {
          var b = boards[board.children[name]];
          return b && b.Component ? b.Component : Missing;
        }
      };
      var tree = board.tree;
      var Board = class extends Logic {
        render() {
          var vals = (this.renderVals ? this.renderVals() : {}) || {};
          return frag(renderKids(tree, vals, ctx));
        }
      };
      Board.displayName = url.split('/').pop().replace('.dc.html', '');
      board.Component = Board;
      return board;
    }).catch(function (e) {
      delete boards[url]; /* not kept, so that trying again can work */
      throw e instanceof Error && e.message.indexOf(url) >= 0 ? e : new Error('dc runtime: ' + url + ': ' + (e && e.message || e));
    });
    return board.ready;
  }

  /* mounts a board (by URL) in an element; resolves when it is on the page */
  var roots = typeof WeakMap === 'function' ? new WeakMap() : null;
  function mount(url, el, props) {
    return load(url).then(function (board) {
      var root = roots && roots.get(el);
      if (!root) {
        el.textContent = ''; /* a loading message goes */
        root = ReactDOM.createRoot(el);
        if (roots) roots.set(el, root);
      }
      root.render(h(Guard, { name: board.Component.displayName }, h(board.Component, props || {})));
      return { board: board, root: root };
    });
  }
  function configure(o) { Object.keys(o || {}).forEach(function (k) { options[k] = o[k]; }); }
  window.DC = { mount: mount, load: load, configure: configure, DCLogic: DCLogic };
})();
