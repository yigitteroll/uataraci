(function () {
  "use strict";

  const SSA = (window.SSA = window.SSA || {});

  const DRAG_TOOLS = {
    arrow: 1,
    line: 1,
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
        if (!ev.shiftKey) App.setSelection([]);
        App.render();
        startPan(sp);
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

    if (session.mode === "draw" && session.current) {
      const a = session.current;
      if (a.type === "freehand" || a.type === "strike") {
        a.points.push([ip.x, ip.y]);
      } else if (a.type === "arrow" || a.type === "line") {
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
      SSA.geom.resize(session.ann, session.handle, ip);
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

    if (session.mode === "draw" && session.current) {
      const a = session.current;
      let ok = true;
      if (a.type === "freehand" || a.type === "strike") {
        ok = a.points.length > 1;
      } else if (a.type === "arrow" || a.type === "line") {
        ok = Math.hypot(a.x2 - a.x1, a.y2 - a.y1) > 4;
      } else if (BBOX_TOOLS[a.type]) {
        ok = a.w > 4 && a.h > 4;
      }
      if (ok) {
        const added = App.addAnnotation(a);
        if (App.state.autoSelect && added) {
          App.setTool("select");
          App.setSelection([added.id]);
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
        const added = App.addAnnotation(SSA.makeAnn(tool, ip, App.state));
        if (App.state.autoSelect && added) {
          App.setTool("select");
          App.setSelection([added.id]);
        }
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
          const added = App.addAnnotation(a);
          if (App.state.autoSelect && added) {
            App.setTool("select");
            App.setSelection([added.id]);
          }
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

  function updateHoverCursor(sp, world) {
    const App = SSA.App;
    const tool = App.state.tool;
    if (App.state.spaceDown || tool === "pan") {
      setCursor("cursor-pan");
      return;
    }
    if (App.state.moveImage2 && App.state.project.image2) {
      const o = App.paneOrigin(2);
      const im2 = App.state.project.image2;
      const inside =
        world.x >= o.x && world.x <= o.x + im2.w && world.y >= o.y && world.y <= o.y + im2.h;
      setCursor(inside ? "cursor-pan" : "");
      return;
    }
    if (tool !== "select") {
      setCursor("");
      return;
    }
    const pane = paneAt(world);
    const ip = toLocal(world, pane);
    const view = viewForPane(pane);
    const anns = App.paneAnns(pane);
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
    const tol = 6 / view.scale;
    let hit = false;
    for (let i = anns.length - 1; i >= 0; i--) {
      if (SSA.geom.hit(anns[i], ip, tol)) {
        hit = true;
        break;
      }
    }
    setCursor(hit ? "cursor-move" : "cursor-default");
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
      cv.addEventListener("contextmenu", function (e) {
        e.preventDefault();
      });
    },
    session: session,
    setCursor: setCursor
  };
})();

