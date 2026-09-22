(function () {
  "use strict";

  const SSA = (window.SSA = window.SSA || {});

  let measureCtx = null;

  function roundRect(ctx, x, y, w, h, r) {
    const rr = Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2);
    ctx.beginPath();
    ctx.moveTo(x + rr, y);
    ctx.arcTo(x + w, y, x + w, y + h, rr);
    ctx.arcTo(x + w, y + h, x, y + h, rr);
    ctx.arcTo(x, y + h, x, y, rr);
    ctx.arcTo(x, y, x + w, y, rr);
    ctx.closePath();
  }

  function fontStr(size, weight) {
    return (weight || 400) + " " + size + "px Inter, system-ui, -apple-system, Segoe UI, sans-serif";
  }

  function measureText(text, fontSize, weight) {
    if (!measureCtx) {
      const c = document.createElement("canvas");
      measureCtx = c.getContext("2d");
    }
    measureCtx.font = fontStr(fontSize, weight);
    const w = measureCtx.measureText(text == null ? "" : text).width;
    return { w: w, h: fontSize * 1.3 };
  }

  /* temp canvases reused for blur/mosaic sampling */
  const tmpA = document.createElement("canvas");
  const tmpB = document.createElement("canvas");

  function fitCanvas(c, w, h) {
    const W = Math.max(1, Math.round(w));
    const H = Math.max(1, Math.round(h));
    if (c.width !== W || c.height !== H) {
      c.width = W;
      c.height = H;
    }
    return c;
  }

  function imageToScreen(x, y, view) {
    return { x: x * view.scale + view.ox, y: y * view.scale + view.oy };
  }

  /* Apply blur or mosaic to a region of the canvas (device pixel space). */
  function applyRegion(ctx, canvas, rect, mode, strength, view, dpr) {
    const scale = view.scale;
    const devX = (rect.x * scale + view.ox) * dpr;
    const devY = (rect.y * scale + view.oy) * dpr;
    const devW = rect.w * scale * dpr;
    const devH = rect.h * scale * dpr;
    if (devW < 1 || devH < 1) return;

    const strengthDev = Math.max(1, strength * scale * dpr);
    const mosaic = mode === "mosaic";
    const pad = mosaic ? 0 : Math.ceil(strengthDev * 2.5);

    let sx = Math.floor(devX - pad);
    let sy = Math.floor(devY - pad);
    let ex = Math.ceil(devX + devW + pad);
    let ey = Math.ceil(devY + devH + pad);
    sx = Math.max(0, sx);
    sy = Math.max(0, sy);
    ex = Math.min(canvas.width, ex);
    ey = Math.min(canvas.height, ey);

    const sw = ex - sx;
    const sh = ey - sy;
    if (sw < 1 || sh < 1) return;

    fitCanvas(tmpA, sw, sh);
    const ca = tmpA.getContext("2d");
    ca.setTransform(1, 0, 0, 1, 0, 0);
    ca.globalAlpha = 1;
    ca.filter = "none";
    ca.clearRect(0, 0, sw, sh);
    ca.drawImage(canvas, sx, sy, sw, sh, 0, 0, sw, sh);

    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1;
    ctx.beginPath();
    ctx.rect(devX, devY, devW, devH);
    ctx.clip();

    if (mosaic) {
      const cell = Math.max(2, strengthDev);
      const dw = Math.max(1, Math.round(sw / cell));
      const dh = Math.max(1, Math.round(sh / cell));
      fitCanvas(tmpB, dw, dh);
      const cb = tmpB.getContext("2d");
      cb.setTransform(1, 0, 0, 1, 0, 0);
      cb.clearRect(0, 0, dw, dh);
      cb.imageSmoothingEnabled = true;
      cb.drawImage(tmpA, 0, 0, sw, sh, 0, 0, dw, dh);
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(tmpB, 0, 0, dw, dh, sx, sy, sw, sh);
      ctx.imageSmoothingEnabled = true;
    } else {
      fitCanvas(tmpB, sw, sh);
      const cb = tmpB.getContext("2d");
      cb.setTransform(1, 0, 0, 1, 0, 0);
      cb.clearRect(0, 0, sw, sh);
      cb.filter = "blur(" + strengthDev.toFixed(2) + "px)";
      cb.drawImage(tmpA, 0, 0, sw, sh, 0, 0, sw, sh);
      cb.filter = "none";
      ctx.drawImage(tmpB, 0, 0, sw, sh, sx, sy, sw, sh);
    }

    ctx.restore();
  }

  function drawArrow(ctx, a) {
    const dx = a.x2 - a.x1;
    const dy = a.y2 - a.y1;
    const ang = Math.atan2(dy, dx);
    const head = Math.max(10, (a.width || 3) * 3.4);
    ctx.beginPath();
    ctx.moveTo(a.x1, a.y1);
    ctx.lineTo(a.x2, a.y2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(a.x2, a.y2);
    ctx.lineTo(a.x2 - head * Math.cos(ang - Math.PI / 7), a.y2 - head * Math.sin(ang - Math.PI / 7));
    ctx.lineTo(a.x2 - head * Math.cos(ang + Math.PI / 7), a.y2 - head * Math.sin(ang + Math.PI / 7));
    ctx.closePath();
    ctx.fill();
  }

  function drawPath(ctx, a) {
    const pts = a.points || [];
    if (!pts.length) return;
    if (pts.length === 1) {
      ctx.beginPath();
      ctx.arc(pts[0][0], pts[0][1], (a.width || 3) / 2, 0, Math.PI * 2);
      ctx.fill();
      return;
    }
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
    ctx.stroke();
  }

  function textMetrics(a) {
    const fs = a.fontSize || 18;
    const weight = a.type === "label" ? 600 : 400;
    const lines = String(a.text == null ? "" : a.text).split("\n");
    let tw = 0;
    for (let i = 0; i < lines.length; i++) {
      const w = measureText(lines[i], fs, weight).w;
      if (w > tw) tw = w;
    }
    const lineH = fs * 1.25;
    const bg = a.bg || (a.type === "label" ? "color" : "none");
    const padX = bg === "none" ? 0 : 9;
    const padY = bg === "none" ? 0 : 6;
    return {
      fs: fs,
      lines: lines,
      lineH: lineH,
      tw: tw,
      bg: bg,
      padX: padX,
      padY: padY,
      w: tw + padX * 2,
      h: lines.length * lineH + padY * 2
    };
  }

  function bgColors(bg, a) {
    if (bg === "color") return { fill: a.color, text: "#ffffff" };
    if (bg === "dark") return { fill: "rgba(12,14,19,0.78)", text: "#ffffff" };
    if (bg === "light") return { fill: "rgba(255,255,255,0.94)", text: "#151515" };
    return { fill: null, text: a.color };
  }

  function drawTextLike(ctx, a) {
    const m = textMetrics(a);
    const cols = bgColors(m.bg, a);
    if (m.bg === "none") {
      ctx.font = fontStr(m.fs, 400);
      ctx.textBaseline = "top";
      ctx.textAlign = "left";
      ctx.lineWidth = Math.max(2, m.fs * 0.16);
      ctx.strokeStyle = "rgba(0,0,0,0.62)";
      for (let i = 0; i < m.lines.length; i++) {
        ctx.strokeText(m.lines[i], a.x, a.y + i * m.lineH);
      }
      ctx.fillStyle = a.color;
      for (let i = 0; i < m.lines.length; i++) {
        ctx.fillText(m.lines[i], a.x, a.y + i * m.lineH);
      }
    } else {
      roundRect(ctx, a.x, a.y, m.w, m.h, Math.min(9, m.h / 2));
      ctx.fillStyle = cols.fill;
      ctx.fill();
      ctx.font = fontStr(m.fs, 600);
      ctx.textBaseline = "top";
      ctx.textAlign = "left";
      ctx.fillStyle = cols.text;
      for (let i = 0; i < m.lines.length; i++) {
        ctx.fillText(m.lines[i], a.x + m.padX, a.y + m.padY + i * m.lineH);
      }
    }
  }

  function drawCross(ctx, a) {
    const s = a.size || 30;
    const lw = a.width || 6;
    const x1 = a.x - s / 2;
    const y1 = a.y - s / 2;
    const x2 = a.x + s / 2;
    const y2 = a.y + s / 2;
    ctx.lineCap = "round";
    ctx.strokeStyle = "rgba(255,255,255,0.9)";
    ctx.lineWidth = lw + 4;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.moveTo(x2, y1);
    ctx.lineTo(x1, y2);
    ctx.stroke();
    ctx.strokeStyle = a.color;
    ctx.lineWidth = lw;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.moveTo(x2, y1);
    ctx.lineTo(x1, y2);
    ctx.stroke();
  }

  function drawTick(ctx, a) {
    const s = a.size || 30;
    const lw = a.width || 6;
    const p1 = { x: a.x - s * 0.34, y: a.y + s * 0.02 };
    const p2 = { x: a.x - s * 0.08, y: a.y + s * 0.28 };
    const p3 = { x: a.x + s * 0.38, y: a.y - s * 0.28 };
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "rgba(255,255,255,0.9)";
    ctx.lineWidth = lw + 4;
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.lineTo(p3.x, p3.y);
    ctx.stroke();
    ctx.strokeStyle = a.color;
    ctx.lineWidth = lw;
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.lineTo(p3.x, p3.y);
    ctx.stroke();
  }

  function drawPin(ctx, a) {
    const size = a.size || 32;
    const r = size * 0.28;
    const cy = a.y - size * 0.75;
    ctx.beginPath();
    ctx.moveTo(a.x - r * 0.72, cy + r * 0.62);
    ctx.lineTo(a.x, a.y);
    ctx.lineTo(a.x + r * 0.72, cy + r * 0.62);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.arc(a.x, cy, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(a.x, cy, r * 0.38, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawNumber(ctx, a) {
    const r = a.r || 13;
    ctx.beginPath();
    ctx.arc(a.x, a.y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.font = fontStr(Math.round(r * 1.12), 700);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(String(a.n), a.x, a.y + 0.5);
  }

  function drawAnn(ctx, a, env) {
    if (a.hidden) return;
    ctx.save();
    ctx.globalAlpha = a.opacity == null ? 1 : a.opacity;
    ctx.strokeStyle = a.color;
    ctx.fillStyle = a.color;
    ctx.lineWidth = a.width || 3;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    switch (a.type) {
      case "line":
        ctx.beginPath();
        ctx.moveTo(a.x1, a.y1);
        ctx.lineTo(a.x2, a.y2);
        ctx.stroke();
        break;
      case "arrow":
        drawArrow(ctx, a);
        break;
      case "freehand":
      case "strike":
        drawPath(ctx, a);
        break;
      case "rect":
        ctx.strokeRect(a.x, a.y, a.w, a.h);
        break;
      case "ellipse":
        ctx.beginPath();
        ctx.ellipse(a.x + a.w / 2, a.y + a.h / 2, Math.abs(a.w / 2), Math.abs(a.h / 2), 0, 0, Math.PI * 2);
        ctx.stroke();
        break;
      case "highlight":
        ctx.globalCompositeOperation = "multiply";
        ctx.globalAlpha = a.opacity == null ? 0.5 : a.opacity;
        ctx.fillRect(a.x, a.y, a.w, a.h);
        break;
      case "text":
      case "label":
        drawTextLike(ctx, a);
        break;
      case "cross":
        drawCross(ctx, a);
        break;
      case "tick":
        drawTick(ctx, a);
        break;
      case "pin":
        drawPin(ctx, a);
        break;
      case "number":
        drawNumber(ctx, a);
        break;
      case "blur":
        applyRegion(ctx, env.canvas, { x: a.x, y: a.y, w: a.w, h: a.h }, a.mode, a.strength || 12, env.view, env.dpr);
        break;
    }
    ctx.restore();
  }

  function drawOverlay(ctx, annotations, view, selectedIds, dpr) {
    if (!selectedIds || !selectedIds.length || !annotations) return;
    ctx.save();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    for (let i = 0; i < annotations.length; i++) {
      const a = annotations[i];
      if (selectedIds.indexOf(a.id) < 0 || a.hidden) continue;
      const b = SSA.geom.bbox(a);
      const p1 = imageToScreen(b.x, b.y, view);
      const p2 = imageToScreen(b.x + b.w, b.y + b.h, view);
      const x = Math.min(p1.x, p2.x) - 2;
      const y = Math.min(p1.y, p2.y) - 2;
      const w = Math.abs(p2.x - p1.x) + 4;
      const h = Math.abs(p2.y - p1.y) + 4;

      ctx.strokeStyle = "#4f8cff";
      ctx.lineWidth = 1.5;
      ctx.setLineDash([5, 4]);
      ctx.strokeRect(x, y, w, h);
      ctx.setLineDash([]);

      const hs = SSA.geom.handlesScreen(a, view);
      ctx.fillStyle = "#ffffff";
      ctx.strokeStyle = "#4f8cff";
      ctx.lineWidth = 1.5;
      for (const k in hs) {
        const pt = hs[k];
        ctx.beginPath();
        ctx.rect(pt.x - 4, pt.y - 4, 8, 8);
        ctx.fill();
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  function renderScene(ctx, canvas, project, view, dpr, opts) {
    const options = opts || {};
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
    if (options.background !== false) {
      ctx.fillStyle = "#0b0d11";
      ctx.fillRect(0, 0, canvas.width / dpr, canvas.height / dpr);
    }

    if (!project || !project.image || !project.imageEl) return;

    const o2 = project.image2
      ? project.image2Pos || { x: project.image.w + SSA.PANE_GAP, y: 0 }
      : { x: 0, y: 0 };
    const a2 = project.image2Opacity == null ? 1 : project.image2Opacity;
    ctx.save();
    ctx.translate(view.ox, view.oy);
    ctx.scale(view.scale, view.scale);
    ctx.imageSmoothingQuality = "high";
    try {
      ctx.drawImage(project.imageEl, 0, 0, project.image.w, project.image.h);
    } catch (e) {
      /* image not ready */
    }
    if (project.image2 && project.imageEl2) {
      ctx.save();
      ctx.globalAlpha = a2;
      try {
        ctx.drawImage(project.imageEl2, o2.x, o2.y, project.image2.w, project.image2.h);
      } catch (e) {
        /* image not ready */
      }
      ctx.restore();
    }
    const env = { canvas: canvas, view: view, dpr: dpr };
    const env2 = {
      canvas: canvas,
      view: { scale: view.scale, ox: view.ox + o2.x * view.scale, oy: view.oy + o2.y * view.scale },
      dpr: dpr
    };
    for (let i = 0; i < project.annotations.length; i++) {
      drawAnn(ctx, project.annotations[i], env);
    }
    if (project.image2 && project.annotations2) {
      ctx.save();
      ctx.translate(o2.x, o2.y);
      for (let i = 0; i < project.annotations2.length; i++) {
        drawAnn(ctx, project.annotations2[i], env2);
      }
      ctx.restore();
    }
    ctx.restore();
  }

  function drawPaneLabels(ctx, project, view, dpr) {
    if (!project || !project.image2 || !project.image) return;
    const o2 = project.image2Pos || { x: project.image.w + SSA.PANE_GAP, y: 0 };
    const chips = [
      { n: "1", wx: 0, wy: 0 },
      { n: "2", wx: o2.x, wy: o2.y }
    ];
    ctx.save();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    for (let i = 0; i < chips.length; i++) {
      const p = imageToScreen(chips[i].wx, chips[i].wy, view);
      const x = p.x + 10;
      const y = p.y + 10;
      roundRect(ctx, x, y, 26, 22, 7);
      ctx.fillStyle = "rgba(12,14,19,0.78)";
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.25)";
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.fillStyle = "#e8ecf4";
      ctx.font = fontStr(12, 600);
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(chips[i].n, x + 13, y + 12);
    }
    ctx.restore();
  }

  SSA.Render = {
    measureText: measureText,
    textMetrics: textMetrics,
    drawAnn: drawAnn,
    drawOverlay: drawOverlay,
    renderScene: renderScene,
    drawPaneLabels: drawPaneLabels,
    roundRect: roundRect,
    imageToScreen: imageToScreen,
    applyRegion: applyRegion
  };
})();
