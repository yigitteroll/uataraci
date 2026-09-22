(function () {
  "use strict";

  const SSA = (window.SSA = window.SSA || {});

  /* World-space gap (px) between the two comparison panes. */
  SSA.PANE_GAP = 24;

  /* ---------------- Utilities ---------------- */
  SSA.util = {
    uid() {
      return "a" + Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4);
    },
    clone(o) {
      try {
        return structuredClone(o);
      } catch (e) {
        return JSON.parse(JSON.stringify(o));
      }
    },
    clamp(v, a, b) {
      return Math.max(a, Math.min(b, v));
    },
    debounce(fn, ms) {
      let t = null;
      let lastArgs = null;
      let self = null;
      return function () {
        lastArgs = arguments;
        self = this;
        clearTimeout(t);
        t = setTimeout(function () {
          t = null;
          fn.apply(self, lastArgs);
        }, ms);
      };
    },
    fmtDate(ts) {
      if (!ts) return "";
      try {
        return new Date(ts).toLocaleString("tr-TR", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit"
        });
      } catch (e) {
        return new Date(ts).toLocaleString();
      }
    },
    bytes(n) {
      if (!n) return "0 B";
      if (n < 1024) return n + " B";
      if (n < 1024 * 1024) return (n / 1024).toFixed(1) + " KB";
      return (n / (1024 * 1024)).toFixed(2) + " MB";
    },
    isEditable(el) {
      if (!el) return false;
      const tag = (el.tagName || "").toLowerCase();
      return tag === "input" || tag === "textarea" || tag === "select" || el.isContentEditable;
    }
  };

  /* ---------------- Store: IndexedDB (localStorage fallback) ---------------- */
  const P_ACTIVE = "ssa.active.v1";
  const P_PREFS = "ssa.prefs.v1";
  const P_LIST = "ssa.projects.v1";
  const DB_NAME = "ssa.db";
  const DB_VER = 1;
  const ST_PROJ = "projects";
  const ST_META = "meta";

  SSA.Store = (function () {
    let db = null;
    let mode = "ls";
    let metas = [];
    let initPromise = null;

    function reqP(request) {
      return new Promise(function (resolve, reject) {
        request.onsuccess = function () {
          resolve(request.result);
        };
        request.onerror = function () {
          reject(request.error);
        };
      });
    }
    function store(name, txnMode) {
      return db.transaction(name, txnMode).objectStore(name);
    }
    function idbPut(name, val) {
      return reqP(store(name, "readwrite").put(val));
    }
    function idbDel(name, key) {
      return reqP(store(name, "readwrite").delete(key));
    }

    function openDB() {
      return new Promise(function (resolve, reject) {
        if (!window.indexedDB) {
          reject(new Error("no-idb"));
          return;
        }
        let req;
        try {
          req = window.indexedDB.open(DB_NAME, DB_VER);
        } catch (e) {
          reject(e);
          return;
        }
        req.onupgradeneeded = function () {
          const d = req.result;
          if (!d.objectStoreNames.contains(ST_PROJ)) d.createObjectStore(ST_PROJ, { keyPath: "id" });
          if (!d.objectStoreNames.contains(ST_META)) d.createObjectStore(ST_META, { keyPath: "id" });
        };
        req.onsuccess = function () {
          resolve(req.result);
        };
        req.onerror = function () {
          reject(req.error || new Error("idb-open"));
        };
        req.onblocked = function () {
          reject(new Error("idb-blocked"));
        };
      });
    }

    function lsList() {
      try {
        return JSON.parse(localStorage.getItem(P_LIST) || "[]") || [];
      } catch (e) {
        return [];
      }
    }
    function lsSetList(l) {
      try {
        localStorage.setItem(P_LIST, JSON.stringify(l));
      } catch (e) {
        /* ignore */
      }
    }
    function lsGet(id) {
      try {
        const r = localStorage.getItem("ssa.project." + id);
        return r ? JSON.parse(r) : null;
      } catch (e) {
        return null;
      }
    }
    function lsSet(id, payload) {
      localStorage.setItem("ssa.project." + id, JSON.stringify(payload));
    }
    function lsRemove(id) {
      try {
        localStorage.removeItem("ssa.project." + id);
      } catch (e) {
        /* ignore */
      }
    }

    async function migrateLegacy() {
      const legacy = lsList();
      if (!legacy.length) return;
      for (let i = 0; i < legacy.length; i++) {
        const m = legacy[i];
        const p = lsGet(m.id);
        if (p) {
          await idbPut(ST_PROJ, p);
          await idbPut(ST_META, m);
        }
      }
      metas = legacy.slice();
      for (let i = 0; i < legacy.length; i++) lsRemove(legacy[i].id);
      try {
        localStorage.removeItem(P_LIST);
      } catch (e) {
        /* ignore */
      }
    }

    function init() {
      if (initPromise) return initPromise;
      initPromise = (async function () {
        try {
          db = await openDB();
          mode = "idb";
          const all = await reqP(store(ST_META, "readonly").getAll());
          metas = all || [];
          await migrateLegacy();
        } catch (e) {
          mode = "ls";
          db = null;
          metas = lsList();
        }
        return mode;
      })();
      return initPromise;
    }

    function payloadOf(p) {
      const payload = {
        id: p.id,
        name: p.name,
        updatedAt: p.updatedAt,
        image: { src: p.image.src, w: p.image.w, h: p.image.h },
        annotations: p.annotations,
        view: { scale: 1, ox: 0, oy: 0 },
        numberSeed: p.numberSeed
      };
      if (p.image2) {
        payload.image2 = { src: p.image2.src, w: p.image2.w, h: p.image2.h };
        payload.annotations2 = p.annotations2 || [];
        payload.image2Pos = p.image2Pos || { x: p.image.w + SSA.PANE_GAP, y: 0 };
        payload.image2Opacity = typeof p.image2Opacity === "number" ? p.image2Opacity : 1;
      }
      return payload;
    }

    return {
      init: init,
      mode: function () {
        return mode;
      },
      list: function () {
        return metas.slice();
      },
      upsertMeta: function (meta) {
        const i = metas.findIndex(function (m) {
          return m.id === meta.id;
        });
        if (i >= 0) metas[i] = meta;
        else metas.unshift(meta);
        if (mode === "idb") {
          idbPut(ST_META, meta).catch(function () {});
        } else {
          const l = lsList();
          const j = l.findIndex(function (m) {
            return m.id === meta.id;
          });
          if (j >= 0) l[j] = meta;
          else l.unshift(meta);
          lsSetList(l);
        }
      },
      getProject: async function (id) {
        if (mode === "idb") {
          try {
            const p = await reqP(store(ST_PROJ, "readonly").get(id));
            return p || null;
          } catch (e) {
            return null;
          }
        }
        return lsGet(id);
      },
      saveProject: async function (p) {
        const payload = payloadOf(p);
        if (mode === "idb") {
          try {
            await idbPut(ST_PROJ, payload);
            return true;
          } catch (e) {
            return false;
          }
        }
        try {
          lsSet(p.id, payload);
          return true;
        } catch (e) {
          return false;
        }
      },
      remove: function (id) {
        metas = metas.filter(function (m) {
          return m.id !== id;
        });
        if (mode === "idb") {
          idbDel(ST_PROJ, id).catch(function () {});
          idbDel(ST_META, id).catch(function () {});
        } else {
          lsRemove(id);
          lsSetList(
            lsList().filter(function (m) {
              return m.id !== id;
            })
          );
        }
        try {
          if (localStorage.getItem(P_ACTIVE) === id) localStorage.removeItem(P_ACTIVE);
        } catch (e) {
          /* ignore */
        }
      },
      setActive: function (id) {
        try {
          if (id) localStorage.setItem(P_ACTIVE, id);
          else localStorage.removeItem(P_ACTIVE);
        } catch (e) {
          /* ignore */
        }
      },
      getActive: function () {
        try {
          return localStorage.getItem(P_ACTIVE);
        } catch (e) {
          return null;
        }
      },
      prefs: function () {
        try {
          const raw = localStorage.getItem(P_PREFS);
          return raw ? JSON.parse(raw) : {};
        } catch (e) {
          return {};
        }
      },
      setPrefs: function (o) {
        try {
          localStorage.setItem(P_PREFS, JSON.stringify(o));
        } catch (e) {
          /* ignore */
        }
      }
    };
  })();

  /* ---------------- Annotation factory ---------------- */
  SSA.makeAnn = function (type, pt, st) {
    const base = {
      id: SSA.util.uid(),
      type: type,
      color: st.color,
      width: st.width,
      opacity: st.opacity
    };

    switch (type) {
      case "arrow":
      case "line":
        base.x1 = pt.x;
        base.y1 = pt.y;
        base.x2 = pt.x;
        base.y2 = pt.y;
        break;
      case "freehand":
      case "strike":
        base.points = [[pt.x, pt.y]];
        break;
      case "rect":
      case "ellipse":
      case "highlight":
        base.x = pt.x;
        base.y = pt.y;
        base.w = 0;
        base.h = 0;
        break;
      case "blur":
        base.x = pt.x;
        base.y = pt.y;
        base.w = 0;
        base.h = 0;
        base.mode = st.blurMode;
        base.strength = st.blurStrength;
        break;
      case "text":
      case "label":
        base.x = pt.x;
        base.y = pt.y;
        base.text = "";
        base.fontSize = st.fontSize;
        base.bg = type === "label" ? "color" : "none";
        break;
      case "cross":
      case "tick":
        base.x = pt.x;
        base.y = pt.y;
        base.size = st.badgeSize || 30;
        base.width = Math.max(5, (st.width || 4) + 2);
        break;
      case "pin":
        base.x = pt.x;
        base.y = pt.y;
        base.size = 32;
        break;
      case "number":
        base.x = pt.x;
        base.y = pt.y;
        base.n =
          SSA.App && SSA.App.state.project ? SSA.App.state.project.numberSeed : 1;
        base.r = 13;
        break;
      default:
        base.x = pt.x;
        base.y = pt.y;
    }
    return base;
  };

  /* ---------------- Image helpers ---------------- */
  SSA.imageToDataURL = function (img, maxDim, usePng) {
    let w = img.naturalWidth || img.width;
    let h = img.naturalHeight || img.height;
    const scale = maxDim && Math.max(w, h) > maxDim ? maxDim / Math.max(w, h) : 1;
    w = Math.max(1, Math.round(w * scale));
    h = Math.max(1, Math.round(h * scale));
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    const cx = c.getContext("2d");
    cx.drawImage(img, 0, 0, w, h);
    if (usePng) return c.toDataURL("image/png");
    return c.toDataURL("image/jpeg", 0.92);
  };

  /* Shrink/compress one image (+ its annotations) for storage.
     Mutates the project so in-memory coordinates stay consistent. */
  function shrinkOne(p, imgProp, elProp, annProp) {
    const im = p[imgProp];
    const el = p[elProp];
    if (!im || !el) return;
    const w0 = im.w;
    const h0 = im.h;
    const maxDim = 2600;
    const big = Math.max(w0, h0) > maxDim;
    const isPng = /^data:image\/png/i.test(im.src);
    const pngHeavy = isPng && im.src.length > 400000;
    if (!big && !pngHeavy) return;

    const s = big ? maxDim / Math.max(w0, h0) : 1;
    const w = Math.max(1, Math.round(w0 * s));
    const h = Math.max(1, Math.round(h0 * s));
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    const cx = c.getContext("2d");
    cx.imageSmoothingQuality = "high";
    cx.drawImage(el, 0, 0, w, h);
    const src = c.toDataURL("image/jpeg", 0.85);

    if (s !== 1 && p[annProp]) {
      for (let i = 0; i < p[annProp].length; i++) {
        SSA.geom.scale(p[annProp][i], s);
      }
    }

    p[imgProp] = { src: src, w: w, h: h };
    const img = new Image();
    img.onload = function () {
      if (SSA.App && SSA.App.render) SSA.App.render();
    };
    img.src = src;
    p[elProp] = img;
  }

  SSA.compressProject = function (p) {
    if (!p) return;
    shrinkOne(p, "image", "imageEl", "annotations");
    shrinkOne(p, "image2", "imageEl2", "annotations2");
  };

  /* Small thumbnail dataURL for the project list. */
  SSA.makeThumb = function (p) {
    try {
      const c = document.createElement("canvas");
      const W = 120;
      const ratio = p.image.h / p.image.w;
      c.width = W;
      c.height = Math.max(1, Math.round(W * ratio));
      const cx = c.getContext("2d");
      cx.drawImage(p.imageEl, 0, 0, c.width, c.height);
      return c.toDataURL("image/jpeg", 0.6);
    } catch (e) {
      return null;
    }
  };
})();
