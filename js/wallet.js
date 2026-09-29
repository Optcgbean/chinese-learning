// === WALLET / ROBUX ECONOMY ===
// Base rate: 0.5 Robux per correct answer at Normal difficulty.
// Hard = 2x (insane-style). Combo streak adds a multiplier on top.

const BASE_RATE = 0.5;
const COMBO_THRESHOLD = 3;      // streak needed to ignite combo
const COMBO_STEP = 0.5;         // each extra streak adds +0.5x, capped
const COMBO_CAP = 3;            // max combo multiplier

const DIFFICULTY = {
    easy:   { mult: 1,   label: 'Easy'   },
    normal: { mult: 1,   label: 'Normal' },
    hard:   { mult: 2,   label: 'Hard 🔥' },
    boss:   { mult: 5,   label: 'BOSS 👹' }
};

const WALLET_KEY = 'clf_wallet_v2';
const COMBO_KEY  = 'clf_combo_v2';

let wallet = { balance: 0, tx: [] };
let streak = 0;

function loadWallet() {
    try {
        const raw = localStorage.getItem(WALLET_KEY);
        if (raw) wallet = JSON.parse(raw);
    } catch (e) { wallet = { balance: 0, tx: [] }; }
    try { streak = parseInt(localStorage.getItem(COMBO_KEY) || '0', 10) || 0; } catch (e) { streak = 0; }
}

function saveWallet() {
    localStorage.setItem(WALLET_KEY, JSON.stringify(wallet));
    localStorage.setItem(COMBO_KEY, String(streak));
}

function comboMult() {
    if (streak < COMBO_THRESHOLD) return 1;
    return Math.min(1 + (streak - COMBO_THRESHOLD + 1) * COMBO_STEP, COMBO_CAP);
}

function fmt(n) { return (Math.round(n * 100) / 100).toFixed(2).replace(/\.00$/, ''); }

// Award Robux. reason: short label e.g. 'Word Choice — Hard'. Returns amount awarded.
function award(diffKey, reason) {
    const d = DIFFICULTY[diffKey] || DIFFICULTY.normal;
    const amt = Math.round(BASE_RATE * d.mult * comboMult() * 100) / 100;
    wallet.balance = Math.round((wallet.balance + amt) * 100) / 100;
    wallet.tx.unshift({ amt, reason: reason + (comboMult() > 1 ? ` (combo x${comboMult()})` : ''), t: Date.now() });
    if (wallet.tx.length > 60) wallet.tx.length = 60;
    saveWallet();
    renderWallet();
    showRobuxPopup(amt, comboMult() > 1);
    return amt;
}

function breakStreak() {
    if (streak >= COMBO_THRESHOLD) flashComboLost();
    streak = 0;
    saveWallet();
    renderCombo();
}

function bumpStreak() {
    streak++;
    saveWallet();
    renderCombo();
}

// Parent confirms a real Robux payout -> deducts from balance.
function redeem(amount, pin) {
    if (pin !== '8888') return { ok: false, msg: 'Wrong parent code.' };
    if (amount <= 0 || amount > wallet.balance) return { ok: false, msg: 'Invalid amount.' };
    wallet.balance = Math.round((wallet.balance - amount) * 100) / 100;
    wallet.tx.unshift({ amt: -amount, reason: 'Redeemed (parent approved)', t: Date.now() });
    saveWallet();
    renderWallet();
    return { ok: true, msg: `Redeemed ${fmt(amount)} Robux!` };
}

// === DOM RENDERING ===
function renderWallet() {
    const el = document.getElementById('walletBalance');
    if (el) el.textContent = fmt(wallet.balance);
    const lvl = levelFromEarned();
    const lvlEl = document.getElementById('levelBadge');
    if (lvlEl) lvlEl.textContent = 'Lv.' + lvl;
}

function earnedTotal() {
    return wallet.tx.filter(t => t.amt > 0).reduce((a, t) => a + t.amt, 0);
}

function levelFromEarned() {
    return Math.floor(earnedTotal() / 10) + 1; // level up every 10 Robux earned lifetime
}

function renderCombo() {
    const badge = document.getElementById('comboBadge');
    if (!badge) return;
    if (streak >= COMBO_THRESHOLD) {
        badge.textContent = `🔥 Combo x${comboMult()} (${streak})`;
        badge.classList.add('on');
    } else if (streak > 0) {
        badge.textContent = `${streak} in a row`;
        badge.classList.remove('on');
    } else {
        badge.classList.remove('on');
        badge.textContent = '';
    }
}

function flashComboLost() {
    const badge = document.getElementById('comboBadge');
    if (!badge) return;
    badge.textContent = '💔 Combo lost!';
    badge.classList.add('on');
    setTimeout(renderCombo, 1500);
}

let popupTimer = null;
function showRobuxPopup(amount, isCombo) {
    const p = document.getElementById('robuxPopup');
    if (!p) return;
    p.textContent = `+${fmt(amount)} 💰 Robux!`;
    p.classList.toggle('combo', !!isCombo);
    p.style.display = 'block';
    clearTimeout(popupTimer);
    popupTimer = setTimeout(() => { p.style.display = 'none'; }, 1800);
}

function renderTxList() {
    const box = document.getElementById('txList');
    if (!box) return;
    if (!wallet.tx.length) {
        box.innerHTML = '<div class="tx-row"><span class="when">No earnings yet — go play!</span></div>';
        return;
    }
    box.innerHTML = wallet.tx.slice(0, 12).map(t => {
        const d = new Date(t.t);
        const when = `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
        const cls = t.amt >= 0 ? 'plus' : 'minus';
        const sign = t.amt >= 0 ? '+' : '';
        return `<div class="tx-row"><span>${escapeHtml(t.reason)}<br><span class="when">${when}</span></span><span class="amt ${cls}">${sign}${fmt(t.amt)}</span></div>`;
    }).join('');
}

function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function toggleWalletPanel() {
    const panel = document.getElementById('walletPanel');
    panel.classList.toggle('open');
    if (panel.classList.contains('open')) renderTxList();
}

function doRedeem() {
    const amtEl = document.getElementById('redeemAmount');
    const pinEl = document.getElementById('redeemPin');
    const msgEl = document.getElementById('redeemMsg');
    const amt = parseFloat(amtEl.value);
    const res = redeem(amt, pinEl.value.trim());
    msgEl.textContent = res.msg;
    msgEl.style.color = res.ok ? '#22c55e' : '#ef4444';
    if (res.ok) { amtEl.value = ''; pinEl.value = ''; }
}
