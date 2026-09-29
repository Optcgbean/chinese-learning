// === NAV / SPEECH / STORIES / BOOT ===

function showGame(id) {
    clearInterval(bossTimerId);
    // boss difficulty must not leak into other games after fleeing
    if (currentDiff === 'boss') setDifficulty('normal');
    document.querySelectorAll('.game-area, .reward-screen').forEach(g => g.classList.remove('active'));
    document.getElementById('menuScreen').style.display = 'none';
    document.getElementById(id).classList.add('active');
    document.getElementById('gameFeedback').textContent = '';
    document.getElementById('gameFeedback').className = 'feedback';

    switch (id) {
        case 'flashcardGame': startFlashcards(); break;
        case 'matchingGame': startMatching(); break;
        case 'wordChoiceGame': startWordChoice(); break;
        case 'listeningGame': startListening(); break;
        case 'scrambleGame': startScramble(); break;
        case 'sentenceOrderGame': startSentenceOrder(); break;
        case 'elementsGame': startElements(); break;
        case 'comprehensionGame': startComprehension(); break;
        case 'fillBlankGame': startFillBlank(); break;
        case 'bossGame': startBossBattle(); break;
        case 'storyGame': renderStory(currentStory); break;
    }
}

function backToMenu() {
    clearInterval(bossTimerId);
    document.querySelectorAll('.game-area, .reward-screen').forEach(g => g.classList.remove('active'));
    document.getElementById('menuScreen').style.display = 'block';
}

function showReward(text) {
    clearInterval(bossTimerId);
    document.querySelectorAll('.game-area').forEach(g => g.classList.remove('active'));
    document.getElementById('rewardText').innerHTML = escapeHtml(text);
    document.getElementById('rewardScreen').classList.add('active');
}

// === SPEECH ===
// Mandarin voices only — NEVER zh-HK/yue/Cantonese.
// On HK devices the only installed zh voice is often Cantonese (Sin-Ji), which
// the old "any zh" fallback picked, so "Mandarin" buttons spoke Cantonese.
let mandarinVoices = [];
function refreshVoices() {
    if (!window.speechSynthesis) return;
    const vs = speechSynthesis.getVoices();
    mandarinVoices = vs.filter(v => {
        const tag = (v.lang + ' ' + v.name).toLowerCase();
        if (/hk|yue|cantonese|廣東|粤/.test(tag)) return false;
        return /^zh([-_](cn|tw|sg))?/i.test(v.lang.trim());
    });
}
function pickVoice() {
    if (!window.speechSynthesis) return null;
    if (!mandarinVoices.length) refreshVoices();
    return mandarinVoices.find(v => /cn/i.test(v.lang)) ||
           mandarinVoices.find(v => /tw/i.test(v.lang)) ||
           mandarinVoices[0] || null;
}
if (window.speechSynthesis) {
    refreshVoices();
    speechSynthesis.onvoiceschanged = refreshVoices;
}

function speak(text, lang) {
    if (!window.speechSynthesis) return;
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    // hard Mandarin tag even when a voice is found — some engines re-read the tag
    u.lang = lang || 'zh-CN';
    const v = pickVoice();
    if (v) u.voice = v;
    u.rate = 0.85;
    speechSynthesis.speak(u);
}

// === STORIES ===
let currentStory = 0;

function selectStory(i) {
    currentStory = i;
    document.querySelectorAll('#storyTabs .tab').forEach((t, idx) => t.classList.toggle('active', idx === i));
    renderStory(i);
}

function renderStory(i) {
    const s = stories[i];
    const el = document.getElementById('storyContent');
    el.innerHTML = s.content.split('').map(ch =>
        `<span style="cursor:pointer" onclick="speak('${ch}')" title="Tap to hear">${escapeHtml(ch)}</span>`
    ).join('') + `<div style="color:var(--muted); font-size:0.95rem; margin-top:12px;">${escapeHtml(s.translation)}</div>`;
}

function speakStory() { speak(stories[currentStory].content); }

// === WORD SET SELECT ===
function changeWordSet() {
    currentSet = document.getElementById('wordSetSelect').value;
}

// === BOOT ===
function init() {
    loadWallet();
    renderWallet();
    renderCombo();
    const sel = document.getElementById('wordSetSelect');
    if (sel) {
        // Assessment-prep focus: only the P3 進展性評估 set is offered.
        // (Other sets remain in js/data.js — re-add their keys here to restore.)
        const ENABLED_SETS = ['assessment'];
        sel.innerHTML = ENABLED_SETS.map(k =>
            `<option value="${k}">${k === 'assessment' ? 'Assessment 評估詞語' : k[0].toUpperCase() + k.slice(1)}</option>`
        ).join('');
        sel.value = currentSet;
    }
    // word scramble is tap-tile based now (no typing)
}

document.addEventListener('DOMContentLoaded', init);
