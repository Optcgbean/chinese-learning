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
let voicePref = null;
function pickVoice() {
    if (voicePref) return voicePref;
    const voices = window.speechSynthesis ? speechSynthesis.getVoices() : [];
    // Mandarin only: zh-CN first, then zh-TW, then any zh fallback
    voicePref =
        voices.find(v => /zh[-_]CN/i.test(v.lang)) ||
        voices.find(v => /zh[-_]TW/i.test(v.lang)) ||
        voices.find(v => /^zh/i.test(v.lang)) || null;
    return voicePref;
}
if (window.speechSynthesis) speechSynthesis.onvoiceschanged = () => { voicePref = null; };

function speak(text, lang) {
    if (!window.speechSynthesis) return;
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
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
        sel.innerHTML = Object.keys(wordSets).map(k =>
            `<option value="${k}">${k === 'grade3' ? 'Grade 3' : k[0].toUpperCase() + k.slice(1)}</option>`
        ).join('');
        sel.value = currentSet;
    }
    // scramble: Enter key submits
    const si = document.getElementById('scrambleInput');
    if (si) si.addEventListener('keydown', e => { if (e.key === 'Enter') checkScramble(); });
}

document.addEventListener('DOMContentLoaded', init);
