(function () {
  "use strict";

  const SSA = (window.SSA = window.SSA || {});

  /* World-space gap (px) between the two comparison panes. */
  SSA.PANE_GAP = 24;

  /* Active theme runtime values (updated by the UI). */
  SSA.theme = { mode: "dark", bg: "#0b0d11" };

  /* Overlay view options (grid/ruler) updated by the UI. */
  SSA.view = { grid: false, ruler: false, gridSize: 50 };

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
      return {
        id: p.id,
        version: 2,
        name: p.name,
        updatedAt: p.updatedAt,
        assets: SSA.Assets.used(p),
        annotations: p.annotations,
        view: { scale: 1, ox: 0, oy: 0 },
        numberSeed: p.numberSeed
      };
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
      case "measure":
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
        base.note = "";
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

  /* Büyük görsel varlıklarını kayıt için küçült/sıkıştır.
     Öğenin tuvaldeki boyutu (x,y,w,h) değişmez, yalnızca piksel verisi küçülür. */
  SSA.compressProject = function (p) {
    if (!p || !p.assets) return false;
    let changed = false;
    const used = SSA.Assets.used(p);
    for (const id in used) {
      const im = p.assets[id];
      const el = SSA.Assets.el(id);
      if (!im || !el) continue;
      const maxDim = 2600;
      const big = Math.max(im.w, im.h) > maxDim;
      const pngHeavy = /^data:image\/png/i.test(im.src) && im.src.length > 400000;
      if (!big && !pngHeavy) continue;
      const s = big ? maxDim / Math.max(im.w, im.h) : 1;
      const w = Math.max(1, Math.round(im.w * s));
      const h = Math.max(1, Math.round(im.h * s));
      const c = document.createElement("canvas");
      c.width = w;
      c.height = h;
      const cx = c.getContext("2d");
      cx.imageSmoothingQuality = "high";
      cx.drawImage(el, 0, 0, w, h);
      const src = c.toDataURL("image/jpeg", 0.85);
      p.assets[id] = { src: src, w: w, h: h };
      SSA.Assets.register(id, src);
      changed = true;
    }
    return changed;
  };

  /* Small thumbnail dataURL for the project list. */
  SSA.makeThumb = function (p) {
    try {
      const full = SSA.Export.renderFullSync(p);
      if (!full) return null;
      const c = document.createElement("canvas");
      const W = 120;
      const fullH = Math.round((W * full.height) / full.width);
      c.width = W;
      c.height = Math.max(1, Math.min(160, fullH));
      const cx = c.getContext("2d");
      cx.fillStyle = "#ffffff";
      cx.fillRect(0, 0, c.width, c.height);
      cx.drawImage(full, 0, 0, W, fullH);
      return c.toDataURL("image/jpeg", 0.6);
    } catch (e) {
      return null;
    }
  };
})();

/* ===================== Görsel öğeleri (v2) =====================
   Arka plan görseli yok: her görsel "image" türünde bir öğedir.
   Piksel verisi project.assets[id] = {src,w,h} içinde, öğe ise
   { type:"image", asset:id, x,y,w,h, opacity } olarak tutulur.
   Böylece geri alma geçmişi büyük dataURL'leri kopyalamaz. */
(function () {
  "use strict";
  const SSA = (window.SSA = window.SSA || {});

  const cache = {}; // assetId -> HTMLImageElement
  const srcOf = {}; // assetId -> src

  SSA.Assets = {
    register: function (id, src) {
      if (!id || !src) return;
      if (srcOf[id] === src && cache[id]) return;
      srcOf[id] = src;
      const img = new Image();
      img.onload = function () {
        if (SSA.App && SSA.App.render) SSA.App.render();
      };
      img.src = src;
      cache[id] = img;
    },
    el: function (id) {
      const im = cache[id];
      return im && im.complete && im.naturalWidth ? im : null;
    },
    registerAll: function (p) {
      const a = (p && p.assets) || {};
      for (const id in a) SSA.Assets.register(id, a[id].src);
    },
    add: function (p, src, w, h) {
      const id = SSA.util.uid();
      p.assets = p.assets || {};
      p.assets[id] = { src: src, w: w, h: h };
      SSA.Assets.register(id, src);
      return id;
    },
    /* Yalnızca öğelerin kullandığı varlıklar (kayıt / dışa aktarım için) */
    used: function (p) {
      const out = {};
      const anns = (p && p.annotations) || [];
      for (let i = 0; i < anns.length; i++) {
        const a = anns[i];
        if (a.type === "image" && p.assets && p.assets[a.asset]) out[a.asset] = p.assets[a.asset];
      }
      return out;
    }
  };

  SSA.imageAnn = function (assetId, x, y, w, h) {
    return { id: SSA.util.uid(), type: "image", asset: assetId, x: x, y: y, w: w, h: h, opacity: 1, color: "#4f8cff", width: 2 };
  };

  /* Görünür tüm öğeleri kapsayan dikdörtgen (yoksa null) */
  SSA.contentBBox = function (p, onlyImages) {
    const anns = (p && p.annotations) || [];
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (let i = 0; i < anns.length; i++) {
      const a = anns[i];
      if (a.hidden) continue;
      if (onlyImages && a.type !== "image") continue;
      const b = SSA.geom.bbox(a);
      if (!isFinite(b.x) || !isFinite(b.y)) continue;
      const pad = a.type === "image" || a.type === "blur" || a.type === "highlight" ? 0 : (a.width || 3) / 2 + 2;
      minX = Math.min(minX, b.x - pad);
      minY = Math.min(minY, b.y - pad);
      maxX = Math.max(maxX, b.x + b.w + pad);
      maxY = Math.max(maxY, b.y + b.h + pad);
    }
    if (!isFinite(minX)) return null;
    return { x: minX, y: minY, w: Math.max(1, maxX - minX), h: Math.max(1, maxY - minY) };
  };

  /* Eski biçimi (arka plan image + image2) yeni biçime çevirir. Yerinde değiştirir. */
  SSA.migrateProject = function (p) {
    if (!p) return p;
    p.assets = p.assets || {};
    p.annotations = p.annotations || [];
    const front = [];
    if (p.image && p.image.src) {
      const id = SSA.Assets.add(p, p.image.src, p.image.w, p.image.h);
      front.push(SSA.imageAnn(id, 0, 0, p.image.w, p.image.h));
    }
    let tail = [];
    if (p.image2 && p.image2.src) {
      const pos = p.image2Pos || { x: (p.image ? p.image.w : 0) + (SSA.PANE_GAP || 24), y: 0 };
      const id2 = SSA.Assets.add(p, p.image2.src, p.image2.w, p.image2.h);
      const a2 = SSA.imageAnn(id2, pos.x, pos.y, p.image2.w, p.image2.h);
      if (typeof p.image2Opacity === "number") a2.opacity = p.image2Opacity;
      tail.push(a2);
      const anns2 = p.annotations2 || [];
      for (let i = 0; i < anns2.length; i++) {
        SSA.geom.translate(anns2[i], pos.x, pos.y);
        tail.push(anns2[i]);
      }
    }
    p.annotations = front.concat(p.annotations, tail);
    p.image = null;
    p.imageEl = null;
    p.image2 = null;
    p.imageEl2 = null;
    p.annotations2 = [];
    p.image2Pos = null;
    SSA.Assets.registerAll(p);
    return p;
  };
})();
