const PROJ_MULTIPLIER = 1.0;

function uzat(i1, y1, i2, y2, df, n_ileri=30) {
    let egim = (y2 - y1) / Math.max(i2 - i1, 1);
    let i3 = Math.min(i2 + n_ileri, df.length - 1);
    let t3 = df[i3].ts;
    let y3 = y2 + egim * (i3 - i2);
    return { t3, y3, i3 };
}

function ara_deger(i1, y1, i2, y2, i_hedef) {
    let egim = (y2 - y1) / Math.max(i2 - i1, 1);
    return y1 + egim * (i_hedef - i1);
}

function doldur(t_list, y_ust, y_alt, renk) {
    let xs = t_list.concat([...t_list].reverse());
    let ys = y_ust.concat([...y_alt].reverse());
    return {
        x: xs, y: ys,
        fill: "toself", fillcolor: renk,
        line: {color: "rgba(0,0,0,0)"},
        showlegend: false, hoverinfo: "skip",
        type: 'scatter', mode: 'lines'
    };
}

function _line_shape(t1, y1, t2, y2, renk, genislik=1.8, dash="solid") {
    return {
        type: "line", x0: t1, y0: y1, x1: t2, y1: y2,
        line: {color: renk, width: genislik, dash: dash},
        xref: "x", yref: "y"
    };
}

function _ok_shape(t1, y1, t2, y2, renk="#FF6B00") {
    return {
        ax: t1, ay: y1, x: t2, y: y2,
        xref: "x", yref: "y", axref: "x", ayref: "y",
        showarrow: true, arrowhead: 3, arrowsize: 1.8,
        arrowwidth: 2.5, arrowcolor: renk
    };
}

// Helpers for reading points
function pHigh(df, idxs) { return idxs.map(i => ({i, t: df[i].ts, y: df[i].high})); }
function pLow(df, idxs) { return idxs.map(i => ({i, t: df[i].ts, y: df[i].low})); }

// -- 5A. RISING WEDGE (Bearish) --
function rising_wedge(df, ph_idx, pl_idx) {
    if (ph_idx.length < 3 || pl_idx.length < 3) return null;
    let hx = pHigh(df, ph_idx.slice(-3));
    let lx = pLow(df, pl_idx.slice(-3));
    
    let h_egim = (hx[2].y - hx[0].y) / Math.max(hx[2].i - hx[0].i, 1);
    let l_egim = (lx[2].y - lx[0].y) / Math.max(lx[2].i - lx[0].i, 1);
    
    if (!(h_egim > 0 && l_egim > 0 && l_egim > h_egim * 1.1)) return null;
    
    let u = uzat(hx[0].i, hx[0].y, hx[2].i, hx[2].y, df, 25);
    let a = uzat(lx[0].i, lx[0].y, lx[2].i, lx[2].y, df, 25);
    
    let yukseklik = hx[0].y - lx[0].y;
    let proj_bas_t = lx[2].t;
    let proj_bas_y = lx[2].y;
    let proj_son_i = Math.min(lx[2].i + 40, df.length - 1);
    let proj_son_t = df[proj_son_i].ts;
    let tp = proj_bas_y - yukseklik * PROJ_MULTIPLIER;
    
    let t_list = [], y_ust = [], y_alt = [];
    for (let c = hx[0].i; c <= Math.max(u.i3, a.i3); c++) {
        t_list.push(df[c].ts);
        y_ust.push(ara_deger(hx[0].i, hx[0].y, u.i3, u.y3, c));
        y_alt.push(ara_deger(lx[0].i, lx[0].y, a.i3, a.y3, c));
    }
    
    return {
        isim: "📐 Yükselen Kama (Bearish)", sinyal: "bearish",
        shapes: [
            _line_shape(hx[0].t, hx[0].y, u.t3, u.y3, "#FF6B00", 2),
            _line_shape(lx[0].t, lx[0].y, a.t3, a.y3, "#FF6B00", 2),
            _line_shape(proj_bas_t, proj_bas_y, proj_son_t, tp, "#FF3333", 1.2, "dot")
        ],
        fills: [doldur(t_list, y_ust, y_alt, "rgba(255,107,0,0.10)")],
        ok: _ok_shape(proj_bas_t, proj_bas_y * 1.002, proj_son_t, tp, "#FF6B00"),
        tp: tp, sl: hx[2].y,
        aciklama: `TP: $${tp.toFixed(5)}`
    };
}

// -- 5B. FALLING WEDGE (Bullish) --
function falling_wedge(df, ph_idx, pl_idx) {
    if (ph_idx.length < 3 || pl_idx.length < 3) return null;
    let hx = pHigh(df, ph_idx.slice(-3));
    let lx = pLow(df, pl_idx.slice(-3));
    
    let h_egim = (hx[2].y - hx[0].y) / Math.max(hx[2].i - hx[0].i, 1);
    let l_egim = (lx[2].y - lx[0].y) / Math.max(lx[2].i - lx[0].i, 1);
    
    if (!(h_egim < 0 && l_egim < 0 && h_egim < l_egim * 1.1)) return null;
    
    let u = uzat(hx[0].i, hx[0].y, hx[2].i, hx[2].y, df, 25);
    let a = uzat(lx[0].i, lx[0].y, lx[2].i, lx[2].y, df, 25);
    
    let yukseklik = hx[0].y - lx[0].y;
    let proj_bas_t = hx[2].t;
    let proj_bas_y = hx[2].y;
    let proj_son_i = Math.min(hx[2].i + 40, df.length - 1);
    let proj_son_t = df[proj_son_i].ts;
    let tp = proj_bas_y + yukseklik * PROJ_MULTIPLIER;
    
    let t_list = [], y_ust = [], y_alt = [];
    for (let c = hx[0].i; c <= Math.max(u.i3, a.i3); c++) {
        t_list.push(df[c].ts);
        y_ust.push(ara_deger(hx[0].i, hx[0].y, u.i3, u.y3, c));
        y_alt.push(ara_deger(lx[0].i, lx[0].y, a.i3, a.y3, c));
    }
    
    return {
        isim: "📐 Düşen Kama (Bullish)", sinyal: "bullish",
        shapes: [
            _line_shape(hx[0].t, hx[0].y, u.t3, u.y3, "#00CC88", 2),
            _line_shape(lx[0].t, lx[0].y, a.t3, a.y3, "#00CC88", 2),
            _line_shape(proj_bas_t, proj_bas_y, proj_son_t, tp, "#00FF88", 1.2, "dot")
        ],
        fills: [doldur(t_list, y_ust, y_alt, "rgba(0,204,136,0.10)")],
        ok: _ok_shape(proj_bas_t, proj_bas_y * 0.998, proj_son_t, tp, "#00CC88"),
        tp: tp, sl: lx[2].y,
        aciklama: `TP: $${tp.toFixed(5)}`
    };
}

// -- 5C. SYMMETRICAL TRIANGLE --
function simetrik_ucgen(df, ph_idx, pl_idx) {
    if (ph_idx.length < 3 || pl_idx.length < 3) return null;
    let hx = pHigh(df, ph_idx.slice(-3));
    let lx = pLow(df, pl_idx.slice(-3));
    
    let h_egim = (hx[2].y - hx[0].y) / Math.max(hx[2].i - hx[0].i, 1);
    let l_egim = (lx[2].y - lx[0].y) / Math.max(lx[2].i - lx[0].i, 1);
    
    if (!(h_egim < -1e-8 && l_egim > 1e-8)) return null;
    
    let u = uzat(hx[0].i, hx[0].y, hx[2].i, hx[2].y, df, 30);
    let a = uzat(lx[0].i, lx[0].y, lx[2].i, lx[2].y, df, 30);
    
    let trend_yukari = df[df.length-1].ema20 > df[df.length-1].ema50;
    let yukseklik = hx[0].y - lx[0].y;
    let son_fiyat = df[df.length-1].close;
    
    let sinyal, tp, ok_renk, doldur_renk;
    if (trend_yukari) {
        sinyal = "bullish"; tp = son_fiyat + yukseklik * PROJ_MULTIPLIER;
        ok_renk = "#00CC88"; doldur_renk = "rgba(0,204,136,0.10)";
    } else {
        sinyal = "bearish"; tp = son_fiyat - yukseklik * PROJ_MULTIPLIER;
        ok_renk = "#FF6B00"; doldur_renk = "rgba(255,107,0,0.10)";
    }
    
    let proj_son_t = df[df.length-1].ts;
    let proj_son_i2 = Math.min(df.length - 1 + 30, df.length - 1);
    let proj_son_t2 = df[proj_son_i2].ts;
    
    let t_list = [], y_ust = [], y_alt = [];
    for (let c = hx[0].i; c <= Math.max(u.i3, a.i3); c++) {
        t_list.push(df[c].ts);
        y_ust.push(ara_deger(hx[0].i, hx[0].y, u.i3, u.y3, c));
        y_alt.push(ara_deger(lx[0].i, lx[0].y, a.i3, a.y3, c));
    }
    
    return {
        isim: "△ Simetrik Üçgen", sinyal: sinyal,
        shapes: [
            _line_shape(hx[0].t, hx[0].y, u.t3, u.y3, "#FFAA00", 2),
            _line_shape(lx[0].t, lx[0].y, a.t3, a.y3, "#FFAA00", 2),
            _line_shape(proj_son_t, son_fiyat, proj_son_t2, tp, ok_renk, 1.2, "dot")
        ],
        fills: [doldur(t_list, y_ust, y_alt, doldur_renk)],
        ok: _ok_shape(proj_son_t, son_fiyat, proj_son_t2, tp, ok_renk),
        tp: tp, sl: null,
        aciklama: `TP: $${tp.toFixed(5)}`
    };
}

// -- 5D. ASCENDING TRIANGLE --
function ascending_triangle(df, ph_idx, pl_idx) {
    if (ph_idx.length < 3 || pl_idx.length < 3) return null;
    let hx = pHigh(df, ph_idx.slice(-3));
    let lx = pLow(df, pl_idx.slice(-3));
    
    let h_egim = (hx[2].y - hx[0].y) / Math.max(hx[2].i - hx[0].i, 1);
    let l_egim = (lx[2].y - lx[0].y) / Math.max(lx[2].i - lx[0].i, 1);
    
    let direnc_duz = Math.abs(h_egim) < Math.abs(l_egim) * 0.2 && l_egim > 0;
    if (!direnc_duz) return null;
    
    let direnc = (hx[0].y + hx[1].y + hx[2].y) / 3.0; // mean
    let u = uzat(hx[0].i, direnc, hx[2].i, direnc, df, 30);
    let a = uzat(lx[0].i, lx[0].y, lx[2].i, lx[2].y, df, 30);
    
    let yukseklik = direnc - lx[0].y;
    let proj_son_i = Math.min(df.length - 1 + 35, df.length - 1);
    let proj_son_t = df[proj_son_i].ts;
    let tp = direnc + yukseklik * PROJ_MULTIPLIER;
    
    let t_list = [], y_ust = [], y_alt = [];
    for (let c = hx[0].i; c <= Math.max(u.i3, a.i3); c++) {
        t_list.push(df[c].ts);
        y_ust.push(direnc);
        y_alt.push(ara_deger(lx[0].i, lx[0].y, a.i3, a.y3, c));
    }
    
    return {
        isim: "△ Yükselen Üçgen (Bullish)", sinyal: "bullish",
        shapes: [
            _line_shape(hx[0].t, direnc, u.t3, direnc, "#00CC88", 2),
            _line_shape(lx[0].t, lx[0].y, a.t3, a.y3, "#00CC88", 2),
            _line_shape(df[df.length-1].ts, direnc, proj_son_t, tp, "#00FF88", 1.2, "dot")
        ],
        fills: [doldur(t_list, y_ust, y_alt, "rgba(0,204,136,0.10)")],
        ok: _ok_shape(df[df.length-1].ts, direnc, proj_son_t, tp, "#00CC88"),
        tp: tp, sl: lx[2].y, aciklama: `TP: $${tp.toFixed(5)}`
    };
}

// -- 5E. DESCENDING TRIANGLE --
function descending_triangle(df, ph_idx, pl_idx) {
    if (ph_idx.length < 3 || pl_idx.length < 3) return null;
    let hx = pHigh(df, ph_idx.slice(-3));
    let lx = pLow(df, pl_idx.slice(-3));
    
    let h_egim = (hx[2].y - hx[0].y) / Math.max(hx[2].i - hx[0].i, 1);
    let l_egim = (lx[2].y - lx[0].y) / Math.max(lx[2].i - lx[0].i, 1);
    
    let destek_duz = Math.abs(l_egim) < Math.abs(h_egim) * 0.2 && h_egim < 0;
    if (!destek_duz) return null;
    
    let destek = (lx[0].y + lx[1].y + lx[2].y) / 3.0; // mean
    let u = uzat(hx[0].i, hx[0].y, hx[2].i, hx[2].y, df, 30);
    let a = uzat(lx[0].i, destek, lx[2].i, destek, df, 30);
    
    let yukseklik = hx[0].y - destek;
    let proj_son_i = Math.min(df.length - 1 + 35, df.length - 1);
    let proj_son_t = df[proj_son_i].ts;
    let tp = destek - yukseklik * PROJ_MULTIPLIER;
    
    let t_list = [], y_ust = [], y_alt = [];
    for (let c = hx[0].i; c <= Math.max(u.i3, a.i3); c++) {
        t_list.push(df[c].ts);
        y_ust.push(ara_deger(hx[0].i, hx[0].y, u.i3, u.y3, c));
        y_alt.push(destek);
    }
    
    return {
        isim: "△ Düşen Üçgen (Bearish)", sinyal: "bearish",
        shapes: [
            _line_shape(hx[0].t, hx[0].y, u.t3, u.y3, "#FF4444", 2),
            _line_shape(lx[0].t, destek, a.t3, destek, "#FF4444", 2),
            _line_shape(df[df.length-1].ts, destek, proj_son_t, tp, "#FF3333", 1.2, "dot")
        ],
        fills: [doldur(t_list, y_ust, y_alt, "rgba(255,68,68,0.10)")],
        ok: _ok_shape(df[df.length-1].ts, destek, proj_son_t, tp, "#FF4444"),
        tp: tp, sl: hx[2].y, aciklama: `TP: $${tp.toFixed(5)}`
    };
}

// -- 5F. DESCENDING CHANNEL --
function descending_channel(df, ph_idx, pl_idx) {
    if (ph_idx.length < 3 || pl_idx.length < 3) return null;
    let h_n = Math.min(ph_idx.length, 4);
    let l_n = Math.min(pl_idx.length, 4);
    if(h_n < 3 || l_n < 3) return null;
    let hx = pHigh(df, ph_idx.slice(-h_n));
    let lx = pLow(df, pl_idx.slice(-l_n));
    
    let h_egim = (hx[h_n-1].y - hx[0].y) / Math.max(hx[h_n-1].i - hx[0].i, 1);
    let l_egim = (lx[l_n-1].y - lx[0].y) / Math.max(lx[l_n-1].i - lx[0].i, 1);
    
    let paralel = Math.abs(h_egim - l_egim) / (Math.abs(h_egim) + 1e-10) < 0.35;
    if (!(h_egim < 0 && l_egim < 0 && paralel)) return null;
    
    let u = uzat(hx[0].i, hx[0].y, hx[h_n-1].i, hx[h_n-1].y, df, 30);
    let a = uzat(lx[0].i, lx[0].y, lx[l_n-1].i, lx[l_n-1].y, df, 30);
    
    let t_list = [], y_ust = [], y_alt = [];
    for (let c = hx[0].i; c <= Math.max(u.i3, a.i3); c++) {
        t_list.push(df[c].ts);
        y_ust.push(ara_deger(hx[0].i, hx[0].y, u.i3, u.y3, c));
        y_alt.push(ara_deger(lx[0].i, lx[0].y, a.i3, a.y3, c));
    }
    
    return {
        isim: "📉 Düşüş Kanalı", sinyal: "bearish",
        shapes: [
            _line_shape(hx[0].t, hx[0].y, u.t3, u.y3, "#888888", 2),
            _line_shape(lx[0].t, lx[0].y, a.t3, a.y3, "#FF6B00", 2)
        ],
        fills: [doldur(t_list, y_ust, y_alt, "rgba(150,150,150,0.07)")],
        ok: null, tp: null, sl: null, aciklama: "Düşüş kanalı — kanal kırılımı izle"
    };
}

// -- 5G. ASCENDING CHANNEL --
function ascending_channel(df, ph_idx, pl_idx) {
    if (ph_idx.length < 3 || pl_idx.length < 3) return null;
    let h_n = Math.min(ph_idx.length, 4);
    let l_n = Math.min(pl_idx.length, 4);
    if(h_n < 3 || l_n < 3) return null;
    let hx = pHigh(df, ph_idx.slice(-h_n));
    let lx = pLow(df, pl_idx.slice(-l_n));
    
    let h_egim = (hx[h_n-1].y - hx[0].y) / Math.max(hx[h_n-1].i - hx[0].i, 1);
    let l_egim = (lx[l_n-1].y - lx[0].y) / Math.max(lx[l_n-1].i - lx[0].i, 1);
    
    let paralel = Math.abs(h_egim - l_egim) / (Math.abs(l_egim) + 1e-10) < 0.35;
    if (!(h_egim > 0 && l_egim > 0 && paralel)) return null;
    
    let u = uzat(hx[0].i, hx[0].y, hx[h_n-1].i, hx[h_n-1].y, df, 30);
    let a = uzat(lx[0].i, lx[0].y, lx[l_n-1].i, lx[l_n-1].y, df, 30);
    
    let t_list = [], y_ust = [], y_alt = [];
    for (let c = hx[0].i; c <= Math.max(u.i3, a.i3); c++) {
        t_list.push(df[c].ts);
        y_ust.push(ara_deger(hx[0].i, hx[0].y, u.i3, u.y3, c));
        y_alt.push(ara_deger(lx[0].i, lx[0].y, a.i3, a.y3, c));
    }
    
    return {
        isim: "📈 Yükseliş Kanalı", sinyal: "bullish",
        shapes: [
            _line_shape(hx[0].t, hx[0].y, u.t3, u.y3, "#00CC88", 2),
            _line_shape(lx[0].t, lx[0].y, a.t3, a.y3, "#00CC88", 2)
        ],
        fills: [doldur(t_list, y_ust, y_alt, "rgba(0,204,136,0.07)")],
        ok: null, tp: null, sl: null, aciklama: "Yükseliş kanalı — destek kırılımı izle"
    };
}

// -- 5H. DOUBLE TOP --
function double_top(df, ph_idx) {
    if (ph_idx.length < 4) return null;
    let son4 = pHigh(df, ph_idx.slice(-4));
    let p1 = son4[1], p2 = son4[3];
    let ort_fark = Math.abs(p1.y - p2.y) / Math.max(p1.y, p2.y);
    if (ort_fark > 0.02) return null;
    
    let sliceLows = df.slice(p1.i, p2.i + 1);
    let boyun = Math.min(...sliceLows.map(d => d.low));
    let yukseklik = Math.max(p1.y, p2.y) - boyun;
    let proj_son_i = Math.min(p2.i + 40, df.length - 1);
    let proj_son_t = df[proj_son_i].ts;
    let tp = boyun - yukseklik * PROJ_MULTIPLIER;
    
    let boyun_t2 = df[Math.min(son4[3].i + 20, df.length - 1)].ts;
    
    return {
        isim: "🔴 Çift Tepe (Double Top)", sinyal: "bearish",
        shapes: [
            _line_shape(p1.t, p1.y, p2.t, p2.y, "#FF4444", 1.5, "dot"),
            _line_shape(son4[1].t, boyun, boyun_t2, boyun, "#FF4444", 1.5),
            _line_shape(p2.t, boyun, proj_son_t, tp, "#FF3333", 1.2, "dot")
        ],
        fills: [],
        ok: _ok_shape(p2.t, boyun, proj_son_t, tp, "#FF4444"),
        tp: tp, sl: Math.max(p1.y, p2.y) * 1.005,
        aciklama: `Boyun: $${boyun.toFixed(5)} | TP: $${tp.toFixed(5)}`
    };
}

// -- 5I. DOUBLE BOTTOM --
function double_bottom(df, pl_idx) {
    if (pl_idx.length < 4) return null;
    let son4 = pLow(df, pl_idx.slice(-4));
    let p1 = son4[1], p2 = son4[3];
    let ort_fark = Math.abs(p1.y - p2.y) / Math.min(p1.y, p2.y);
    if (ort_fark > 0.02) return null;
    
    let sliceHighs = df.slice(p1.i, p2.i + 1);
    let boyun = Math.max(...sliceHighs.map(d => d.high));
    let yukseklik = boyun - Math.min(p1.y, p2.y);
    let proj_son_i = Math.min(p2.i + 40, df.length - 1);
    let proj_son_t = df[proj_son_i].ts;
    let tp = boyun + yukseklik * PROJ_MULTIPLIER;
    
    let boyun_t2 = df[Math.min(son4[3].i + 20, df.length - 1)].ts;
    
    return {
        isim: "🟢 Çift Dip (Double Bottom)", sinyal: "bullish",
        shapes: [
            _line_shape(p1.t, p1.y, p2.t, p2.y, "#00CC88", 1.5, "dot"),
            _line_shape(son4[1].t, boyun, boyun_t2, boyun, "#00CC88", 1.5),
            _line_shape(p2.t, boyun, proj_son_t, tp, "#00FF88", 1.2, "dot")
        ],
        fills: [],
        ok: _ok_shape(p2.t, boyun, proj_son_t, tp, "#00CC88"),
        tp: tp, sl: Math.min(p1.y, p2.y) * 0.995,
        aciklama: `Boyun: $${boyun.toFixed(5)} | TP: $${tp.toFixed(5)}`
    };
}

// -- 5J. HEAD AND SHOULDERS --
function head_shoulders(df, ph_idx) {
    if (ph_idx.length < 5) return null;
    let son5 = pHigh(df, ph_idx.slice(-5));
    let pL = son5[0], pB = son5[2], pR = son5[4];
    
    let omuz_fark = Math.abs(pL.y - pR.y) / Math.max(pL.y, pR.y);
    let bas_yuksek = (pB.y > pL.y * 1.01) && (pB.y > pR.y * 1.01);
    if (!(omuz_fark < 0.03 && bas_yuksek)) return null;
    
    let boyun = ((pL.y + pR.y) / 2) * 0.96;
    let yukseklik = pB.y - boyun;
    let proj_son_i = Math.min(pR.i + 40, df.length - 1);
    let proj_son_t = df[proj_son_i].ts;
    let tp = boyun - yukseklik * PROJ_MULTIPLIER;
    
    return {
        isim: "👤 Omuz-Baş-Omuz (H&S)", sinyal: "bearish",
        shapes: [
            _line_shape(pL.t, boyun, pR.t, boyun, "#FF4444", 1.5),
            _line_shape(pR.t, boyun, proj_son_t, tp, "#FF3333", 1.2, "dot")
        ],
        fills: [],
        ok: _ok_shape(pR.t, boyun, proj_son_t, tp, "#FF4444"),
        tp: tp, sl: pB.y * 1.005,
        aciklama: `Boyun: $${boyun.toFixed(5)} | TP: $${tp.toFixed(5)}`
    };
}

// Include all functions in an array for scanning
const PATTERN_CHECKS = [
    rising_wedge, falling_wedge, simetrik_ucgen,
    ascending_triangle, descending_triangle,
    descending_channel, ascending_channel,
    double_top, double_bottom, head_shoulders
];

function formasyon_tara(df, ph_idx, pl_idx) {
    let sonuclar = [];
    for (let fn of PATTERN_CHECKS) {
        try {
            let r = fn(df, ph_idx, pl_idx);
            if (r) sonuclar.push(r);
        } catch (e) {
            console.error(e);
        }
    }
    return sonuclar.slice(0, 2);
}
