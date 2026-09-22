(function () {
  "use strict";

  const SSA = (window.SSA = window.SSA || {});

  function measure(text, fontSize, weight) {
    if (SSA.Render && SSA.Render.measureText) {
      return SSA.Render.measureText(text, fontSize, weight);
    }
    return { w: (text || "").length * fontSize * 0.6, h: fontSize * 1.3 };
  }

  const BBOX_TYPES = { rect: 1, ellipse: 1, highlight: 1, blur: 1 };
  const LINE_TYPES = { arrow: 1, line: 1 };
  const PATH_TYPES = { freehand: 1, strike: 1 };
  const SCALE_TYPES = { text: 1, label: 1, freehand: 1, strike: 1, cross: 1, tick: 1, pin: 1, number: 1 };
  const RESIZABLE = {
    rect: 1,
    ellipse: 1,
    highlight: 1,
    blur: 1,
    arrow: 1,
    line: 1,
    text: 1,
    label: 1,
    freehand: 1,
    strike: 1,
    cross: 1,
    tick: 1,
    pin: 1,
    number: 1
  };

  SSA.geom = {
    BBOX_TYPES: BBOX_TYPES,
    LINE_TYPES: LINE_TYPES,
    PATH_TYPES: PATH_TYPES,
    SCALE_TYPES: SCALE_TYPES,

    bbox(a) {
      switch (a.type) {
        case "rect":
        case "ellipse":
        case "highlight":
        case "blur":
          return { x: a.x, y: a.y, w: a.w, h: a.h };
        case "arrow":
        case "line":
          return {
            x: Math.min(a.x1, a.x2),
            y: Math.min(a.y1, a.y2),
            w: Math.abs(a.x2 - a.x1),
            h: Math.abs(a.y2 - a.y1)
          };
        case "freehand":
        case "strike": {
          const pts = a.points || [];
          if (!pts.length) return { x: a.x || 0, y: a.y || 0, w: 0, h: 0 };
          let minX = Infinity;
          let minY = Infinity;
          let maxX = -Infinity;
          let maxY = -Infinity;
          for (let i = 0; i < pts.length; i++) {
            const p = pts[i];
            if (p[0] < minX) minX = p[0];
            if (p[1] < minY) minY = p[1];
            if (p[0] > maxX) maxX = p[0];
            if (p[1] > maxY) maxY = p[1];
          }
          return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
        }
        case "text":
        case "label": {
          if (SSA.Render && SSA.Render.textMetrics) {
            const m = SSA.Render.textMetrics(a);
            return { x: a.x, y: a.y, w: m.w, h: m.h };
          }
          const m2 = measure(a.text || "", a.fontSize || 18, a.type === "label" ? 600 : 400);
          if (a.type === "label") return { x: a.x, y: a.y, w: m2.w + 18, h: (a.fontSize || 14) + 12 };
          return { x: a.x, y: a.y, w: m2.w, h: m2.h };
        }
        case "cross":
        case "tick": {
          const s = a.size || 30;
          return { x: a.x - s / 2, y: a.y - s / 2, w: s, h: s };
        }
        case "pin": {
          const s = a.size || 32;
          return { x: a.x - s * 0.3125, y: a.y - s, w: s * 0.625, h: s };
        }
        case "number": {
          const r = a.r || 13;
          return { x: a.x - r, y: a.y - r, w: 2 * r, h: 2 * r };
        }
        default:
          return { x: a.x || 0, y: a.y || 0, w: 0, h: 0 };
      }
    },

    translate(a, dx, dy) {
      const t = a.type;
      if (BBOX_TYPES[t]) {
        a.x += dx;
        a.y += dy;
      } else if (LINE_TYPES[t]) {
        a.x1 += dx;
        a.y1 += dy;
        a.x2 += dx;
        a.y2 += dy;
      } else if (PATH_TYPES[t]) {
        a.points = a.points.map(function (p) {
          return [p[0] + dx, p[1] + dy];
        });
      } else {
        a.x += dx;
        a.y += dy;
      }
    },

    scale(a, s) {
      const t = a.type;
      if (BBOX_TYPES[t]) {
        a.x *= s;
        a.y *= s;
        a.w *= s;
        a.h *= s;
        a.width *= s;
      } else if (LINE_TYPES[t]) {
        a.x1 *= s;
        a.y1 *= s;
        a.x2 *= s;
        a.y2 *= s;
        a.width *= s;
      } else if (PATH_TYPES[t]) {
        a.points = a.points.map(function (p) {
          return [p[0] * s, p[1] * s];
        });
        a.width *= s;
      } else {
        a.x *= s;
        a.y *= s;
        if (a.fontSize) a.fontSize *= s;
        if (a.r) a.r *= s;
        if (a.size) a.size *= s;
        a.width *= s;
      }
    },

    segDist(px, py, x1, y1, x2, y2) {
      const dx = x2 - x1;
      const dy = y2 - y1;
      const len2 = dx * dx + dy * dy;
      let t = 0;
      if (len2 > 0) t = SSA.util.clamp(((px - x1) * dx + (py - y1) * dy) / len2, 0, 1);
      const cx = x1 + t * dx;
      const cy = y1 + t * dy;
      return Math.hypot(px - cx, py - cy);
    },

    hit(a, p, tol) {
      if (a.hidden) return false;
      const b = this.bbox(a);
      switch (a.type) {
        case "rect":
        case "highlight":
        case "blur":
          return p.x >= b.x - tol && p.x <= b.x + b.w + tol && p.y >= b.y - tol && p.y <= b.y + b.h + tol;
        case "ellipse": {
          const cx = b.x + b.w / 2;
          const cy = b.y + b.h / 2;
          const rx = Math.abs(b.w / 2) + tol;
          const ry = Math.abs(b.h / 2) + tol;
          if (rx <= 0 || ry <= 0) return false;
          return ((p.x - cx) * (p.x - cx)) / (rx * rx) + ((p.y - cy) * (p.y - cy)) / (ry * ry) <= 1;
        }
        case "arrow":
        case "line":
          return this.segDist(p.x, p.y, a.x1, a.y1, a.x2, a.y2) <= tol + (a.width || 3) / 2 + 4;
        case "freehand":
        case "strike": {
          const pts = a.points || [];
          const grab = tol + (a.width || 3) / 2 + 4;
          if (pts.length === 1) {
            return Math.hypot(p.x - pts[0][0], p.y - pts[0][1]) <= grab;
          }
          for (let i = 1; i < pts.length; i++) {
            if (this.segDist(p.x, p.y, pts[i - 1][0], pts[i - 1][1], pts[i][0], pts[i][1]) <= grab) {
              return true;
            }
          }
          return false;
        }
        case "number":
          return Math.hypot(p.x - a.x, p.y - a.y) <= (a.r || 13) + tol;
        default:
          return p.x >= b.x - tol && p.x <= b.x + b.w + tol && p.y >= b.y - tol && p.y <= b.y + b.h + tol;
      }
    },

    handlesScreen(a, view) {
      const out = {};
      if (a.hidden || !RESIZABLE[a.type]) return out;
      const toS = function (x, y) {
        return { x: x * view.scale + view.ox, y: y * view.scale + view.oy };
      };
      if (LINE_TYPES[a.type]) {
        out.p1 = toS(a.x1, a.y1);
        out.p2 = toS(a.x2, a.y2);
        return out;
      }
      const b = this.bbox(a);
      if (SCALE_TYPES[a.type]) {
        out.tl = toS(b.x, b.y);
        out.tr = toS(b.x + b.w, b.y);
        out.bl = toS(b.x, b.y + b.h);
        out.br = toS(b.x + b.w, b.y + b.h);
        return out;
      }
      out.tl = toS(b.x, b.y);
      out.tm = toS(b.x + b.w / 2, b.y);
      out.tr = toS(b.x + b.w, b.y);
      out.ml = toS(b.x, b.y + b.h / 2);
      out.mr = toS(b.x + b.w, b.y + b.h / 2);
      out.bl = toS(b.x, b.y + b.h);
      out.bm = toS(b.x + b.w / 2, b.y + b.h);
      out.br = toS(b.x + b.w, b.y + b.h);
      return out;
    },

    handleAt(a, screenPt, view, radius) {
      const r = radius || 8;
      const hs = this.handlesScreen(a, view);
      for (const k in hs) {
        const pt = hs[k];
        if (Math.abs(screenPt.x - pt.x) <= r && Math.abs(screenPt.y - pt.y) <= r) return k;
      }
      return null;
    },

    resize(a, handle, pt) {
      if (handle === "p1") {
        a.x1 = pt.x;
        a.y1 = pt.y;
        return;
      }
      if (handle === "p2") {
        a.x2 = pt.x;
        a.y2 = pt.y;
        return;
      }
      if (SCALE_TYPES[a.type]) {
        const b = this.bbox(a);
        const corners = {
          tl: { x: b.x, y: b.y },
          tr: { x: b.x + b.w, y: b.y },
          bl: { x: b.x, y: b.y + b.h },
          br: { x: b.x + b.w, y: b.y + b.h }
        };
        const oppName = { tl: "br", br: "tl", tr: "bl", bl: "tr" }[handle] || "br";
        const opp = corners[oppName];
        const hc = corners[handle] || corners.tl;
        const denom = Math.hypot(hc.x - opp.x, hc.y - opp.y);
        if (denom < 1) return;
        let f = Math.hypot(pt.x - opp.x, pt.y - opp.y) / denom;
        f = SSA.util.clamp(f, 0.05, 20);
        this.scaleAbout(a, f, opp.x, opp.y);
        return;
      }
      const b = this.bbox(a);
      let x1 = b.x;
      let y1 = b.y;
      let x2 = b.x + b.w;
      let y2 = b.y + b.h;
      if (handle.indexOf("l") >= 0) x1 = pt.x;
      if (handle.indexOf("r") >= 0) x2 = pt.x;
      if (handle.indexOf("t") >= 0) y1 = pt.y;
      if (handle.indexOf("b") >= 0) y2 = pt.y;
      a.x = Math.min(x1, x2);
      a.y = Math.min(y1, y2);
      a.w = Math.abs(x2 - x1);
      a.h = Math.abs(y2 - y1);
    },

    scaleAbout(a, f, ox, oy) {
      const sc = function (v, o) {
        return o + (v - o) * f;
      };
      const t = a.type;
      if (BBOX_TYPES[t]) {
        a.x = sc(a.x, ox);
        a.y = sc(a.y, oy);
        a.w *= f;
        a.h *= f;
        a.width *= f;
      } else if (LINE_TYPES[t]) {
        a.x1 = sc(a.x1, ox);
        a.y1 = sc(a.y1, oy);
        a.x2 = sc(a.x2, ox);
        a.y2 = sc(a.y2, oy);
        a.width *= f;
      } else if (PATH_TYPES[t]) {
        a.points = a.points.map(function (p) {
          return [sc(p[0], ox), sc(p[1], oy)];
        });
        a.width *= f;
      } else if (t === "text" || t === "label") {
        a.x = sc(a.x, ox);
        a.y = sc(a.y, oy);
        a.fontSize = Math.max(6, (a.fontSize || 18) * f);
      } else if (t === "cross" || t === "tick") {
        a.x = sc(a.x, ox);
        a.y = sc(a.y, oy);
        a.size = Math.max(6, (a.size || 30) * f);
        a.width *= f;
      } else if (t === "number") {
        a.x = sc(a.x, ox);
        a.y = sc(a.y, oy);
        a.r = Math.max(5, (a.r || 13) * f);
      } else if (t === "pin") {
        a.x = sc(a.x, ox);
        a.y = sc(a.y, oy);
        a.size = Math.max(8, (a.size || 32) * f);
      } else {
        a.x = sc(a.x, ox);
        a.y = sc(a.y, oy);
      }
    },

    handleCursor(handle) {
      switch (handle) {
        case "tl":
        case "br":
          return "nwse-resize";
        case "tr":
        case "bl":
          return "nesw-resize";
        case "tm":
        case "bm":
          return "ns-resize";
        case "ml":
        case "mr":
          return "ew-resize";
        case "p1":
        case "p2":
          return "crosshair";
        default:
          return "default";
      }
    }
  };
})();
