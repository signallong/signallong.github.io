// math.js - Technical Indicators and Math Utilities

function ema(data, period) {
    const k = 2 / (period + 1);
    let result = new Array(data.length).fill(null);
    let emaVal = data[0];
    result[0] = emaVal;
    
    for (let i = 1; i < data.length; i++) {
        if (data[i] !== null && !isNaN(data[i])) {
            emaVal = data[i] * k + emaVal * (1 - k);
            result[i] = emaVal;
        }
    }
    return result;
}

function rollingMean(data, period) {
    let result = new Array(data.length).fill(null);
    let sum = 0;
    let count = 0;
    
    for (let i = 0; i < data.length; i++) {
        sum += data[i];
        count++;
        if (count > period) {
            sum -= data[i - period];
            count--;
        }
        if (count === period) {
            result[i] = sum / period;
        }
    }
    return result;
}

function calcIndicators(df) {
    const close = df.map(d => d.close);
    const volume = df.map(d => d.volume);
    
    // EMA 20, 50, 200
    df.forEach((d, i) => { d.ema20 = null; d.ema50 = null; d.ema200 = null; d.rsi = null; });
    const ema20 = ema(close, 20);
    const ema50 = ema(close, 50);
    const ema200 = ema(close, 200);
    
    // RSI (based on rolling 14 mean of diff)
    let gArr = [0];
    let lArr = [0];
    for (let i = 1; i < close.length; i++) {
        let diff = close[i] - close[i - 1];
        gArr.push(diff > 0 ? diff : 0);
        lArr.push(diff < 0 ? -diff : 0);
    }
    const gMean = rollingMean(gArr, 14);
    const lMean = rollingMean(lArr, 14);
    
    const rsi = close.map((_, i) => {
        if (gMean[i] === null || lMean[i] === null) return null;
        if (lMean[i] === 0) return 100;
        return 100 - (100 / (1 + (gMean[i] / lMean[i])));
    });
    
    // MACD
    const ema12 = ema(close, 12);
    const ema26 = ema(close, 26);
    const macd = ema12.map((v, i) => v - ema26[i]);
    const macdSig = ema(macd, 9);
    const macdHist = macd.map((v, i) => v - macdSig[i]);
    
    // Vol MA
    const volMa = rollingMean(volume, 20);
    
    // Mutate dataframe
    for (let i = 0; i < df.length; i++) {
        df[i].ema20 = ema20[i];
        df[i].ema50 = ema50[i];
        df[i].ema200 = ema200[i];
        df[i].rsi = rsi[i];
        df[i].macd = macd[i];
        df[i].macd_sig = macdSig[i];
        df[i].macd_hist = macdHist[i];
        df[i].vol_ma = volMa[i];
    }
}

// argrelextrema implementation for JS
function argrelextrema(data, comparator, order = 5) {
    let extrema = [];
    for (let i = 0; i < data.length; i++) {
        let isExtrema = true;
        let start = Math.max(0, i - order);
        let end = Math.min(data.length - 1, i + order);
        
        for (let j = start; j <= end; j++) {
            if (i === j) continue;
            // greater_equal -> compare(data[i], data[j]) -> data[i] < data[j] implies fail
            // less_equal -> compare(data[i], data[j]) -> data[i] > data[j] implies fail
            if (!comparator(data[i], data[j])) {
                isExtrema = false;
                break;
            }
        }
        if (isExtrema) extrema.push(i);
    }
    return extrema;
}

function pivotlar(df, order = 5) {
    const high = df.map(d => d.high);
    const low = df.map(d => d.low);
    
    const ph_idx = argrelextrema(high, (a, b) => a >= b, order);
    const pl_idx = argrelextrema(low, (a, b) => a <= b, order);
    
    return { ph_idx, pl_idx };
}

// Additional utils from python
function nokta(df, i, type = "high") {
    const col = type === "high" ? "high" : "low";
    return [df[i].ts, df[i][col]];
}

function uzat(i1, y1, i2, y2, totalLen, n_ileri = 30) {
    const egim = (y2 - y1) / Math.max(i2 - i1, 1);
    const i3 = Math.min(i2 + n_ileri, totalLen - 1);
    const y3 = y2 + egim * (i3 - i2);
    return { i3, y3 };
}

function ara_deger(i1, y1, i2, y2, i_hedef) {
    const egim = (y2 - y1) / Math.max(i2 - i1, 1);
    return y1 + egim * (i_hedef - i1);
}
