/* HERTS — shared EIT measurement panel charts (U measurement).
   Mount points: any element with data-eit-chart="u".
   DATA: no real U measurements exist in this static site yet. Until `window.HERTS_EIT_DATA` is set to
   { baseline:[40 numbers], live:[40 numbers] } the charts show deterministic ILLUSTRATIVE PLACEHOLDER data,
   labelled as such on screen.    Configuration follows the desktop acquisition app (8 electrodes, E1→E2 … E8→E1, 5 measurements per injection = 40). */
(function () {
  "use strict";
  var NS = "http://www.w3.org/2000/svg";
  var ELECTRODES = 8, PER = 5, N = ELECTRODES * PER;
  var Y_LABEL = "Estimated |Z| (Ω)";          // label used by the desktop acquisition app — confirm against firmware/processing code
  var PAIRS = []; for (var e = 0; e < ELECTRODES; e++) PAIRS.push("E" + (e + 1) + "→E" + ((e + 1) % ELECTRODES + 1));

  function rng(seed) { var s = (seed || 1) >>> 0; return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }

  function getData() {
    var d = window.HERTS_EIT_DATA;
    if (d && d.baseline && d.live && d.baseline.length === N && d.live.length === N) {
      return { baseline: d.baseline.slice(), live: d.live.slice(), illustrative: false };
    }
    var r = rng(window.HERTS_EIT_SEED || 7), base = [], live = [];
    var prof = [46, 5, 9, 6, 3.5], gain = [1, 1.2, .9, 1.3, .75, 1.1, .85, 1.15];
    for (var i = 0; i < N; i++) {
      var b = Math.max(1, prof[i % PER] * gain[Math.floor(i / PER)] * (0.9 + r() * 0.2));
      base.push(b); live.push(Math.max(1, b * (1 + (r() - 0.5) * 0.5)));
    }
    return { baseline: base, live: live, illustrative: true };
  }

  function niceStep(range, ticks) {
    var raw = range / ticks, p = Math.pow(10, Math.floor(Math.log10(raw))), f = raw / p;
    return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10) * p;
  }
  function el(name, attrs, parent, text) {
    var n = document.createElementNS(NS, name);
    for (var k in attrs) n.setAttribute(k, attrs[k]);
    if (text != null) n.textContent = text;
    if (parent) parent.appendChild(n);
    return n;
  }
  function fmt(v) { return (Math.abs(v) >= 1000 ? Math.round(v) : Math.round(v * 10) / 10).toString().replace("-", "−"); }

  function frame(host, w, h, m, yMin, yMax, step, yTitle, xTitle) {
    var svg = el("svg", { viewBox: "0 0 " + w + " " + h, width: w, height: h, role: "img" }, host);
    var pw = w - m.l - m.r, ph = h - m.t - m.b;
    var X = function (i) { return m.l + (i + 0.5) * pw / N; };
    var Y = function (v) { return m.t + ph - (v - yMin) / (yMax - yMin) * ph; };
    for (var v = yMin; v <= yMax + 1e-9; v += step) {
      el("line", { class: "gl", x1: m.l, x2: m.l + pw, y1: Y(v), y2: Y(v) }, svg);
      el("text", { x: m.l - 6, y: Y(v) + 4, "text-anchor": "end" }, svg, fmt(v));
    }
    for (var g = 1; g < ELECTRODES; g++) el("line", { class: "sep", x1: m.l + g * PER * pw / N, x2: m.l + g * PER * pw / N, y1: m.t, y2: m.t + ph }, svg);
    el("line", { class: "axl", x1: m.l, x2: m.l, y1: m.t, y2: m.t + ph }, svg);
    el("line", { class: "axl", x1: m.l, x2: m.l + pw, y1: m.t + ph, y2: m.t + ph }, svg);
    for (var n = 0; n < N; n += PER) {
      el("text", { x: X(n), y: m.t + ph + 16, "text-anchor": "middle" }, svg, n);
    }
    el("text", { class: "xt", x: m.l + pw / 2, y: h - 6, "text-anchor": "middle" }, svg, xTitle);
    el("text", { class: "yt", transform: "translate(14 " + (m.t + ph / 2) + ") rotate(-90)", "text-anchor": "middle" }, svg, yTitle);
    return { svg: svg, X: X, Y: Y, pw: pw, ph: ph, m: m };
  }

  function drawU(host, d, w) {
    var h = Math.max(300, Math.min(560, Math.round(w * 1.15)));
    var m = { l: 52, r: 10, t: 22, b: 44 };
    var max = Math.max.apply(null, d.baseline.concat(d.live)), step = niceStep(max, 4), top = Math.ceil(max / step) * step;
    var c = frame(host, w, h, m, 0, top, step, Y_LABEL, "Measurement Number");
    c.svg.setAttribute("aria-label", "U measurement per measurement number, baseline compared with live measurement");
    var gw = c.pw / ELECTRODES, short = gw < 56;
    if (gw >= 34) PAIRS.forEach(function (p, g) {   // too narrow: pair labels hidden, order still in the note + tooltips
      el("text", { class: "pr", x: m.l + (g + 0.5) * gw, y: m.t - 7, "text-anchor": "middle" }, c.svg, short ? p.replace(/E/g, "") : p);
    });
    [["baseline", "var(--eitp-base)", "Baseline"], ["live", "var(--eitp-live)", "Live Measurement"]].forEach(function (s) {
      var pts = d[s[0]].map(function (v, i) { return c.X(i).toFixed(1) + "," + c.Y(v).toFixed(1); }).join(" ");
      el("polyline", { points: pts, fill: "none", stroke: s[1], "stroke-width": 1.8, "stroke-linejoin": "round" }, c.svg);
      d[s[0]].forEach(function (v, i) {
        var dot = el("circle", { cx: c.X(i), cy: c.Y(v), r: 2.6, fill: s[1] }, c.svg);
        el("title", {}, dot, s[2] + " · n=" + i + " · " + PAIRS[Math.floor(i / PER)] + " · " + fmt(v));
      });
    });
  }

  function mount(node) {
    var kind = node.getAttribute("data-eit-chart"), data = getData(), last = 0;
    function render() {
      var w = Math.floor(node.clientWidth);
      if (w < 200 || w === last) return;
      last = w; node.innerHTML = "";
      drawU(node, data, w);
    }
    var badge = node.closest(".eitp-chart") && node.closest(".eitp-chart").querySelector(".ph");
    if (badge && !data.illustrative) badge.hidden = true;
    render();
    if (window.ResizeObserver) new ResizeObserver(render).observe(node);
    else window.addEventListener("resize", render);
  }
  function init() { Array.prototype.forEach.call(document.querySelectorAll("[data-eit-chart]"), mount); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
