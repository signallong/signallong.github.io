// app.js

const LIMITS = { "5m": 300, "15m": 300, "30m": 300, "1h": 300, "4h": 300, "1d": 500 };

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('calcBtn').addEventListener('click', onAnalyze);
    onAnalyze();
});

async function onAnalyze() {
    const coin = document.getElementById('symbolInput').value.trim().toUpperCase() || 'GMT';
    let symbol = `${coin}USDT`;
    const tf = document.getElementById('tfSelect').value;
    
    const loading = document.getElementById('loadingStatus');
    loading.classList.remove('hidden');
    
    try {
        let df = await fetchBinanceData(symbol, tf);
        if (!df || df.length === 0) {
            console.log("Future failed or empty, trying Spot...");
            df = await fetchBinanceData(symbol, tf, true);
        }
        
        if (!df || df.length === 0) {
            alert("Veri çekilemedi. Bağlantıyı kontrol edin veya geçerli bir coin girin.");
            loading.classList.add('hidden');
            return;
        }

        // Calculation
        calcIndicators(df);
        const { ph_idx, pl_idx } = pivotlar(df, 5);
        const formasyonlar = formasyon_tara(df, ph_idx, pl_idx);
        
        updateSummary(df, formasyonlar, symbol, tf);
        drawChart(df, symbol, tf, formasyonlar, ph_idx, pl_idx);
        
    } catch(err) {
        console.error(err);
        alert("Bir hata oluştu: " + err.message);
    } finally {
        loading.classList.add('hidden');
    }
}

async function fetchBinanceData(symbol, tf, isSpot = false) {
    const limit = LIMITS[tf] || 300;
    const base = isSpot ? 'https://api.binance.com/api/v3' : 'https://fapi.binance.com/fapi/v1';
    const url = `${base}/klines?symbol=${symbol}&interval=${tf}&limit=${limit}`;
    
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Binance API Error: ${res.status}`);
    const data = await res.json();
    
    return data.map(kline => ({
        ts: new Date(kline[0]),
        open: parseFloat(kline[1]),
        high: parseFloat(kline[2]),
        low: parseFloat(kline[3]),
        close: parseFloat(kline[4]),
        volume: parseFloat(kline[5])
    }));
}

function updateSummary(df, formations, symbol, tf) {
    const last = df[df.length - 1];
    const prev = df[df.length - 2];
    
    const pChange = ((last.close - prev.close) / prev.close) * 100;
    
    document.getElementById('valPrice').innerText = `$${last.close.toFixed(5)}`;
    
    const chgEl = document.getElementById('valChange');
    chgEl.innerText = `${pChange >= 0 ? '+' : ''}${pChange.toFixed(2)}%`;
    chgEl.style.color = pChange >= 0 ? 'var(--bullish)' : 'var(--bearish)';
    
    document.getElementById('valRsi').innerText = last.rsi ? last.rsi.toFixed(1) : '-';
    document.getElementById('valEma20').innerText = last.ema20 ? last.ema20.toFixed(5) : '-';
    document.getElementById('valEma50').innerText = last.ema50 ? last.ema50.toFixed(5) : '-';
    
    let trendStr = "-";
    if (last.ema20 && last.ema50) {
        trendStr = last.ema20 > last.ema50 ? "📈 YUKARI" : "📉 AŞAĞI";
    }
    const trEl = document.getElementById('valTrend');
    trEl.innerText = trendStr;
    trEl.style.color = trendStr.includes("YUKARI") ? 'var(--bullish)' : 'var(--bearish)';
    
    const patList = document.getElementById('patternsList');
    patList.innerHTML = '';
    
    if (!formations || formations.length === 0) {
        patList.innerHTML = '<div class="no-pattern" style="font-size:0.85rem;color:var(--text-secondary);">Henüz net bir formasyon tespit edilemedi.</div>';
    } else {
        formations.forEach(f => {
            const div = document.createElement('div');
            div.className = `pattern-item ${f.sinyal}`;
            const emoji = f.sinyal === 'bullish' ? '🟢' : (f.sinyal === 'bearish' ? '🔴' : '🟡');
            div.innerHTML = `<div>${emoji} <strong>${f.isim}</strong></div><div class="pattern-desc">${f.aciklama} ${f.sl ? ` | SL: $${f.sl.toFixed(5)}` : ''}</div>`;
            patList.appendChild(div);
        });
    }
}

function drawChart(df, symbol, tf, formasyonlar, ph_idx, pl_idx) {
    const xData = df.map(d => d.ts);
    
    const tracePrice = {
        x: xData, close: df.map(d => d.close), high: df.map(d => d.high),
        low: df.map(d => d.low), open: df.map(d => d.open),
        decreasing: {line: {color: '#FF4444'}, fillcolor: '#FF4444'},
        increasing: {line: {color: '#00CC88'}, fillcolor: '#00CC88'},
        type: 'candlestick', yaxis: 'y', name: 'Fiyat'
    };
    
    const traceEMA20 = { x: xData, y: df.map(d => d.ema20), type: 'scatter', mode: 'lines', line: {color: '#2196F3', width: 1}, name: 'EMA20', hoverinfo: "none" };
    const traceEMA50 = { x: xData, y: df.map(d => d.ema50), type: 'scatter', mode: 'lines', line: {color: '#FF9800', width: 1}, name: 'EMA50', hoverinfo: "none" };
    const traceEMA200 = { x: xData, y: df.map(d => d.ema200), type: 'scatter', mode: 'lines', line: {color: '#CC55FF', width: 1, dash: 'dot'}, name: 'EMA200', hoverinfo: "none" };

    const pivotH = pHigh(df, ph_idx);
    const tracePH = { x: pivotH.map(p => p.t), y: pivotH.map(p => p.y * 1.002), mode: 'markers', marker: {symbol: 'triangle-down', color: '#FF4444', size: 6}, name: 'Pivot H', hoverinfo: "none" };
    const pivotL = pLow(df, pl_idx);
    const tracePL = { x: pivotL.map(p => p.t), y: pivotL.map(p => p.y * 0.998), mode: 'markers', marker: {symbol: 'triangle-up', color: '#00CC88', size: 6}, name: 'Pivot L', hoverinfo: "none" };
    
    const traceVol = { x: xData, y: df.map(d => d.volume), type: 'bar', marker: {color: df.map(d => d.close >= d.open ? '#F0A500' : '#333333'), opacity: 0.5}, yaxis: 'y4', name: 'Volume' };
    const traceRsi = { x: xData, y: df.map(d => d.rsi), type: 'scatter', mode: 'lines', line: {color: '#2196F3', width: 1.5}, yaxis: 'y2', name: 'RSI' };
    
    const traceMacd = { x: xData, y: df.map(d => d.macd), type: 'scatter', mode: 'lines', line: {color: '#2196F3', width: 1.2}, yaxis: 'y3', name: 'MACD', hoverinfo: "none" };
    const traceMacdSig = { x: xData, y: df.map(d => d.macd_sig), type: 'scatter', mode: 'lines', line: {color: '#FF9800', width: 1.2}, yaxis: 'y3', name: 'MACD Sig', hoverinfo: "none" };
    const traceMacdHist = { x: xData, y: df.map(d => d.macd_hist), type: 'bar', marker: {color: df.map(d => d.macd_hist >= 0 ? '#00CC88' : '#FF4444')}, yaxis: 'y3', name: 'MACD Hist' };
    
    let data = [tracePrice, traceEMA20, traceEMA50, traceEMA200, tracePH, tracePL, traceVol, traceRsi, traceMacdHist, traceMacd, traceMacdSig];
    let shapes = [];
    let annotations = [];
    
    formasyonlar.forEach(f => {
        if (f.fills) data = data.concat(f.fills);
        if (f.shapes) shapes = shapes.concat(f.shapes);
        if (f.ok) annotations.push(f.ok);
        if (f.tp) {
            shapes.push({
                type: "line", x0: xData[Math.floor(xData.length*0.7)], x1: xData[xData.length-1], y0: f.tp, y1: f.tp, xref: "x", yref: "y", line: {color: f.sinyal === 'bullish' ? "#00FF88" : "#FF3333", width: 1.5, dash: "dash"}
            });
            annotations.push({
                x: xData[xData.length-1], y: f.tp, text: `<b>TP: $${f.tp.toFixed(5)}</b>`, showarrow: false, xanchor: "left", font: {color: f.sinyal === 'bullish' ? "#00FF88" : "#FF3333", size: 10}, bgcolor: "rgba(0,0,0,0.5)", xref: "x", yref: "y"
            });
        }
    });

    const layout = {
        title: { text: `<b>${symbol} | ${tf.toUpperCase()}</b>`, font: {color: '#CCC', size: 14}, x: 0.01 },
        paper_bgcolor: 'rgba(0,0,0,0)', plot_bgcolor: 'rgba(0,0,0,0.2)', font: {color: '#CCC'},
        margin: {l: 50, r: 60, t: 50, b: 30},
        showlegend: false, hovermode: 'closest',
        xaxis: { rangeslider: {visible: false}, gridcolor: '#1A1A1A', type: 'category' },
        yaxis: { domain: [0.4, 1.0], gridcolor: '#1A1A1A' },
        yaxis2: { domain: [0.2, 0.38], gridcolor: '#1A1A1A', range: [5, 95] },
        yaxis3: { domain: [0.0, 0.18], gridcolor: '#1A1A1A' },
        yaxis4: { domain: [0.4, 0.55], overlaying: 'y', visible: false }, 
        shapes: shapes,
        annotations: annotations
    };
    
    [30, 50, 70].forEach(v => {
        shapes.push({type: 'line', x0: 0, x1: xData.length-1, y0: v, y1: v, xref: 'x', yref: 'y2', line: {color: 'rgba(255,255,255,0.1)', dash: 'dot', width: 1}});
    });

    Plotly.newPlot('plotlyChart', data, layout, {responsive: true, displayModeBar: false});
}
