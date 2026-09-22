(function () {
  "use strict";

  const SSA = window.SSA;
  const clamp = SSA.util.clamp;

  /* ---------------- Icons ---------------- */
  const ICON_PATHS = {
    select: '<path d="M5 3l6.4 16.2 2.3-6.6 6.6-2.3z"/>',
    hand: '<path d="M8 11.5V6a1.7 1.7 0 0 1 3.4 0v4.5"/><path d="M11.4 10.5V4.6a1.7 1.7 0 0 1 3.4 0v5.9"/><path d="M14.8 10.7V6.7a1.7 1.7 0 0 1 3.4 0V14a6 6 0 0 1-6 6h-1a5 5 0 0 1-3.7-1.6l-3.3-3.7a1.8 1.8 0 0 1 2.6-2.5l1.6 1.6"/>',
    crop: '<path d="M6 2v14a2 2 0 0 0 2 2h14"/><path d="M2 6h14a2 2 0 0 1 2 2v14"/>',
    arrow: '<path d="M5 19 19 5"/><path d="M12 5h7v7"/>',
    line: '<path d="M5 19 19 5"/>',
    pen: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
    strike: '<path d="M4 12h16"/><path d="M16.5 7.5C15.8 6 14.1 5 12 5 9.5 5 8 6.4 8 8s1.4 2.6 3.6 3"/><path d="M7.5 16.5C8.2 18 9.9 19 12 19c2.5 0 4-1.4 4-3s-1.4-2.6-3.4-3"/>',
    rect: '<rect x="4" y="5" width="16" height="14" rx="1.5"/>',
    ellipse: '<ellipse cx="12" cy="12" rx="8" ry="6.5"/>',
    highlight: '<path d="M15.5 3.5 20.5 8.5 9 20H4v-5z"/><path d="m13 6 5 5"/>',
    blur: '<path d="M12 3s6 6.4 6 10.4A6 6 0 0 1 6 13.4C6 9.4 12 3 12 3z"/><path d="M9.4 13.8h5.2"/>',
    text: '<path d="M5 5h14"/><path d="M12 5v14"/><path d="M9.5 19h5"/>',
    label: '<path d="M20.6 13.4 12.6 21.4a2 2 0 0 1-2.8 0L3 14.6V6a3 3 0 0 1 3-3h8.6l6 6a2 2 0 0 1 0 2.8z"/><circle cx="8.5" cy="8.5" r="1.4"/>',
    pin: '<path d="M12 21s7-6.3 7-11a7 7 0 1 0-14 0c0 4.7 7 11 7 11z"/><circle cx="12" cy="10" r="2.5"/>',
    number: '<circle cx="12" cy="12" r="9"/><path d="M12 7.5v9"/><path d="m10 9.5 2-2"/>',
    cross: '<path d="M6 6l12 12"/><path d="M18 6 6 18"/>',
    tick: '<path d="M5 13l4 4L19 7"/>',
    eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/>',
    eyeOff: '<path d="M3 3l18 18"/><path d="M10.6 5.2A9.7 9.7 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-3.2 4.2"/><path d="M6.3 6.3A17 17 0 0 0 2 12s3.5 7 10 7a9.6 9.6 0 0 0 4.2-.9"/>',
    up: '<path d="m6 15 6-6 6 6"/>',
    down: '<path d="m6 9 6 6 6-6"/>',
    trash: '<path d="M4 7h16"/><path d="M10 11v6M14 11v6"/><path d="M6 7l1 13h10l1-13"/><path d="M9 7V4h6v3"/>'
  };

  function svg(name, size) {
    const s = size || 20;
    return (
      '<svg viewBox="0 0 24 24" width="' +
      s +
      '" height="' +
      s +
      '" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' +
      ICON_PATHS[name] +
      "</svg>"
    );
  }

  /* ---------------- Tool definitions ---------------- */
  const TOOLS = [
    { id: "select", icon: "select", label: "Seç / Taşı", key: "V" },
    { id: "pan", icon: "hand", label: "Kaydır", key: "" },
    { id: "crop", icon: "crop", label: "Kırp", key: "C" },
    { sep: true },
    { id: "arrow", icon: "arrow", label: "Ok", key: "A" },
    { id: "line", icon: "line", label: "Çizgi", key: "L" },
    { id: "freehand", icon: "pen", label: "Serbest Çizim", key: "P" },
    { id: "strike", icon: "strike", label: "Üstünü Çiz", key: "S" },
    { id: "rect", icon: "rect", label: "Dikdörtgen", key: "R" },
    { id: "ellipse", icon: "ellipse", label: "Elips", key: "E" },
    { id: "highlight", icon: "highlight", label: "Vurgu", key: "H" },
    { id: "blur", icon: "blur", label: "Bulanık / Mozaik", key: "B" },
    { sep: true },
    { id: "text", icon: "text", label: "Metin", key: "T" },
    { id: "label", icon: "label", label: "Etiket", key: "K" },
    { id: "cross", icon: "cross", label: "Çarpı", key: "X" },
    { id: "tick", icon: "tick", label: "Tik", key: "Y" },
    { id: "pin", icon: "pin", label: "Pin", key: "G" },
    { id: "number", icon: "number", label: "Numara", key: "N" }
  ];

  const TOOL_KEYS = {};
  TOOLS.forEach(function (t) {
    if (t.key) TOOL_KEYS[t.key.toLowerCase()] = t.id;
  });

  const TYPE_ICON = {
    arrow: "arrow",
    line: "line",
    freehand: "pen",
    strike: "strike",
    rect: "rect",
    ellipse: "ellipse",
    highlight: "highlight",
    text: "text",
    label: "label",
    pin: "pin",
    number: "number",
    cross: "cross",
    tick: "tick",
    blur: "blur"
  };

  const SWATCHES = [
    "#ff3b30",
    "#ff9500",
    "#ffcc00",
    "#34c759",
    "#00c7be",
    "#4f8cff",
    "#7c5cff",
    "#ff2d95",
    "#ffffff",
    "#111111"
  ];

  /* ---------------- History ---------------- */
  SSA.History = {
    stack: [],
    index: -1,
    limit: 90,
    reset: function (snap) {
      this.stack = snap ? [snap] : [];
      this.index = this.stack.length - 1;
    },
    push: function (snap) {
      this.stack = this.stack.slice(0, this.index + 1);
      this.stack.push(snap);
      if (this.stack.length > this.limit) this.stack.shift();
      this.index = this.stack.length - 1;
    },
    canUndo: function () {
      return this.index > 0;
    },
    canRedo: function () {
      return this.index < this.stack.length - 1;
    },
    undo: function () {
      if (!this.canUndo()) return null;
      this.index--;
      return this.stack[this.index];
    },
    redo: function () {
      if (!this.canRedo()) return null;
      this.index++;
      return this.stack[this.index];
    }
  };

  /* ---------------- App ---------------- */
  const App = {
    canvas: null,
    ctx: null,
    stage: null,
    dpr: 1,
    el: {},
    _syncing: false,
    _textResolve: null,

    state: {
      project: null,
      tool: "select",
      selectedIds: [],
      selectedIds2: [],
      activePane: 1,
      color: "#ff3b30",
      width: 4,
      opacity: 1,
      fontSize: 18,
      blurMode: "blur",
      blurStrength: 12,
      autoSelect: true,
      moveImage2: false,
      spaceDown: false,
      pointer: { screen: { x: 0, y: 0 }, image: { x: 0, y: 0 } },
      preview: null,
      previewPane: 1
    },

    /* ---------- init ---------- */
    init: async function () {
      const self = this;
      this.canvas = document.getElementById("canvas");
      this.ctx = this.canvas.getContext("2d");
      this.stage = document.getElementById("stage");

      const ids = [
        "projectName", "saveStatus", "toolbar", "layerList", "swatches",
        "colorInput", "widthRange", "widthVal", "opacityRange", "opacityVal",
        "fontRow", "fontRange", "fontVal", "blurRow", "blurMode", "blurStrengthRow",
        "blurRange", "blurVal", "numberRow", "numberSeed", "numberReset",
        "undoBtn", "redoBtn", "openBtn", "pasteBtn", "captureBtn", "compareBtn", "exportBtn", "copyBtn",
        "projectsBtn", "projectsPop", "projectsList", "projectsClose", "newProjectBtn",
        "moreBtn", "moreMenu", "fileInput", "fileInput2", "jsonInput", "stageEmpty", "emptyOpen",
        "emptyPaste", "emptyCapture", "dropHint", "zoomLabel", "statusDims", "statusZoom", "statusPos",
        "statusSel", "deleteSelected", "paneSwitch", "shortcutList", "toast", "textModal",
        "textModalInput", "textModalOk", "textModalCancel", "textModalClose", "textModalTitle",
        "textFontRange", "textFontVal", "textBg", "autoSelect",
        "compareRow", "img2MoveBtn", "img2SideBtn", "img2OverlayBtn",
        "img2OpacityRow", "img2Opacity", "img2OpacityVal"
      ];
      ids.forEach(function (id) {
        self.el[id] = document.getElementById(id);
      });

      this.loadPrefs();
      this.buildToolbar();
      this.buildSwatches();
      this.buildShortcuts();
      this.bindTopbar();
      this.bindProps();
      this.bindKeyboard();
      this.bindDnD();
      this.bindModal();

      SSA.Tools.bind(this.canvas);
      this.resizeCanvas();

      window.addEventListener("resize", function () {
        self.resizeCanvas();
        self.render();
      });
      if (window.ResizeObserver) {
        new ResizeObserver(function () {
          self.resizeCanvas();
          self.render();
        }).observe(this.stage);
      }

      await SSA.Store.init();
      const active = SSA.Store.getActive();
      let loaded = false;
      if (active) {
        const data = await SSA.Store.getProject(active);
        if (data && data.image) {
          this.loadProject(active, data);
          loaded = true;
        }
      }
      if (!loaded) this.newProject();

      this.renderProjects();
      this.updateHistoryButtons();
      this.updatePropVisibility();
      this.syncProps();
      this.render();

      window.addEventListener("beforeunload", function () {
        self.flushSave();
      });
      document.addEventListener("visibilitychange", function () {
        if (document.visibilityState === "hidden") self.flushSave();
      });
    },

    loadPrefs: function () {
      const p = SSA.Store.prefs();
      const s = this.state;
      if (p.color) s.color = p.color;
      if (p.width) s.width = p.width;
      if (typeof p.opacity === "number") s.opacity = p.opacity;
      if (p.fontSize) s.fontSize = p.fontSize;
      if (p.blurMode) s.blurMode = p.blurMode;
      if (p.blurStrength) s.blurStrength = p.blurStrength;
      if (typeof p.autoSelect === "boolean") s.autoSelect = p.autoSelect;
    },

    savePrefs: function () {
      const s = this.state;
      SSA.Store.setPrefs({
        color: s.color,
        width: s.width,
        opacity: s.opacity,
        fontSize: s.fontSize,
        blurMode: s.blurMode,
        blurStrength: s.blurStrength,
        autoSelect: s.autoSelect
      });
    },

    resizeCanvas: function () {
      if (!this.stage) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.max(1, this.stage.clientWidth);
      const h = Math.max(1, this.stage.clientHeight);
      this.dpr = dpr;
      this.canvas.width = Math.round(w * dpr);
      this.canvas.height = Math.round(h * dpr);
      this.canvas.style.width = w + "px";
      this.canvas.style.height = h + "px";
    },

    /* ---------- coordinates ---------- */
    view: function () {
      return this.state.project ? this.state.project.view : { scale: 1, ox: 0, oy: 0 };
    },
    screenToImage: function (x, y) {
      const v = this.view();
      return { x: (x - v.ox) / v.scale, y: (y - v.oy) / v.scale };
    },
    imageToScreen: function (x, y) {
      const v = this.view();
      return { x: x * v.scale + v.ox, y: y * v.scale + v.oy };
    },
    setPointer: function (screen, image) {
      this.state.pointer.screen = screen;
      this.state.pointer.image = image;
      this.updateStatus();
    },

    /* ---------- view ops ---------- */
    fitView: function () {
      const p = this.state.project;
      if (!p || !p.image) return;
      const cw = this.canvas.width / this.dpr;
      const ch = this.canvas.height / this.dpr;
      const pad = 44;
      let minX = 0;
      let minY = 0;
      let maxX = p.image.w;
      let maxY = p.image.h;
      if (p.image2) {
        const o = this.paneOrigin(2);
        minX = Math.min(minX, o.x);
        minY = Math.min(minY, o.y);
        maxX = Math.max(maxX, o.x + p.image2.w);
        maxY = Math.max(maxY, o.y + p.image2.h);
      }
      const W = Math.max(1, maxX - minX);
      const H = Math.max(1, maxY - minY);
      const s = Math.min((cw - pad * 2) / W, (ch - pad * 2) / H);
      const scale = clamp(s, 0.02, 4);
      p.view.scale = scale;
      p.view.ox = (cw - W * scale) / 2 - minX * scale;
      p.view.oy = (ch - H * scale) / 2 - minY * scale;
      this.render();
    },
    setZoom: function (scale, anchor) {
      const p = this.state.project;
      if (!p || !p.image) return;
      const cw = this.canvas.width / this.dpr;
      const ch = this.canvas.height / this.dpr;
      const a = anchor || { x: cw / 2, y: ch / 2 };
      const ip = this.screenToImage(a.x, a.y);
      const ns = clamp(scale, 0.05, 8);
      p.view.scale = ns;
      p.view.ox = a.x - ip.x * ns;
      p.view.oy = a.y - ip.y * ns;
      this.render();
    },

    /* ---------- tools ---------- */
    buildToolbar: function () {
      const el = this.el.toolbar;
      const self = this;
      el.innerHTML = "";
      TOOLS.forEach(function (t) {
        if (t.sep) {
          const sep = document.createElement("div");
          sep.className = "tool-sep";
          el.appendChild(sep);
          return;
        }
        const b = document.createElement("button");
        b.type = "button";
        b.className = "tool";
        b.dataset.tool = t.id;
        b.title = t.label + (t.key ? " (" + t.key + ")" : "");
        b.innerHTML = svg(t.icon, 20);
        b.addEventListener("click", function () {
          self.setTool(t.id);
        });
        el.appendChild(b);
      });
    },

    setTool: function (id) {
      this.state.tool = id;
      if (id === "cross") this.state.color = "#ff3b30";
      else if (id === "tick") this.state.color = "#34c759";
      const btns = this.el.toolbar.querySelectorAll(".tool");
      for (let i = 0; i < btns.length; i++) {
        btns[i].classList.toggle("is-active", btns[i].dataset.tool === id);
      }
      this.updatePropVisibility();
      this.syncProps();
      this.render();
    },

    updatePropVisibility: function () {
      const sel = this.selectedAnns();
      const single = sel.length === 1 ? sel[0] : null;
      const tool = this.state.tool;
      const isText = tool === "text" || tool === "label" || (single && (single.type === "text" || single.type === "label"));
      const isBlur = tool === "blur" || (single && single.type === "blur");
      const isNum = tool === "number" || (single && single.type === "number");
      this.el.fontRow.hidden = !isText;
      this.el.blurRow.hidden = !isBlur;
      this.el.blurStrengthRow.hidden = !isBlur;
      this.el.numberRow.hidden = !isNum;
      const has2 = !!(this.state.project && this.state.project.image2);
      this.el.compareRow.hidden = !has2;
      this.el.img2OpacityRow.hidden = !has2;
    },

    /* ---------- panes / selection ---------- */
    paneOrigin: function (pane) {
      const p = this.state.project;
      if (pane === 2 && p && p.image2) {
        const pos = p.image2Pos || { x: p.image.w + SSA.PANE_GAP, y: 0 };
        return { x: pos.x, y: pos.y };
      }
      return { x: 0, y: 0 };
    },
    paneAt: function (world) {
      const p = this.state.project;
      if (!p || !p.image2 || !p.image) return 1;
      const o = this.paneOrigin(2);
      if (world.x >= o.x && world.x <= o.x + p.image2.w && world.y >= o.y && world.y <= o.y + p.image2.h) return 2;
      if (world.x >= 0 && world.x <= p.image.w && world.y >= 0 && world.y <= p.image.h) return 1;
      const d1 = Math.hypot(world.x - p.image.w / 2, world.y - p.image.h / 2);
      const d2 = Math.hypot(world.x - (o.x + p.image2.w / 2), world.y - (o.y + p.image2.h / 2));
      return d2 < d1 ? 2 : 1;
    },
    viewForPane: function (pane) {
      const v = this.state.project.view;
      const o = this.paneOrigin(pane);
      if (!o.x && !o.y) return v;
      return { scale: v.scale, ox: v.ox + o.x * v.scale, oy: v.oy + o.y * v.scale };
    },
    toLocal: function (world, pane) {
      const o = this.paneOrigin(pane);
      return { x: world.x - o.x, y: world.y - o.y };
    },
    paneAnns: function (pane) {
      const p = this.state.project;
      if (!p) return [];
      return pane === 2 ? p.annotations2 || [] : p.annotations;
    },
    paneIds: function (pane) {
      return pane === 2 ? this.state.selectedIds2 : this.state.selectedIds;
    },
    activeAnns: function () {
      return this.paneAnns(this.state.activePane);
    },
    activeIds: function () {
      return this.paneIds(this.state.activePane);
    },
    setActivePane: function (pane) {
      if (!this.state.project) return;
      if (pane === 2 && !this.state.project.image2) pane = 1;
      this.state.activePane = pane;
      this.updatePaneSwitch();
      this.renderLayers();
      this.updatePropVisibility();
      this.syncProps();
      this.updateStatus();
      this.render();
    },
    updatePaneSwitch: function () {
      const p = this.state.project;
      const has = !!(p && p.image2);
      this.el.paneSwitch.hidden = !has;
      const btns = this.el.paneSwitch.querySelectorAll("button");
      for (let i = 0; i < btns.length; i++) {
        btns[i].classList.toggle("is-active", parseInt(btns[i].dataset.pane, 10) === this.state.activePane);
      }
      if (this.el.compareBtn) this.el.compareBtn.classList.toggle("primary", has);
    },
    selectedAnns: function () {
      const ids = this.activeIds();
      return this.activeAnns().filter(function (a) {
        return ids.indexOf(a.id) >= 0;
      });
    },
    setSelection: function (ids) {
      if (this.state.activePane === 2) this.state.selectedIds2 = ids ? ids.slice() : [];
      else this.state.selectedIds = ids ? ids.slice() : [];
      this.renderLayers();
      this.updatePropVisibility();
      this.syncProps();
      this.updateStatus();
    },
    toggleSelect: function (id) {
      const ids = this.activeIds().slice();
      const i = ids.indexOf(id);
      if (i >= 0) ids.splice(i, 1);
      else ids.push(id);
      this.setSelection(ids);
    },
    deleteSelected: function () {
      const p = this.state.project;
      if (!p) return;
      const ids = this.activeIds();
      if (!ids.length) return;
      const kept = this.activeAnns().filter(function (a) {
        return ids.indexOf(a.id) < 0;
      });
      if (this.state.activePane === 2) p.annotations2 = kept;
      else p.annotations = kept;
      this.setSelection([]);
      this.commitHistory();
      this.render();
      this.saveSoon();
    },

    /* ---------- annotations ---------- */
    addAnnotation: function (a) {
      const p = this.state.project;
      if (!p) return null;
      if (this.state.activePane === 2 && !p.image2) this.state.activePane = 1;
      if (!a.id) a.id = SSA.util.uid();
      this.activeAnns().push(a);
      this.commitHistory();
      this.renderLayers();
      this.render();
      this.saveSoon();
      return a;
    },

    moveLayer: function (a, dir) {
      const p = this.state.project;
      if (!p) return;
      const anns = this.activeAnns();
      const i = anns.indexOf(a);
      if (i < 0) return;
      const j = i + dir;
      if (j < 0 || j >= anns.length) return;
      anns.splice(i, 1);
      anns.splice(j, 0, a);
      this.commitHistory();
      this.renderLayers();
      this.render();
      this.saveSoon();
    },

    toggleHidden: function (a) {
      a.hidden = !a.hidden;
      this.commitHistory();
      this.renderLayers();
      this.render();
      this.saveSoon();
    },

    clearAnnotations: function () {
      const p = this.state.project;
      if (!p) return;
      if (!p.annotations.length && !(p.annotations2 && p.annotations2.length)) return;
      p.annotations = [];
      if (p.image2) p.annotations2 = [];
      this.state.selectedIds = [];
      this.state.selectedIds2 = [];
      this.commitHistory();
      this.renderLayers();
      this.render();
      this.saveSoon();
      this.setSelection([]);
    },

    /* ---------- history ---------- */
    snapshot: function () {
      const p = this.state.project;
      if (!p) {
        return {
          annotations: [], annotations2: [], numberSeed: 1, img: null, img2: null,
          pos2: null, op2: 1, selected: [], selected2: [], activePane: 1
        };
      }
      return {
        annotations: SSA.util.clone(p.annotations),
        annotations2: SSA.util.clone(p.annotations2 || []),
        numberSeed: p.numberSeed,
        img: p.image ? { src: p.image.src, w: p.image.w, h: p.image.h } : null,
        img2: p.image2 ? { src: p.image2.src, w: p.image2.w, h: p.image2.h } : null,
        pos2: p.image2 && p.image2Pos ? { x: p.image2Pos.x, y: p.image2Pos.y } : null,
        op2: typeof p.image2Opacity === "number" ? p.image2Opacity : 1,
        selected: this.state.selectedIds.slice(),
        selected2: this.state.selectedIds2.slice(),
        activePane: this.state.activePane
      };
    },
    commitHistory: function () {
      SSA.History.push(this.snapshot());
      this.updateHistoryButtons();
    },
    restore: function (snap) {
      const self = this;
      const p = this.state.project;
      if (!p) return;
      p.annotations = SSA.util.clone(snap.annotations);
      p.annotations2 = SSA.util.clone(snap.annotations2 || []);
      p.numberSeed = snap.numberSeed || 1;
      if (snap.pos2) p.image2Pos = { x: snap.pos2.x, y: snap.pos2.y };
      if (typeof snap.op2 === "number") p.image2Opacity = snap.op2;
      this.state.selectedIds = (snap.selected || []).slice();
      this.state.selectedIds2 = (snap.selected2 || []).slice();
      if (snap.img && (!p.image || p.image.src !== snap.img.src)) {
        p.image = { src: snap.img.src, w: snap.img.w, h: snap.img.h };
        const img = new Image();
        img.onload = function () {
          self.render();
        };
        img.src = p.image.src;
        p.imageEl = img;
      }
      if (snap.img2 && (!p.image2 || p.image2.src !== snap.img2.src)) {
        p.image2 = { src: snap.img2.src, w: snap.img2.w, h: snap.img2.h };
        const img2 = new Image();
        img2.onload = function () {
          self.render();
        };
        img2.src = p.image2.src;
        p.imageEl2 = img2;
      }
      if (!snap.img2 && p.image2) {
        p.image2 = null;
        p.imageEl2 = null;
        p.annotations2 = [];
        if (this.state.activePane === 2) this.state.activePane = 1;
      }
      this.updatePaneSwitch();
      this.updateEmpty();
      this.renderLayers();
      this.renderPanel();
      this.render();
    },
    undo: function () {
      const s = SSA.History.undo();
      if (s) {
        this.restore(s);
        this.updateHistoryButtons();
        this.saveSoon();
      }
    },
    redo: function () {
      const s = SSA.History.redo();
      if (s) {
        this.restore(s);
        this.updateHistoryButtons();
        this.saveSoon();
      }
    },
    updateHistoryButtons: function () {
      this.el.undoBtn.disabled = !SSA.History.canUndo();
      this.el.redoBtn.disabled = !SSA.History.canRedo();
    },

    /* ---------- render ---------- */
    render: function () {
      const p = this.state.project;
      const v = this.view();
      SSA.Render.renderScene(this.ctx, this.canvas, p, v, this.dpr, { overlay: false });
      this.drawPreview();
      if (p) {
        SSA.Render.drawOverlay(this.ctx, p.annotations, v, this.state.selectedIds, this.dpr);
        if (p.image2) {
          SSA.Render.drawOverlay(this.ctx, p.annotations2 || [], this.viewForPane(2), this.state.selectedIds2, this.dpr);
        }
        SSA.Render.drawPaneLabels(this.ctx, p, v, this.dpr);
      }
      this.updateStatus();
      this.updateEmpty();
    },

    drawPreview: function () {
      const pv = this.state.preview;
      const p = this.state.project;
      if (!pv || !p) return;
      const v = this.view();
      const ctx = this.ctx;
      ctx.save();
      ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
      ctx.translate(v.ox, v.oy);
      ctx.scale(v.scale, v.scale);
      if (this.state.previewPane === 2 && p.image2) {
        const o = this.paneOrigin(2);
        ctx.translate(o.x, o.y);
      }
      if (pv.type === "croprect") {
        ctx.fillStyle = "rgba(79,140,255,0.14)";
        ctx.fillRect(pv.x, pv.y, pv.w, pv.h);
        ctx.strokeStyle = "#4f8cff";
        ctx.lineWidth = 1.5 / v.scale;
        ctx.setLineDash([8 / v.scale, 6 / v.scale]);
        ctx.strokeRect(pv.x, pv.y, pv.w, pv.h);
        ctx.setLineDash([]);
      } else {
        let vv = v;
        if (this.state.previewPane === 2 && p.image2) {
          vv = this.viewForPane(2);
        }
        SSA.Render.drawAnn(ctx, pv, { canvas: this.canvas, view: vv, dpr: this.dpr });
      }
      ctx.restore();
    },

    updateStatus: function () {
      const p = this.state.project;
      const v = this.view();
      if (p && p.image) {
        let dims = p.image.w + " × " + p.image.h + " px";
        if (p.image2) dims += "  ·  2: " + p.image2.w + " × " + p.image2.h + " px";
        this.el.statusDims.textContent = dims;
      } else {
        this.el.statusDims.textContent = "Görsel yok";
      }
      this.el.statusZoom.textContent = "Zoom " + Math.round(v.scale * 100) + "%";
      this.el.zoomLabel.textContent = Math.round(v.scale * 100) + "%";
      const ip = this.state.pointer.image;
      this.el.statusPos.textContent = Math.round(ip.x) + ", " + Math.round(ip.y);
      const n = this.state.selectedIds.length;
      this.el.statusSel.textContent = n ? n + " öğe seçili" : "";
    },

    updateEmpty: function () {
      const p = this.state.project;
      const empty = !(p && p.image);
      this.el.stageEmpty.hidden = !empty;
    },

    /* ---------- layers panel ---------- */
    renderLayers: function () {
      const self = this;
      const p = this.state.project;
      this.updatePaneSwitch();
      const list = this.el.layerList;
      const anns = this.activeAnns();
      list.innerHTML = "";
      if (!p || !anns.length) {
        list.innerHTML = '<div class="layer-empty">Henüz işaretleme yok</div>';
        return;
      }
      for (let i = anns.length - 1; i >= 0; i--) {
        (function (a) {
          const row = document.createElement("div");
          row.className = "layer";
          if (self.activeIds().indexOf(a.id) >= 0) row.className += " is-sel";
          if (a.hidden) row.className += " is-hidden";
          row.innerHTML =
            '<span class="layer-ic">' + svg(TYPE_ICON[a.type] || "rect", 16) + "</span>" +
            '<span class="layer-name">' + layerLabel(a) + "</span>" +
            '<span class="layer-actions">' +
            '<button data-act="hide" title="Göster/Gizle">' + svg(a.hidden ? "eyeOff" : "eye", 14) + "</button>" +
            '<button data-act="up" title="Öne getir">' + svg("up", 14) + "</button>" +
            '<button data-act="down" title="Arkaya gönder">' + svg("down", 14) + "</button>" +
            '<button data-act="del" title="Sil">' + svg("trash", 14) + "</button>" +
            "</span>";

          row.addEventListener("click", function (e) {
            const b = e.target.closest("button");
            if (b) {
              const act = b.dataset.act;
              if (act === "hide") self.toggleHidden(a);
              else if (act === "up") self.moveLayer(a, 1);
              else if (act === "down") self.moveLayer(a, -1);
              else if (act === "del") {
                const arr = self.activeAnns();
                const kept = arr.filter(function (x) {
                  return x !== a;
                });
                if (self.state.activePane === 2) p.annotations2 = kept;
                else p.annotations = kept;
                self.setSelection(
                  self.activeIds().filter(function (id) {
                    return id !== a.id;
                  })
                );
                self.commitHistory();
                self.render();
                self.saveSoon();
              }
              return;
            }
            if (e.shiftKey) self.toggleSelect(a.id);
            else self.setSelection([a.id]);
            self.render();
          });

          list.appendChild(row);
        })(anns[i]);
      }
    },

    /* ---------- properties ---------- */
    buildSwatches: function () {
      const self = this;
      const wrap = this.el.swatches;
      wrap.innerHTML = "";
      SWATCHES.forEach(function (col) {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "swatch";
        b.style.background = col;
        b.title = col;
        b.addEventListener("click", function () {
          self.el.colorInput.value = col;
          self.setProp("color", col);
          self.commitHistory();
        });
        wrap.appendChild(b);
      });
    },

    buildShortcuts: function () {
      const el = this.el.shortcutList;
      const items = [
        ["V", "Seç"],
        ["C", "Kırp"],
        ["A", "Ok"],
        ["L", "Çizgi"],
        ["P", "Kalem"],
        ["S", "Üstü çiz"],
        ["R", "Dikdörtgen"],
        ["E", "Elips"],
        ["H", "Vurgu"],
        ["B", "Blur"],
        ["T", "Metin"],
        ["K", "Etiket"],
        ["X", "Çarpı"],
        ["Y", "Tik"],
        ["G", "Pin"],
        ["N", "Numara"],
        ["Dbl", "Metin düzenle"],
        ["Space", "Kaydır"],
        ["Del", "Sil"],
        ["⌘Z", "Geri"],
        ["Ctrl+S", "PNG"]
      ];
      el.innerHTML = items
        .map(function (it) {
          return '<div class="tip"><kbd>' + it[0] + "</kbd><span>" + it[1] + "</span></div>";
        })
        .join("");
    },

    syncProps: function () {
      this._syncing = true;
      const sel = this.selectedAnns();
      const a = sel.length === 1 ? sel[0] : null;
      const s = this.state;
      const color = a ? a.color : s.color;
      this.el.colorInput.value = color;
      this.el.widthRange.value = a ? a.width : s.width;
      this.el.widthVal.textContent = a ? a.width : s.width;
      const op = a ? (a.opacity == null ? 1 : a.opacity) : s.opacity;
      this.el.opacityRange.value = op;
      this.el.opacityVal.textContent = Math.round(op * 100) + "%";
      const fs = a && a.fontSize ? a.fontSize : s.fontSize;
      this.el.fontRange.value = fs;
      this.el.fontVal.textContent = fs;
      const mode = a && a.type === "blur" ? a.mode : s.blurMode;
      const segBtns = this.el.blurMode.querySelectorAll("button");
      for (let i = 0; i < segBtns.length; i++) {
        segBtns[i].classList.toggle("is-active", segBtns[i].dataset.mode === mode);
      }
      const bs = a && a.type === "blur" ? a.strength : s.blurStrength;
      this.el.blurRange.value = bs;
      this.el.blurVal.textContent = bs;
      const seed = this.state.project ? this.state.project.numberSeed || 1 : 1;
      this.el.numberSeed.value = seed;
      this.el.autoSelect.checked = !!s.autoSelect;
      const op2 =
        this.state.project && typeof this.state.project.image2Opacity === "number"
          ? this.state.project.image2Opacity
          : 1;
      this.el.img2Opacity.value = op2;
      this.el.img2OpacityVal.textContent = Math.round(op2 * 100) + "%";
      this.el.img2MoveBtn.classList.toggle("is-active", !!s.moveImage2);
      this._syncing = false;
    },

    setProp: function (key, value) {
      if (this._syncing) return;
      this.state[key] = value;
      const sel = this.selectedAnns();
      for (let i = 0; i < sel.length; i++) {
        const a = sel[i];
        if (key === "color") a.color = value;
        else if (key === "width") a.width = value;
        else if (key === "opacity") a.opacity = value;
        else if (key === "fontSize" && (a.type === "text" || a.type === "label")) a.fontSize = value;
        else if (key === "blurMode" && a.type === "blur") a.mode = value;
        else if (key === "blurStrength" && a.type === "blur") a.strength = value;
      }
      this.savePrefs();
      this.render();
      if (sel.length && (key === "color" || key === "width" || key === "fontSize" || key === "blurMode" || key === "blurStrength")) {
        this.renderLayers();
      }
    },

    bindProps: function () {
      const self = this;
      const bind = function (input, key, fmt, parser) {
        input.addEventListener("input", function () {
          const v = parser ? parser(input.value) : input.value;
          if (fmt) fmt(v);
          self.setProp(key, v);
        });
        input.addEventListener("change", function () {
          self.commitHistory();
          self.saveSoon();
        });
      };

      bind(this.el.colorInput, "color");
      bind(this.el.widthRange, "width", function (v) {
        self.el.widthVal.textContent = v;
      }, function (v) {
        return parseInt(v, 10);
      });
      bind(this.el.opacityRange, "opacity", function (v) {
        self.el.opacityVal.textContent = Math.round(v * 100) + "%";
      }, function (v) {
        return parseFloat(v);
      });
      bind(this.el.fontRange, "fontSize", function (v) {
        self.el.fontVal.textContent = v;
      }, function (v) {
        return parseInt(v, 10);
      });
      bind(this.el.blurRange, "blurStrength", function (v) {
        self.el.blurVal.textContent = v;
      }, function (v) {
        return parseInt(v, 10);
      });

      const segBtns = this.el.blurMode.querySelectorAll("button");
      for (let i = 0; i < segBtns.length; i++) {
        segBtns[i].addEventListener("click", function () {
          const mode = this.dataset.mode;
          self.setProp("blurMode", mode);
          self.syncProps();
          self.commitHistory();
        });
      }

      this.el.numberSeed.addEventListener("input", function () {
        self.state.project.numberSeed = Math.max(1, parseInt(this.value, 10) || 1);
        self.saveSoon();
      });
      this.el.numberReset.addEventListener("click", function () {
        self.state.project.numberSeed = 1;
        self.syncProps();
        self.saveSoon();
        self.toast("Numara sayacı 1'e sıfırlandı");
      });

      this.el.deleteSelected.addEventListener("click", function () {
        self.deleteSelected();
      });

      this.el.autoSelect.addEventListener("change", function () {
        self.state.autoSelect = this.checked;
        self.savePrefs();
      });

      this.el.img2MoveBtn.addEventListener("click", function () {
        self.state.moveImage2 = !self.state.moveImage2;
        if (!self.state.moveImage2) SSA.Tools.setCursor("");
        self.syncProps();
        self.toast(self.state.moveImage2 ? "2. görseli taşımak için üzerinde sürükleyin" : "Taşıma kapatıldı");
      });
      const setPos2 = function (mode) {
        const p = self.state.project;
        if (!p || !p.image2) return;
        p.image2Pos = mode === "overlay" ? { x: 0, y: 0 } : { x: p.image.w + SSA.PANE_GAP, y: 0 };
        self.commitHistory();
        self.fitView();
        self.render();
        self.saveSoon();
      };
      this.el.img2SideBtn.addEventListener("click", function () {
        setPos2("side");
      });
      this.el.img2OverlayBtn.addEventListener("click", function () {
        setPos2("overlay");
      });
      this.el.img2Opacity.addEventListener("input", function () {
        const p = self.state.project;
        if (!p) return;
        p.image2Opacity = parseFloat(this.value);
        self.el.img2OpacityVal.textContent = Math.round(p.image2Opacity * 100) + "%";
        self.render();
      });
      this.el.img2Opacity.addEventListener("change", function () {
        self.commitHistory();
        self.saveSoon();
      });
    },

    renderPanel: function () {
      this.syncProps();
      this.updatePropVisibility();
    },

    /* ---------- topbar ---------- */
    bindTopbar: function () {
      const self = this;
      this.el.openBtn.addEventListener("click", function () {
        self.el.fileInput.click();
      });
      this.el.emptyOpen.addEventListener("click", function () {
        self.el.fileInput.click();
      });
      this.el.fileInput.addEventListener("change", function () {
        const f = this.files && this.files[0];
        if (f) self.openImageFromBlob(f, f.name, self.state.activePane);
        this.value = "";
      });
      this.el.fileInput2.addEventListener("change", function () {
        const f = this.files && this.files[0];
        if (f) self.openImageFromBlob(f, f.name, 2);
        this.value = "";
      });
      this.el.compareBtn.addEventListener("click", function () {
        self.el.fileInput2.click();
      });
      this.el.jsonInput.addEventListener("change", function () {
        const f = this.files && this.files[0];
        if (f) self.importJSONFile(f);
        this.value = "";
      });

      const doPaste = function () {
        if (navigator.clipboard && navigator.clipboard.read) {
          navigator.clipboard
            .read()
            .then(function (items) {
              for (let i = 0; i < items.length; i++) {
                const types = items[i].types;
                for (let j = 0; j < types.length; j++) {
                  if (types[j].indexOf("image") === 0) {
                    return items[i].getType(types[j]).then(function (blob) {
                      self.openImageFromBlob(blob, null, self.state.activePane);
                    });
                  }
                }
              }
              self.toast("Panoda görsel bulunamadı", "error");
            })
            .catch(function () {
              self.toast("Panoya erişilemedi. Ctrl+V kullanın.", "error");
            });
        } else {
          self.toast("Ctrl+V ile yapıştırın", "error");
        }
      };
      this.el.pasteBtn.addEventListener("click", doPaste);
      this.el.emptyPaste.addEventListener("click", doPaste);
      this.el.captureBtn.addEventListener("click", function () {
        self.captureScreen();
      });
      this.el.emptyCapture.addEventListener("click", function () {
        self.captureScreen();
      });

      this.el.undoBtn.addEventListener("click", function () {
        self.undo();
      });
      this.el.redoBtn.addEventListener("click", function () {
        self.redo();
      });
      this.el.exportBtn.addEventListener("click", function () {
        self.exportPNG();
      });
      this.el.copyBtn.addEventListener("click", function () {
        self.copyPNG();
      });

      this.el.projectName.addEventListener("input", function () {
        if (self.state.project) {
          self.state.project.name = this.value || "Proje";
          self.saveSoon();
        }
      });
      this.el.projectName.addEventListener("change", function () {
        self.renderProjects();
      });

      this.el.projectsBtn.addEventListener("click", function (e) {
        e.stopPropagation();
        self.renderProjects();
        self.el.projectsPop.hidden = !self.el.projectsPop.hidden;
      });
      this.el.projectsClose.addEventListener("click", function () {
        self.el.projectsPop.hidden = true;
      });
      this.el.newProjectBtn.addEventListener("click", function () {
        self.newProject();
        self.el.projectsPop.hidden = true;
      });

      this.el.moreBtn.addEventListener("click", function (e) {
        e.stopPropagation();
        self.el.moreMenu.hidden = !self.el.moreMenu.hidden;
      });
      this.el.moreMenu.addEventListener("click", function (e) {
        const b = e.target.closest("button");
        if (!b) return;
        const act = b.dataset.action;
        self.el.moreMenu.hidden = true;
        if (act === "export-json") self.exportJSON();
        else if (act === "import-json") self.el.jsonInput.click();
        else if (act === "second-image") self.el.fileInput2.click();
        else if (act === "remove-image2") self.removeSecondImage();
        else if (act === "clear-ann") {
          if (self.state.project.annotations.length && window.confirm("Tüm işaretlemeler silinsin mi?")) {
            self.clearAnnotations();
          }
        } else if (act === "fit") self.fitView();
        else if (act === "actual") self.setZoom(1);
        else if (act === "crop-reset") self.fitView();
      });

      const paneBtns = this.el.paneSwitch.querySelectorAll("button");
      for (let i = 0; i < paneBtns.length; i++) {
        paneBtns[i].addEventListener("click", function () {
          self.setActivePane(parseInt(this.dataset.pane, 10));
        });
      }

      document.addEventListener("click", function (e) {
        if (!self.el.moreMenu.hidden && !e.target.closest(".menu-wrap")) self.el.moreMenu.hidden = true;
        if (!self.el.projectsPop.hidden && !e.target.closest("#projectsPop") && !e.target.closest("#projectsBtn")) {
          self.el.projectsPop.hidden = true;
        }
      });

      const zoomBtns = document.querySelectorAll(".zoom-btn");
      for (let i = 0; i < zoomBtns.length; i++) {
        zoomBtns[i].addEventListener("click", function () {
          const z = this.dataset.zoom;
          if (z === "in") self.setZoom(self.view().scale * 1.2);
          else if (z === "out") self.setZoom(self.view().scale / 1.2);
          else self.fitView();
        });
      }
    },

    /* ---------- projects ---------- */
    renderProjects: function () {
      const self = this;
      const list = SSA.Store.list();
      const box = this.el.projectsList;
      box.innerHTML = "";
      if (!list.length) {
        box.innerHTML = '<div class="popover-empty">Kayıtlı proje yok</div>';
        return;
      }
      list
        .slice()
        .sort(function (a, b) {
          return (b.updatedAt || 0) - (a.updatedAt || 0);
        })
        .forEach(function (m) {
          const item = document.createElement("div");
          item.className = "project-item";
          if (self.state.project && self.state.project.id === m.id) item.className += " is-active";
          const thumb = m.thumb
            ? '<img class="project-thumb" src="' + m.thumb + '" alt="" />'
            : '<div class="project-thumb blank">' + svg("rect", 18) + "</div>";
          item.innerHTML =
            thumb +
            '<div class="project-meta"><strong></strong><span>' +
            (m.w ? m.w + "×" + m.h + " · " : "") +
            SSA.util.fmtDate(m.updatedAt) +
            "</span></div>" +
            '<button class="project-del" title="Sil">' + svg("trash", 15) + "</button>";
          item.querySelector("strong").textContent = m.name || "İsimsiz";
          item.addEventListener("click", function (e) {
            if (e.target.closest(".project-del")) return;
            self.loadProject(m.id);
            self.el.projectsPop.hidden = true;
          });
          item.querySelector(".project-del").addEventListener("click", function (e) {
            e.stopPropagation();
            if (window.confirm('"' + (m.name || "Proje") + '" silinsin mi?')) {
              SSA.Store.remove(m.id);
              if (self.state.project && self.state.project.id === m.id) self.newProject();
              self.renderProjects();
              self.toast("Proje silindi");
            }
          });
          box.appendChild(item);
        });
    },

    /* ---------- project lifecycle ---------- */
    newProject: function () {
      this.state.project = {
        id: SSA.util.uid(),
        name: "UAT - " + new Date().toLocaleDateString("tr-TR"),
        image: null,
        imageEl: null,
        annotations: [],
        image2: null,
        imageEl2: null,
        annotations2: [],
        image2Pos: null,
        image2Opacity: 1,
        view: { scale: 1, ox: 0, oy: 0 },
        numberSeed: 1,
        updatedAt: Date.now()
      };
      this.state.selectedIds = [];
      this.state.selectedIds2 = [];
      this.state.activePane = 1;
      this.state.preview = null;
      this.state.previewPane = 1;
      this.el.projectName.value = this.state.project.name;
      SSA.History.reset(this.snapshot());
      this.updateHistoryButtons();
      this.updatePaneSwitch();
      this.setSelection([]);
      this.renderLayers();
      this.render();
      this.setSaveStatus("Yeni proje");
    },

    loadProject: function (id, preData) {
      const self = this;
      if (preData) {
        this._loadProjectData(preData);
      } else {
        SSA.Store.getProject(id)
          .then(function (data) {
            self._loadProjectData(data);
          })
          .catch(function () {
            self.toast("Proje yüklenemedi", "error");
          });
      }
    },
    _loadProjectData: function (data) {
      const self = this;
      if (!data || !data.image) {
        this.toast("Proje yüklenemedi", "error");
        return;
      }
      const proj = {
        id: data.id,
        name: data.name || "Proje",
        image: { src: data.image.src, w: data.image.w, h: data.image.h },
        imageEl: new Image(),
        annotations: data.annotations || [],
        image2: data.image2 ? { src: data.image2.src, w: data.image2.w, h: data.image2.h } : null,
        imageEl2: data.image2 ? new Image() : null,
        annotations2: data.annotations2 || [],
        image2Pos: data.image2 ? data.image2Pos || { x: data.image.w + SSA.PANE_GAP, y: 0 } : null,
        image2Opacity: typeof data.image2Opacity === "number" ? data.image2Opacity : 1,
        view: { scale: 1, ox: 0, oy: 0 },
        numberSeed: data.numberSeed || 1,
        updatedAt: data.updatedAt || Date.now()
      };
      proj.imageEl.onload = function () {
        self.fitView();
        self.render();
      };
      proj.imageEl.src = proj.image.src;
      if (proj.image2) {
        proj.imageEl2.onload = function () {
          self.fitView();
          self.render();
        };
        proj.imageEl2.src = proj.image2.src;
      }

      this.state.project = proj;
      this.state.selectedIds = [];
      this.state.selectedIds2 = [];
      this.state.activePane = 1;
      this.state.preview = null;
      this.state.previewPane = 1;
      this.el.projectName.value = proj.name;
      SSA.Store.setActive(proj.id);
      SSA.History.reset(this.snapshot());
      this.updateHistoryButtons();
      this.updatePaneSwitch();
      this.updatePropVisibility();
      this.syncProps();
      this.setSelection([]);
      this.renderLayers();
      this.render();
      this.setSaveStatus("Yüklendi · " + SSA.util.fmtDate(proj.updatedAt));
    },

    openImageFromBlob: function (blob, name, pane) {
      const self = this;
      const url = URL.createObjectURL(blob);
      const img = new Image();
      img.onload = function () {
        const usePng = img.naturalWidth * img.naturalHeight < 4000000;
        const src = SSA.imageToDataURL(img, 3600, usePng);
        if (!self.state.project) self.newProject();
        const proj = self.state.project;
        if (pane !== 2) pane = 1;
        if (pane === 2) {
          proj.image2 = { src: src, w: img.naturalWidth, h: img.naturalHeight };
          proj.annotations2 = [];
        } else {
          proj.image = { src: src, w: img.naturalWidth, h: img.naturalHeight };
          proj.annotations = [];
          if (!proj.image2) proj.numberSeed = 1;
        }
        if (name) {
          const base = name.replace(/\.[a-z0-9]+$/i, "");
          if (/^UAT - /.test(proj.name) || !proj.name) proj.name = base;
          self.el.projectName.value = proj.name;
        }
        const copy = new Image();
        copy.onload = function () {
          if (pane === 2) {
            proj.image2.w = copy.naturalWidth;
            proj.image2.h = copy.naturalHeight;
            proj.imageEl2 = copy;
            proj.image2Pos = { x: (proj.image ? proj.image.w : 0) + SSA.PANE_GAP, y: 0 };
            if (typeof proj.image2Opacity !== "number") proj.image2Opacity = 1;
            self.state.selectedIds2 = [];
            self.state.activePane = 2;
          } else {
            proj.image.w = copy.naturalWidth;
            proj.image.h = copy.naturalHeight;
            proj.imageEl = copy;
            self.state.selectedIds = [];
            if (!proj.image2) self.state.activePane = 1;
          }
          self.state.preview = null;
          self.state.previewPane = self.state.activePane;
          SSA.History.reset(self.snapshot());
          self.updateHistoryButtons();
          self.updatePaneSwitch();
          self.updatePropVisibility();
          self.syncProps();
          self.updateEmpty();
          self.fitView();
          self.renderLayers();
          self.render();
          self.saveSoon();
          self.toast(
            "Görsel yüklendi · " +
              (pane === 2 ? proj.image2.w + "×" + proj.image2.h : proj.image.w + "×" + proj.image.h),
            "ok"
          );
        };
        copy.onerror = function () {
          self.toast("Görsel işlenemedi", "error");
        };
        copy.src = src;
        URL.revokeObjectURL(url);
      };
      img.onerror = function () {
        URL.revokeObjectURL(url);
        self.toast("Görsel açılamadı", "error");
      };
      img.src = url;
    },

    removeSecondImage: function () {
      const p = this.state.project;
      if (!p || !p.image2) return;
      p.image2 = null;
      p.imageEl2 = null;
      p.annotations2 = [];
      p.image2Pos = null;
      this.state.selectedIds2 = [];
      this.state.moveImage2 = false;
      if (this.state.activePane === 2) this.state.activePane = 1;
      this.updatePaneSwitch();
      this.updatePropVisibility();
      this.syncProps();
      this.commitHistory();
      this.fitView();
      this.renderLayers();
      this.render();
      this.saveSoon();
      this.toast("İkinci görsel kaldırıldı");
    },

    captureScreen: function () {
      const self = this;
      if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
        this.toast("Bu tarayıcı/ortam ekran görüntüsünü desteklemiyor. Dosya veya panodan yükleyin.", "error");
        return;
      }
      this.toast("Yakalanacak ekranı / pencereyi / sekmeyi seçin...");
      navigator.mediaDevices
        .getDisplayMedia({ video: { frameRate: 5 }, audio: false })
        .then(function (stream) {
          const video = document.createElement("video");
          video.muted = true;
          video.playsInline = true;
          video.srcObject = stream;
          let done = false;
          const cleanup = function () {
            try {
              stream.getTracks().forEach(function (t) {
                t.stop();
              });
            } catch (e) {
              /* ignore */
            }
          };
          const grab = function () {
            if (done) return;
            done = true;
            const vw = video.videoWidth;
            const vh = video.videoHeight;
            if (!vw || !vh) {
              cleanup();
              self.toast("Görüntü alınamadı", "error");
              return;
            }
            const c = document.createElement("canvas");
            c.width = vw;
            c.height = vh;
            c.getContext("2d").drawImage(video, 0, 0, vw, vh);
            cleanup();
            c.toBlob(function (blob) {
              if (blob) self.openImageFromBlob(blob, "ekran-goruntusu.png", self.state.activePane);
              else self.toast("Görüntü işlenemedi", "error");
            }, "image/png");
          };
          video.onloadedmetadata = function () {
            video
              .play()
              .then(function () {
                if (video.requestVideoFrameCallback) {
                  video.requestVideoFrameCallback(function () {
                    grab();
                  });
                } else {
                  setTimeout(grab, 250);
                }
              })
              .catch(function () {
                cleanup();
                self.toast("Görüntü başlatılamadı", "error");
              });
          };
          const track = stream.getVideoTracks()[0];
          if (track) {
            track.addEventListener("ended", function () {
              cleanup();
            });
          }
        })
        .catch(function (err) {
          if (err && err.name === "NotAllowedError") {
            self.toast("Ekran paylaşımı iptal edildi");
          } else {
            self.toast("Ekran görüntüsü alınamadı: " + (err && err.message ? err.message : ""), "error");
          }
        });
    },

    applyCrop: function (rect, pane) {
      const self = this;
      const p = this.state.project;
      if (!p || !p.image || !p.imageEl) return;
      const usePane2 = pane === 2 && p.image2 && p.imageEl2;
      const target = usePane2 ? p.image2 : p.image;
      const targetEl = usePane2 ? p.imageEl2 : p.imageEl;
      const annArr = usePane2 ? p.annotations2 || [] : p.annotations;
      const x = clamp(Math.round(rect.x), 0, target.w - 1);
      const y = clamp(Math.round(rect.y), 0, target.h - 1);
      const w = Math.min(Math.round(rect.w), target.w - x);
      const h = Math.min(Math.round(rect.h), target.h - y);
      if (w < 6 || h < 6) return;

      const c = document.createElement("canvas");
      c.width = w;
      c.height = h;
      c.getContext("2d").drawImage(targetEl, x, y, w, h, 0, 0, w, h);
      const src = c.toDataURL("image/png");
      const img = new Image();
      img.onload = function () {
        if (usePane2) {
          p.image2 = { src: src, w: w, h: h };
          p.imageEl2 = img;
        } else {
          p.image = { src: src, w: w, h: h };
          p.imageEl = img;
        }
        self.commitHistory();
        self.fitView();
        self.renderLayers();
        self.render();
        self.saveSoon();
        self.toast("Görsel kırpıldı · " + w + "×" + h);
      };
      img.src = src;

      for (let i = 0; i < annArr.length; i++) {
        SSA.geom.translate(annArr[i], -x, -y);
      }
    },

    /* ---------- export ---------- */
    exportPNG: function () {
      const p = this.state.project;
      if (!p || !p.image) {
        this.toast("Önce bir görsel açın", "error");
        return;
      }
      SSA.Export.downloadPNG(p, p.name);
      this.toast("PNG indiriliyor");
    },
    copyPNG: function () {
      const self = this;
      const p = this.state.project;
      if (!p || !p.image) {
        this.toast("Önce bir görsel açın", "error");
        return;
      }
      SSA.Export.copyPNG(p)
        .then(function () {
          self.toast("Panoya kopyalandı", "ok");
        })
        .catch(function () {
          self.toast("Kopyalanamadı, PNG indiriliyor");
          SSA.Export.downloadPNG(p, p.name);
        });
    },
    exportJSON: function () {
      const p = this.state.project;
      if (!p || !p.image) {
        this.toast("Önce bir görsel açın", "error");
        return;
      }
      SSA.Export.downloadJSON(p);
      this.toast("JSON indiriliyor");
    },
    importJSONFile: function (file) {
      const self = this;
      SSA.Export.readJSON(file)
        .then(function (data) {
          const proj = {
            id: SSA.util.uid(),
            name: data.name || "İçe aktarılan",
            image: { src: data.image.src, w: data.image.w, h: data.image.h },
            imageEl: new Image(),
            annotations: data.annotations || [],
            image2: data.image2 ? { src: data.image2.src, w: data.image2.w, h: data.image2.h } : null,
            imageEl2: data.image2 ? new Image() : null,
            annotations2: data.annotations2 || [],
            image2Pos: data.image2 ? data.image2Pos || { x: data.image.w + SSA.PANE_GAP, y: 0 } : null,
            image2Opacity: typeof data.image2Opacity === "number" ? data.image2Opacity : 1,
            view: { scale: 1, ox: 0, oy: 0 },
            numberSeed: data.numberSeed || 1,
            updatedAt: Date.now()
          };
          proj.imageEl.onload = function () {
            self.fitView();
            self.render();
          };
          proj.imageEl.src = proj.image.src;
          if (proj.image2) {
            proj.imageEl2.onload = function () {
              self.fitView();
              self.render();
            };
            proj.imageEl2.src = proj.image2.src;
          }
          self.state.project = proj;
          self.state.selectedIds = [];
          self.state.selectedIds2 = [];
          self.state.activePane = 1;
          self.el.projectName.value = proj.name;
          SSA.History.reset(self.snapshot());
          self.updateHistoryButtons();
          self.updatePaneSwitch();
          self.updatePropVisibility();
          self.syncProps();
          self.updateEmpty();
          self.renderLayers();
          self.render();
          self.saveSoon();
          self.toast("JSON içe aktarıldı", "ok");
        })
        .catch(function () {
          self.toast("JSON okunamadı", "error");
        });
    },

    /* ---------- save ---------- */
    save: function () {
      const p = this.state.project;
      if (!p || !p.image || !p.imageEl) return;
      p.updatedAt = Date.now();
      const thumb = SSA.makeThumb(p);
      const beforeSrc = p.image.src;
      SSA.compressProject(p);
      if (p.image.src !== beforeSrc) {
        SSA.History.stack[SSA.History.index] = this.snapshot();
      }
      if (p.image && p.image.src) {
        const self = this;
        SSA.Store.saveProject(p)
          .then(function (ok) {
            if (!ok) {
              self.setSaveStatus("Kaydedilemedi");
              self.toast("Kaydedilemedi! Eski projeleri silin veya JSON olarak yedekleyin.", "error");
              self.renderProjects();
              return;
            }
            SSA.Store.upsertMeta({
              id: p.id,
              name: p.name,
              updatedAt: p.updatedAt,
              thumb: thumb,
              w: p.image.w,
              h: p.image.h
            });
            SSA.Store.setActive(p.id);
            self.setSaveStatus("Kaydedildi · " + timeOnly(p.updatedAt));
            self.renderProjects();
          })
          .catch(function () {
            self.setSaveStatus("Kaydedilemedi");
          });
      }
    },
    saveSoon: function () {
      if (!this._saveSoon) {
        this._saveSoon = SSA.util.debounce(this.save.bind(this), 700);
      }
      this._savePending = true;
      this._saveSoon();
    },
    flushSave: function () {
      if (this._savePending) {
        this._savePending = false;
        this.save();
      }
    },
    setSaveStatus: function (txt) {
      this.el.saveStatus.textContent = txt;
    },

    /* ---------- keyboard ---------- */
    bindKeyboard: function () {
      const self = this;
      document.addEventListener("keydown", function (e) {
        const editable = SSA.util.isEditable(e.target);
        if (e.key === " " && !editable) {
          e.preventDefault();
          self.state.spaceDown = true;
          SSA.Tools.setCursor("cursor-pan");
          return;
        }
        if (editable) {
          if (e.key === "Escape" && e.target.blur) e.target.blur();
          return;
        }
        if (e.ctrlKey || e.metaKey) {
          const k = e.key.toLowerCase();
          if (k === "z") {
            e.preventDefault();
            if (e.shiftKey) self.redo();
            else self.undo();
            return;
          }
          if (k === "y") {
            e.preventDefault();
            self.redo();
            return;
          }
          if (k === "s") {
            e.preventDefault();
            self.exportPNG();
            return;
          }
          if (k === "a") {
            e.preventDefault();
            if (self.state.project) {
              self.setSelection(
                self.activeAnns().map(function (a) {
                  return a.id;
                })
              );
              self.render();
            }
            return;
          }
          if (k === "0") {
            e.preventDefault();
            self.fitView();
            return;
          }
          return;
        }
        if (e.key === "Delete" || e.key === "Backspace") {
          e.preventDefault();
          self.deleteSelected();
          return;
        }
        if (e.key === "Escape") {
          self.state.preview = null;
          self.setSelection([]);
          self.setTool("select");
          self.render();
          return;
        }
        if (e.key === "[") {
          self.state.width = clamp(self.state.width - 1, 1, 28);
          self.el.widthRange.value = self.state.width;
          self.el.widthVal.textContent = self.state.width;
          self.setProp("width", self.state.width);
          return;
        }
        if (e.key === "]") {
          self.state.width = clamp(self.state.width + 1, 1, 28);
          self.el.widthRange.value = self.state.width;
          self.el.widthVal.textContent = self.state.width;
          self.setProp("width", self.state.width);
          return;
        }
        if (e.key.toLowerCase() === "m" && self.state.project && self.state.project.image2) {
          self.state.moveImage2 = !self.state.moveImage2;
          if (!self.state.moveImage2) SSA.Tools.setCursor("");
          self.syncProps();
          return;
        }
        const tool = TOOL_KEYS[e.key.toLowerCase()];
        if (tool) self.setTool(tool);
      });

      document.addEventListener("keyup", function (e) {
        if (e.key === " ") {
          self.state.spaceDown = false;
          SSA.Tools.setCursor("");
        }
      });

      document.addEventListener("paste", function (e) {
        const items = e.clipboardData && e.clipboardData.items;
        if (!items) return;
        for (let i = 0; i < items.length; i++) {
          if (items[i].type && items[i].type.indexOf("image") === 0) {
            const blob = items[i].getAsFile();
            if (blob) {
              e.preventDefault();
              self.openImageFromBlob(blob);
              return;
            }
          }
        }
      });
    },

    /* ---------- drag & drop / wheel ---------- */
    bindDnD: function () {
      const self = this;
      const stage = this.stage;
      const show = function (e) {
        e.preventDefault();
        self.el.dropHint.classList.add("is-active");
      };
      const hide = function () {
        self.el.dropHint.classList.remove("is-active");
      };
      stage.addEventListener("dragenter", show);
      stage.addEventListener("dragover", show);
      stage.addEventListener("dragleave", function (e) {
        if (!stage.contains(e.relatedTarget)) hide();
      });
      stage.addEventListener("drop", function (e) {
        e.preventDefault();
        hide();
        const f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
        if (!f) return;
        if (f.type.indexOf("image") === 0) self.openImageFromBlob(f, f.name, self.state.activePane);
        else if (/json/i.test(f.type) || /\.json$/i.test(f.name)) self.importJSONFile(f);
        else self.toast("Desteklenmeyen dosya", "error");
      });
      window.addEventListener("dragover", function (e) {
        e.preventDefault();
      });
      window.addEventListener("drop", function (e) {
        e.preventDefault();
      });

      stage.addEventListener(
        "wheel",
        function (e) {
          if (!self.state.project || !self.state.project.image) return;
          e.preventDefault();
          const rect = stage.getBoundingClientRect();
          const anchor = { x: e.clientX - rect.left, y: e.clientY - rect.top };
          const factor = e.deltaY < 0 ? 1.12 : 1 / 1.12;
          self.setZoom(self.view().scale * factor, anchor);
        },
        { passive: false }
      );
    },

    /* ---------- modal ---------- */
    getBg: function () {
      const active = this.el.textBg.querySelector("button.is-active");
      return active ? active.dataset.bg : "none";
    },
    setBgSeg: function (bg) {
      const btns = this.el.textBg.querySelectorAll("button");
      for (let i = 0; i < btns.length; i++) {
        btns[i].classList.toggle("is-active", btns[i].dataset.bg === bg);
      }
    },
    applyTextPreview: function () {
      const ctx = this._textCtx;
      const fs = parseInt(this.el.textFontRange.value, 10) || 18;
      this.el.textFontVal.textContent = fs;
      if (!ctx || ctx.mode !== "edit" || !ctx.ann) return;
      ctx.ann.text = this.el.textModalInput.value;
      ctx.ann.fontSize = fs;
      ctx.ann.bg = this.getBg();
      this.render();
    },
    bindModal: function () {
      const self = this;
      const build = function () {
        return {
          text: self.el.textModalInput.value.trim(),
          fontSize: parseInt(self.el.textFontRange.value, 10) || 18,
          bg: self.getBg()
        };
      };
      const close = function (cancelled) {
        self.el.textModal.hidden = true;
        const r = self._textResolve;
        self._textResolve = null;
        self._textCtx = null;
        if (r) r(cancelled ? null : build());
      };
      this.el.textModalOk.addEventListener("click", function () {
        const res = build();
        close(!res.text);
      });
      this.el.textModalCancel.addEventListener("click", function () {
        close(true);
      });
      this.el.textModalClose.addEventListener("click", function () {
        close(true);
      });
      this.el.textModal.addEventListener("click", function (e) {
        if (e.target === self.el.textModal) close(true);
      });
      this.el.textModalInput.addEventListener("input", function () {
        self.applyTextPreview();
      });
      this.el.textFontRange.addEventListener("input", function () {
        self.applyTextPreview();
      });
      const bgBtns = this.el.textBg.querySelectorAll("button");
      for (let i = 0; i < bgBtns.length; i++) {
        bgBtns[i].addEventListener("click", function () {
          self.setBgSeg(this.dataset.bg);
          self.applyTextPreview();
        });
      }
      this.el.textModalInput.addEventListener("keydown", function (e) {
        if (e.key === "Enter" && (e.ctrlKey || e.metaKey || !e.shiftKey)) {
          e.preventDefault();
          const res = build();
          close(!res.text);
        } else if (e.key === "Escape") {
          e.preventDefault();
          close(true);
        }
      });
    },

    promptText: function (title, opts) {
      const self = this;
      const o = opts || {};
      return new Promise(function (resolve) {
        self._textResolve = resolve;
        self._textCtx = o.context || null;
        self.el.textModalTitle.textContent = title || "Metin";
        self.el.textModalInput.value = o.text || "";
        const fs = o.fontSize || self.state.fontSize || 18;
        self.el.textFontRange.value = fs;
        self.el.textFontVal.textContent = fs;
        self.setBgSeg(o.bg || (o.type === "label" ? "color" : "none"));
        self.el.textModalOk.textContent = o.context && o.context.mode === "edit" ? "Kaydet" : "Ekle";
        self.el.textModal.hidden = false;
        setTimeout(function () {
          self.el.textModalInput.focus();
          self.el.textModalInput.select();
        }, 20);
      });
    },

    editTextAnn: function (a) {
      const self = this;
      const before = SSA.util.clone(a);
      this.promptText(a.type === "label" ? "Etiketi düzenle" : "Metni düzenle", {
        type: a.type,
        text: a.text || "",
        fontSize: a.fontSize || 18,
        bg: a.bg || (a.type === "label" ? "color" : "none"),
        context: { mode: "edit", ann: a }
      }).then(function (res) {
        if (!res) {
          Object.assign(a, before);
          self.render();
          return;
        }
        a.text = res.text;
        a.fontSize = res.fontSize;
        a.bg = res.bg;
        self.commitHistory();
        self.renderLayers();
        self.render();
        self.saveSoon();
      });
    },

    /* ---------- toast ---------- */
    toast: function (msg, type) {
      const t = this.el.toast;
      t.textContent = msg;
      t.className = "toast is-show" + (type ? " is-" + type : "");
      clearTimeout(this._toastTimer);
      this._toastTimer = setTimeout(function () {
        t.className = "toast";
      }, 2600);
    }
  };

  function layerLabel(a) {
    switch (a.type) {
      case "arrow":
        return "Ok";
      case "line":
        return "Çizgi";
      case "freehand":
        return "Serbest çizim";
      case "strike":
        return "Üstü çizili";
      case "rect":
        return "Dikdörtgen";
      case "ellipse":
        return "Elips";
      case "highlight":
        return "Vurgu";
      case "text":
        return "Metin: " + (a.text || "").slice(0, 18);
      case "label":
        return "Etiket: " + (a.text || "").slice(0, 16);
      case "pin":
        return "Pin";
      case "cross":
        return "Çarpı";
      case "tick":
        return "Tik";
      case "number":
        return "Numara " + a.n;
      case "blur":
        return a.mode === "mosaic" ? "Mozaik" : "Bulanık";
      default:
        return a.type;
    }
  }

  function timeOnly(ts) {
    try {
      return new Date(ts).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
    } catch (e) {
      return "";
    }
  }

  SSA.App = App;
})();
