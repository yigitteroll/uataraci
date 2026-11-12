(function () {
  "use strict";

  const SSA = (window.SSA = window.SSA || {});

  /* Tüm görünür öğeleri kapsayan tuvali çizer (v2: arka plan yok).
     Görseller arasındaki boşluklar beyaz doldurulur. */
  function renderFullSync(project) {
    if (!project) return null;
    const b = SSA.contentBBox(project);
    if (!b) return null;
    const minX = Math.floor(b.x);
    const minY = Math.floor(b.y);
    const W = Math.max(1, Math.ceil(b.x + b.w) - minX);
    const H = Math.max(1, Math.ceil(b.y + b.h) - minY);
    const c = document.createElement("canvas");
    c.width = W;
    c.height = H;
    const cx = c.getContext("2d");
    cx.fillStyle = "#ffffff";
    cx.fillRect(0, 0, W, H);
    const env = { canvas: c, view: { scale: 1, ox: -minX, oy: -minY }, dpr: 1 };
    cx.save();
    cx.translate(-minX, -minY);
    for (let i = 0; i < project.annotations.length; i++) {
      if (!project.annotations[i].hidden) SSA.Render.drawAnn(cx, project.annotations[i], env);
    }
    cx.restore();
    c._origin = { x: minX, y: minY };
    return c;
  }

  function renderFull(project, cb) {
    cb(renderFullSync(project));
  }

  function safeName(name) {
    return (name || "uat-gorsel").replace(/[\\/:*?"<>|]+/g, "-").trim() || "uat-gorsel";
  }

  function stamp() {
    const d = new Date();
    const p = function (n) {
      return String(n).padStart(2, "0");
    };
    return d.getFullYear() + p(d.getMonth() + 1) + p(d.getDate()) + "-" + p(d.getHours()) + p(d.getMinutes()) + p(d.getSeconds());
  }

  SSA.Export = {
    renderFull: renderFull,
    renderFullSync: renderFullSync,

    downloadPNG(project, name) {
      renderFull(project, function (c) {
        if (!c) return;
        c.toBlob(function (blob) {
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = safeName(name) + "-" + stamp() + ".png";
          document.body.appendChild(a);
          a.click();
          a.remove();
          setTimeout(function () {
            URL.revokeObjectURL(url);
          }, 3000);
        }, "image/png");
      });
    },

    downloadPNGRegion(project, rect, name) {
      renderFull(project, function (c) {
        if (!c) return;
        const o = c._origin || { x: 0, y: 0 };
        const minX = o.x;
        const minY = o.y;
        const pad = 20;
        let rx = Math.floor(rect.x - minX - pad);
        let ry = Math.floor(rect.y - minY - pad);
        let rw = Math.ceil(rect.w + pad * 2);
        let rh = Math.ceil(rect.h + pad * 2);
        rx = SSA.util.clamp(rx, 0, c.width - 1);
        ry = SSA.util.clamp(ry, 0, c.height - 1);
        rw = Math.min(rw, c.width - rx);
        rh = Math.min(rh, c.height - ry);
        if (rw < 1 || rh < 1) return;
        const out = document.createElement("canvas");
        out.width = rw;
        out.height = rh;
        out.getContext("2d").drawImage(c, rx, ry, rw, rh, 0, 0, rw, rh);
        out.toBlob(function (blob) {
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = safeName(name) + "-secim-" + stamp() + ".png";
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
        version: 2,
        name: project.name,
        assets: SSA.Assets.used(project),
        annotations: project.annotations,
        numberSeed: project.numberSeed
      };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = safeName(project.name) + "-" + stamp() + ".json";
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
            if (!data || (!(data.image && data.image.src) && !data.assets)) throw new Error("Geçersiz dosya");
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
