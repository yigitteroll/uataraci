(function () {
  "use strict";

  const SSA = (window.SSA = window.SSA || {});

  const DRAG_TOOLS = {
    arrow: 1,
    line: 1,
    measure: 1,
    freehand: 1,
    strike: 1,
    rect: 1,
    ellipse: 1,
    highlight: 1,
    blur: 1
  };
  const BBOX_TOOLS = { rect: 1, ellipse: 1, highlight: 1, blur: 1 };
  const CLICK_TOOLS = { pin: 1, number: 1, text: 1, label: 1, cross: 1, tick: 1 };

  let canvas = null;

  const session = {
    mode: "idle",
    startImg: null,
    startScreen: null,
    startView: null,
    current: null,
    snapshots: null,
    handle: null,
    ann: null,
    cropRect: null,
    changed: false,
    pane: 1
  };

  function relPt(ev) {
    const r = canvas.getBoundingClientRect();
    return { x: ev.clientX - r.left, y: ev.clientY - r.top };
  }

  function reset() {
    session.mode = "idle";
    session.startImg = null;
    session.startScreen = null;
    session.startView = null;
    session.current = null;
    session.snapshots = null;
    session.handle = null;
    session.grabOff = null;
    session.ann = null;
    session.cropRect = null;
    session.changed = false;
    SSA.App.state.preview = null;
    SSA.App.state.previewPane = SSA.App.state.activePane;
  }

  function normalizeRect(x1, y1, x2, y2) {
    return {
      x: Math.min(x1, x2),
      y: Math.min(y1, y2),
      w: Math.abs(x2 - x1),
      h: Math.abs(y2 - y1)
    };
  }

  function rectsIntersect(a, b) {
    return !(a.x > b.x + b.w || b.x > a.x + a.w || a.y > b.y + b.h || b.y > a.y + a.h);
  }

  function startPan(sp) {
    const App = SSA.App;
    session.mode = "pan";
    session.startScreen = sp;
    session.startView = {
      scale: App.state.project.view.scale,
      ox: App.state.project.view.ox,
      oy: App.state.project.view.oy
    };
    session.changed = false;
    canvas.classList.add("cursor-pan");
  }

  function paneAt(world) {
    return SSA.App.paneAt(world);
  }

  function toLocal(worldPt, pane) {
    return SSA.App.toLocal(worldPt, pane);
  }

  function viewForPane(pane) {
    return SSA.App.viewForPane(pane);
  }

  function onDown(ev) {
    if (ev.button !== 0 && ev.button !== 1) return;
    if (ev.detail && ev.detail > 1) return;
    const App = SSA.App;
    if (!App || !App.state.project || !App.state.project.image) return;

    const sp = relPt(ev);
    const world = App.screenToImage(sp.x, sp.y);
    const pane = paneAt(world);
    if (App.state.activePane !== pane) App.setActivePane(pane);
    session.pane = pane;
    const ip = toLocal(world, pane);
    const tool = App.state.tool;

    if (ev.button === 1 || App.state.spaceDown || tool === "pan") {
      startPan(sp);
      ev.preventDefault();
      return;
    }

    if (App.state.moveImage2 && App.state.project.image2) {
      const o = App.paneOrigin(2);
      const im2 = App.state.project.image2;
      if (world.x >= o.x && world.x <= o.x + im2.w && world.y >= o.y && world.y <= o.y + im2.h) {
        session.mode = "moveImage";
        session.startWorld = world;
        session.startPos = { x: o.x, y: o.y };
        session.changed = false;
        canvas.classList.add("cursor-pan");
        ev.preventDefault();
        return;
      }
    }

    if (tool === "select") {
      const sel = App.selectedAnns();
      if (sel.length === 1) {
        const h = SSA.geom.handleAt(sel[0], sp, viewForPane(pane), 9);
        if (h) {
          session.mode = "resize";
          session.ann = sel[0];
          session.handle = h;
          // Tutamaç ile imleç arasındaki farkı koru: ilk harekette zıplama olmasın
          const hp = SSA.geom.handlePoint(sel[0], h);
          session.grabOff = { x: hp.x - ip.x, y: hp.y - ip.y };
          session.changed = false;
          session.snapshots = [{ ann: sel[0], snap: SSA.util.clone(sel[0]), id: sel[0].id }];
          ev.preventDefault();
          return;
        }
      }

      let hit = null;
      const tol = 6 / App.state.project.view.scale;
      const anns = App.activeAnns();
      for (let i = anns.length - 1; i >= 0; i--) {
        const a = anns[i];
        if (SSA.geom.hit(a, ip, tol)) {
          hit = a;
          break;
        }
      }

      if (hit) {
        if (ev.shiftKey) {
          App.toggleSelect(hit.id);
        } else if (App.activeIds().indexOf(hit.id) < 0) {
          App.setSelection([hit.id]);
        }
        const sel2 = App.selectedAnns();
        session.mode = "move";
        session.startImg = ip;
        session.changed = false;
        session.snapshots = sel2.map(function (a) {
          return { ann: a, snap: SSA.util.clone(a), id: a.id };
        });
      } else {
        // Boş alanda sürükleme = kutu ile çoklu seçim (Shift: seçime ekle).
        // Görünümü kaydırmak için: Space+sürükle, orta tuş veya Kaydır aracı.
        session.mode = "marquee";
        session.startImg = ip;
        session.pane = pane;
        session.marqueeAdd = ev.shiftKey;
        if (!ev.shiftKey) App.setSelection([]);
        App.state.preview = { type: "marquee", x: ip.x, y: ip.y, w: 0, h: 0 };
        App.state.previewPane = pane;
        canvas.style.cursor = "crosshair";
        App.render();
        ev.preventDefault();
        return;
      }
      App.render();
      ev.preventDefault();
      return;
    }

    if (tool === "crop") {
      session.mode = "crop";
      session.startImg = ip;
      session.cropRect = { x: ip.x, y: ip.y, w: 0, h: 0 };
      App.state.preview = { type: "croprect", x: ip.x, y: ip.y, w: 0, h: 0 };
      App.state.previewPane = pane;
      ev.preventDefault();
      return;
    }

    if (CLICK_TOOLS[tool]) {
      session.mode = "place";
      session.startImg = ip;
      return;
    }

    if (DRAG_TOOLS[tool]) {
      session.mode = "draw";
      session.startImg = ip;
      session.current = SSA.makeAnn(tool, ip, App.state);
      App.state.preview = session.current;
      App.state.previewPane = pane;
      ev.preventDefault();
      return;
    }
  }

  function onMove(ev) {
    const App = SSA.App;
    if (!App || !App.state.project) return;
    const sp = relPt(ev);
    const world = App.screenToImage(sp.x, sp.y);

    if (session.mode === "idle") {
      const hp = paneAt(world);
      App.setPointer(sp, toLocal(world, hp));
      updateHoverCursor(sp, world);
      return;
    }

    const pane = session.pane || App.state.activePane;
    const ip = toLocal(world, pane);
    App.setPointer(sp, ip);

    if (session.mode === "pan") {
      const dx = sp.x - session.startScreen.x;
      const dy = sp.y - session.startScreen.y;
      const v = App.state.project.view;
      v.ox = session.startView.ox + dx;
      v.oy = session.startView.oy + dy;
      App.render();
      return;
    }

    if (session.mode === "moveImage") {
      const dx = world.x - session.startWorld.x;
      const dy = world.y - session.startWorld.y;
      if (Math.abs(dx) > 0.5 || Math.abs(dy) > 0.5) session.changed = true;
      App.state.project.image2Pos = { x: session.startPos.x + dx, y: session.startPos.y + dy };
      App.render();
      return;
    }

    if (session.mode === "marquee") {
      const r = normalizeRect(session.startImg.x, session.startImg.y, ip.x, ip.y);
      App.state.preview = { type: "marquee", x: r.x, y: r.y, w: r.w, h: r.h };
      App.render();
      return;
    }

    if (session.mode === "draw" && session.current) {
      const a = session.current;
      if (a.type === "freehand" || a.type === "strike") {
        a.points.push([ip.x, ip.y]);
      } else if (a.type === "arrow" || a.type === "line" || a.type === "measure") {
        a.x2 = ip.x;
        a.y2 = ip.y;
      } else if (BBOX_TOOLS[a.type]) {
        const r = normalizeRect(session.startImg.x, session.startImg.y, ip.x, ip.y);
        a.x = r.x;
        a.y = r.y;
        a.w = r.w;
        a.h = r.h;
      }
      App.render();
      return;
    }

    if (session.mode === "move" && session.snapshots) {
      const dx = ip.x - session.startImg.x;
      const dy = ip.y - session.startImg.y;
      if (Math.abs(dx) > 0.5 || Math.abs(dy) > 0.5) session.changed = true;
      for (let i = 0; i < session.snapshots.length; i++) {
        const item = session.snapshots[i];
        const c = SSA.util.clone(item.snap);
        SSA.geom.translate(c, dx, dy);
        Object.assign(item.ann, c);
      }
      App.render();
      return;
    }

    if (session.mode === "resize" && session.ann) {
      const item = session.snapshots[0];
      Object.assign(session.ann, SSA.util.clone(item.snap));
      const off = session.grabOff || { x: 0, y: 0 };
      SSA.geom.resize(session.ann, session.handle, { x: ip.x + off.x, y: ip.y + off.y });
      session.changed = true;
      App.render();
      return;
    }

    if (session.mode === "crop") {
      const r = normalizeRect(session.startImg.x, session.startImg.y, ip.x, ip.y);
      session.cropRect = r;
      App.state.preview = { type: "croprect", x: r.x, y: r.y, w: r.w, h: r.h };
      App.state.previewPane = pane;
      App.render();
      return;
    }
  }

  // Yeni öğe her zaman seçili gelir (renk/kalınlık hemen ona uygulanır).
  // Araç varsayılan olarak aktif kalır; ayar açıksa Seç aracına geçilir.
  function afterAdd(added) {
    const App = SSA.App;
    if (!added) return;
    if (App.state.autoSelect) App.setTool("select");
    App.setSelection([added.id]);
  }

  function hitAt(pane, ip) {
    const App = SSA.App;
    const anns = App.paneAnns(pane);
    const tol = 6 / viewForPane(pane).scale;
    for (let i = anns.length - 1; i >= 0; i--) {
      if (anns[i].hidden) continue;
      if (SSA.geom.hit(anns[i], ip, tol)) return anns[i];
    }
    return null;
  }

  function onUp(ev) {
    const App = SSA.App;
    if (!App) return;

    if (session.mode === "pan") {
      canvas.classList.remove("cursor-pan");
      reset();
      if (App.state.tool === "pan") setCursor("cursor-pan");
      return;
    }

    if (session.mode === "moveImage") {
      canvas.classList.remove("cursor-pan");
      if (session.changed) {
        App.commitHistory();
        App.saveSoon();
      }
      reset();
      if (App.state.moveImage2) setCursor("cursor-pan");
      App.render();
      return;
    }

    if (session.mode === "marquee") {
      const pane = session.pane || App.state.activePane;
      const pv = App.state.preview;
      const r = pv && pv.type === "marquee" ? { x: pv.x, y: pv.y, w: pv.w, h: pv.h } : null;
      const add = session.marqueeAdd;
      reset();
      canvas.style.cursor = "";
      if (r) {
        const anns = App.paneAnns(pane);
        const hits = [];
        for (let i = 0; i < anns.length; i++) {
          if (anns[i].hidden) continue;
          if (rectsIntersect(r, SSA.geom.bbox(anns[i]))) hits.push(anns[i].id);
        }
        App.setActivePane(pane);
        const ids = add ? App.paneIds(pane).slice() : [];
        for (let i = 0; i < hits.length; i++) {
          if (ids.indexOf(hits[i]) < 0) ids.push(hits[i]);
        }
        App.setSelection(ids);
      }
      App.render();
      return;
    }

    if (session.mode === "draw" && session.current) {
      const a = session.current;
      let ok = true;
      if (a.type === "freehand" || a.type === "strike") {
        ok = a.points.length > 1;
      } else if (a.type === "arrow" || a.type === "line" || a.type === "measure") {
        ok = Math.hypot(a.x2 - a.x1, a.y2 - a.y1) > 4;
      } else if (BBOX_TOOLS[a.type]) {
        ok = a.w > 4 && a.h > 4;
      }
      const startPt = session.startImg;
      const pane = session.pane || App.state.activePane;
      if (ok) {
        afterAdd(App.addAnnotation(a));
      } else if (startPt) {
        // Çizim yerine tıklandıysa: altındaki öğeyi seç (taşımak için Seç aracına geçer)
        const hit = hitAt(pane, startPt);
        if (hit) {
          App.setTool("select");
          App.setSelection([hit.id]);
        }
      }
      reset();
      App.render();
      return;
    }

    if (session.mode === "move" || session.mode === "resize") {
      if (session.changed) {
        App.commitHistory();
        App.saveSoon();
      }
      reset();
      App.render();
      return;
    }

    if (session.mode === "crop") {
      const r = session.cropRect;
      const pane = session.pane || App.state.activePane;
      reset();
      if (r && r.w > 6 && r.h > 6) {
        App.applyCrop(r, pane);
      } else {
        App.render();
      }
      return;
    }

    if (session.mode === "place") {
      const ip = session.startImg;
      const tool = App.state.tool;
      reset();
      if (tool === "pin" || tool === "cross" || tool === "tick") {
        afterAdd(App.addAnnotation(SSA.makeAnn(tool, ip, App.state)));
      } else if (tool === "number") {
        App.addAnnotation(SSA.makeAnn("number", ip, App.state));
        App.state.project.numberSeed = (App.state.project.numberSeed || 1) + 1;
        App.renderPanel();
        App.saveSoon();
      } else if (tool === "text" || tool === "label") {
        App.promptText(tool === "text" ? "Metin gir" : "Etiket metni", {
          type: tool,
          text: "",
          fontSize: App.state.fontSize,
          bg: tool === "label" ? "color" : "none"
        }).then(function (res) {
          if (!res || !res.text) return;
          const a = SSA.makeAnn(tool, ip, App.state);
          a.text = res.text;
          a.fontSize = res.fontSize;
          a.bg = res.bg;
          afterAdd(App.addAnnotation(a));
        });
      }
      App.render();
      return;
    }

    reset();
  }

  function onDblClick(ev) {
    const App = SSA.App;
    if (!App || !App.state.project || !App.state.project.image) return;
    const sp = relPt(ev);
    const world = App.screenToImage(sp.x, sp.y);
    const pane = paneAt(world);
    const ip = toLocal(world, pane);
    const tol = 8 / App.state.project.view.scale;
    const anns = App.paneAnns(pane);
    let hit = null;
    for (let i = anns.length - 1; i >= 0; i--) {
      const a = anns[i];
      if (a.hidden) continue;
      if (a.type !== "text" && a.type !== "label") continue;
      if (SSA.geom.hit(a, ip, tol)) {
        hit = a;
        break;
      }
    }
    if (!hit) return;
    ev.preventDefault();
    App.setActivePane(pane);
    App.setSelection([hit.id]);
    App.editTextAnn(hit);
  }

  function onContextMenu(ev) {
    ev.preventDefault();
    const App = SSA.App;
    if (!App || !App.state.project || !App.state.project.image) return;
    const sp = relPt(ev);
    const world = App.screenToImage(sp.x, sp.y);
    const pane = paneAt(world);
    if (App.state.activePane !== pane) App.setActivePane(pane);
    const ip = toLocal(world, pane);
    const hit = hitAt(pane, ip);
    const items = [];
    if (hit) {
      App.setSelection([hit.id]);
      App.render();
      items.push({ label: "Çoğalt", act: function () { App.duplicateAnn(hit); } });
      items.push({ label: "Seçili alanı PNG indir", act: function () { App.exportSelection(); } });
      if (hit.type === "text" || hit.type === "label") {
        items.push({ label: "Metni düzenle", act: function () { App.editTextAnn(hit); } });
      }
      items.push({ label: "Öne getir", act: function () { App.moveLayer(hit, 1); } });
      items.push({ label: "Arkaya gönder", act: function () { App.moveLayer(hit, -1); } });
      items.push({ sep: true });
      items.push({ label: "Sil", danger: true, act: function () { App.deleteAnn(hit); } });
    } else {
      items.push({ label: "Panodan Yapıştır", act: function () { App.pasteFromClipboard(); } });
      items.push({ label: "Görsele sığdır", act: function () { App.fitView(); } });
      items.push({ label: "%100 boyut", act: function () { App.setZoom(1); } });
      if (App.state.project.image2) {
        items.push({ sep: true });
        items.push({ label: "2. görseli kaldır", act: function () { App.removeSecondImage(); } });
      }
    }
    App.openContextMenu(ev.clientX, ev.clientY, items);
  }

  function updateHoverCursor(sp, world) {
    const App = SSA.App;
    const tool = App.state.tool;
    if (App.state.spaceDown || tool === "pan") {
      setCursor("cursor-pan");
      App.setHover(null);
      return;
    }
    if (App.state.moveImage2 && App.state.project.image2) {
      const o = App.paneOrigin(2);
      const im2 = App.state.project.image2;
      const inside =
        world.x >= o.x && world.x <= o.x + im2.w && world.y >= o.y && world.y <= o.y + im2.h;
      setCursor(inside ? "cursor-pan" : "");
      App.setHover(null);
      return;
    }
    const pane = paneAt(world);
    const ip = toLocal(world, pane);
    const view = viewForPane(pane);
    const anns = App.paneAnns(pane);
    const tol = 6 / view.scale;
    let hit = null;
    for (let i = anns.length - 1; i >= 0; i--) {
      if (anns[i].hidden) continue;
      if (SSA.geom.hit(anns[i], ip, tol)) {
        hit = anns[i];
        break;
      }
    }
    App.setHover(hit ? { id: hit.id, pane: pane } : null);
    if (tool === "select") {
      const ids = App.paneIds(pane);
      if (ids.length === 1) {
        const a = anns.filter(function (x) {
          return x.id === ids[0];
        })[0];
        if (a) {
          const h = SSA.geom.handleAt(a, sp, view, 9);
          if (h) {
            canvas.style.cursor = SSA.geom.handleCursor(h);
            canvas.className = "";
            return;
          }
        }
      }
      setCursor(hit ? "cursor-move" : "cursor-default");
    } else {
      setCursor("");
    }
  }

  function setCursor(cls) {
    canvas.className = cls || "";
    canvas.style.cursor = "";
  }

  SSA.Tools = {
    bind: function (cv) {
      canvas = cv;
      cv.addEventListener("pointerdown", onDown);
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
      window.addEventListener("pointercancel", function () {
        reset();
        if (SSA.App) SSA.App.render();
      });
      cv.addEventListener("dblclick", onDblClick);
      cv.addEventListener("contextmenu", onContextMenu);
      cv.addEventListener("mouseleave", function () {
        if (SSA.App && SSA.App.setHover) SSA.App.setHover(null);
      });
    },
    session: session,
    setCursor: setCursor
  };
})();

