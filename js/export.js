(function () {
  "use strict";

  const SSA = (window.SSA = window.SSA || {});

  function renderFull(project, cb) {
    if (!project || !project.image || !project.imageEl) {
      cb(null);
      return;
    }
    const gap = SSA.PANE_GAP || 24;
    const has2 = !!(project.image2 && project.imageEl2);
    const o2 = has2
      ? project.image2Pos || { x: project.image.w + gap, y: 0 }
      : { x: 0, y: 0 };
    const minX = has2 ? Math.min(0, o2.x) : 0;
    const minY = has2 ? Math.min(0, o2.y) : 0;
    const maxX = has2 ? Math.max(project.image.w, o2.x + project.image2.w) : project.image.w;
    const maxY = has2 ? Math.max(project.image.h, o2.y + project.image2.h) : project.image.h;
    const pad = has2 ? 0 : 0;
    const W = Math.max(1, Math.round(maxX - minX + pad * 2));
    const H = Math.max(1, Math.round(maxY - minY + pad * 2));
    const c = document.createElement("canvas");
    c.width = W;
    c.height = H;
    const cx = c.getContext("2d");
    cx.clearRect(0, 0, c.width, c.height);

    const dx1 = -minX + pad;
    const dy1 = -minY + pad;
    try {
      cx.drawImage(project.imageEl, dx1, dy1, project.image.w, project.image.h);
    } catch (e) {
      /* ignore */
    }
    const env = { canvas: c, view: { scale: 1, ox: dx1, oy: dy1 }, dpr: 1 };
    for (let i = 0; i < project.annotations.length; i++) {
      if (!project.annotations[i].hidden) SSA.Render.drawAnn(cx, project.annotations[i], env);
    }
    if (has2) {
      const dx2 = dx1 + o2.x;
      const dy2 = dy1 + o2.y;
      const a2 = project.image2Opacity == null ? 1 : project.image2Opacity;
      cx.save();
      cx.globalAlpha = a2;
      try {
        cx.drawImage(project.imageEl2, dx2, dy2, project.image2.w, project.image2.h);
      } catch (e) {
        /* ignore */
      }
      cx.restore();
      const env2 = { canvas: c, view: { scale: 1, ox: dx2, oy: dy2 }, dpr: 1 };
      cx.save();
      cx.translate(dx2, dy2);
      const anns2 = project.annotations2 || [];
      for (let i = 0; i < anns2.length; i++) {
        if (!anns2[i].hidden) SSA.Render.drawAnn(cx, anns2[i], env2);
      }
      cx.restore();
    }
    cb(c);
  }

  function safeName(name) {
    return (name || "uat-gorsel").replace(/[\\/:*?"<>|]+/g, "-").trim() || "uat-gorsel";
  }

  SSA.Export = {
    renderFull: renderFull,

    downloadPNG(project, name) {
      renderFull(project, function (c) {
        if (!c) return;
        c.toBlob(function (blob) {
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = safeName(name) + ".png";
          document.body.appendChild(a);
          a.click();
          a.remove();
          setTimeout(function () {
            URL.revokeObjectURL(url);
          }, 3000);
        }, "image/png");
      });
    },

    copyPNG(project) {
      return new Promise(function (resolve, reject) {
        if (!navigator.clipboard || !window.ClipboardItem) {
          reject(new Error("Pano API desteklenmiyor"));
          return;
        }
        renderFull(project, function (c) {
          if (!c) {
            reject(new Error("Görsel yok"));
            return;
          }
          c.toBlob(function (blob) {
            navigator.clipboard
              .write([new ClipboardItem({ "image/png": blob })])
              .then(resolve)
              .catch(reject);
          }, "image/png");
        });
      });
    },

    downloadJSON(project) {
      const data = {
        app: "uat-screenshot-annotator",
        version: 1,
        name: project.name,
        image: project.image,
        annotations: project.annotations,
        numberSeed: project.numberSeed
      };
      if (project.image2) {
        data.image2 = project.image2;
        data.annotations2 = project.annotations2 || [];
      }
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = safeName(project.name) + ".json";
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(function () {
        URL.revokeObjectURL(url);
      }, 3000);
    },

    readJSON(file) {
      return new Promise(function (resolve, reject) {
        const fr = new FileReader();
        fr.onload = function () {
          try {
            const data = JSON.parse(fr.result);
            if (!data || !data.image || !data.image.src) throw new Error("Geçersiz dosya");
            resolve(data);
          } catch (e) {
            reject(e);
          }
        };
        fr.onerror = reject;
        fr.readAsText(file);
      });
    }
  };
})();
