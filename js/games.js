// === GAME ENGINE — part 1: flashcards, matching, word choice ===

let currentSet = 'assessment';
let currentDiff = 'normal';
let gameScore = { correct: 0, wrong: 0 };
let quizWord = null; // word currently being tested (set by each game's next*())

// === 錯字簿 WRONG-WORD NOTEBOOK ===
// Every wrong answer in a word game adds the word here; every correct answer
// heals it. The 錯字簿 game drills weak words until they leave the book.
const WRONG_KEY = 'clf_wrongbook_v1';

function getWrongBook() { try { return JSON.parse(localStorage.getItem(WRONG_KEY)) || {}; } catch (e) { return {}; } }
function saveWrongBook(b) { localStorage.setItem(WRONG_KEY, JSON.stringify(b)); }
function wrongBookCount() { return Object.keys(getWrongBook()).length; }

function allWords() {
    const seen = {};
    Object.values(wordSets).flat().forEach(w => { if (w.zh && !seen[w.zh]) seen[w.zh] = w; });
    return Object.values(seen);
}

function noteAnswer(isCorrect) {
    if (!quizWord) return;
    const b = getWrongBook();
    if (isCorrect) {
        if (b[quizWord]) {
            b[quizWord].n--;
            if (b[quizWord].n <= 0) delete b[quizWord];
            saveWrongBook(b);
            updateWrongBadge();
        }
    } else {
        const e = b[quizWord] || { n: 0 };
        e.n = Math.min(5, e.n + 1);
        e.t = Date.now();
        b[quizWord] = e;
        saveWrongBook(b);
        updateWrongBadge();
    }
}

function updateWrongBadge() {
    const el = document.getElementById('wrongBadge');
    if (!el) return;
    const n = wrongBookCount();
    el.textContent = n > 0 ? `📕 ${n}` : '';
    el.style.display = n > 0 ? 'inline-block' : 'none';
}

// Difficulty UI was removed 2026-09-30 (parent request) — every game pays at
// the standard rate. Boss mode still flips currentDiff to 'boss' internally
// for its 5x reward tier; leaving a boss game resets it to 'normal'.
function setDifficulty(d) {
    currentDiff = d;
}

function activeWords() { return wordSets[currentSet] || wordSets.assessment; }

function pickWord(exclude) {
    const words = activeWords();
    let w;
    do { w = words[Math.floor(Math.random() * words.length)]; } while (exclude && w.zh === exclude.zh);
    return w;
}

function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

function otherWords(correct, n) {
    const pool = shuffle(activeWords().filter(w => w.zh !== correct.zh));
    return pool.slice(0, n);
}

// Generic result handler: awards on correct, breaks combo on wrong,
// and feeds the 錯字簿 wrong-word notebook.
function onAnswer(isCorrect, reason) {
    noteAnswer(isCorrect);
    const fb = document.getElementById('gameFeedback');
    if (isCorrect) {
        gameScore.correct++;
        bumpStreak();
        const amt = award(currentDiff, reason);
        if (fb) { fb.textContent = `✅ Correct! +${fmt(amt)} Robux`; fb.className = 'feedback correct'; }
    } else {
        gameScore.wrong++;
        breakStreak();
        if (fb) { fb.textContent = '❌ Wrong! Try the next one.'; fb.className = 'feedback wrong'; }
    }
    updateGameStats();
}

function updateGameStats() {
    const el = document.getElementById('gameStats');
    if (el) el.innerHTML = `✅ ${gameScore.correct} &nbsp;|&nbsp; ❌ ${gameScore.wrong} &nbsp;|&nbsp; 🔥 ${streak} streak`;
    const bar = document.getElementById('gameProgress');
    if (bar) {
        const total = gameScore.correct + gameScore.wrong;
        bar.style.width = Math.min(100, (gameScore.correct / Math.max(10, total)) * 100) + '%';
    }
}

function resetGameScore() {
    gameScore = { correct: 0, wrong: 0 };
    const fb = document.getElementById('gameFeedback');
    if (fb) { fb.textContent = ''; fb.className = 'feedback'; }
    updateGameStats();
}

// === 1. FLASHCARDS ===
let fcState = { word: null, flipped: false };

function startFlashcards() {
    resetGameScore();
    nextFlashcard();
}

function nextFlashcard() {
    fcState = { word: pickWord(), flipped: false };
    const inner = document.getElementById('fcInner');
    const card = document.getElementById('flashcard');
    card.classList.remove('flipped');
    document.getElementById('fcZh').textContent = fcState.word.zh;
    document.getElementById('fcEn').textContent = fcState.word.en;
    document.getElementById('fcPinyin').textContent = fcState.word.pinyin;
    document.getElementById('fcFrontPinyin').textContent = '';
    inner.style.pointerEvents = 'auto';
}

function flipCard() {
    const card = document.getElementById('flashcard');
    fcState.flipped = !fcState.flipped;
    card.classList.toggle('flipped', fcState.flipped);
    if (fcState.flipped) {
        document.getElementById('fcFrontPinyin').textContent = fcState.word.pinyin;
        speak(fcState.word.zh);
    }
}

// Flashcards = free practice, no Robux reward.
function fcMark(correct) {
    const fb = document.getElementById('gameFeedback');
    if (correct) {
        gameScore.correct++;
        if (fb) { fb.textContent = '✅ Nice! You knew it!'; fb.className = 'feedback correct'; }
    } else {
        gameScore.wrong++;
        if (fb) { fb.textContent = "❌ Keep practicing — you'll get it!"; fb.className = 'feedback wrong'; }
    }
    updateGameStats();
    setTimeout(nextFlashcard, 650);
}

// === 2. MATCHING ===
let matchState = { first: null, lock: false, pairs: 0, total: 0 };

function startMatching() {
    resetGameScore();
    quizWord = null; // pair-matching can't attribute a single word
    const grid = document.getElementById('matchGrid');
    grid.innerHTML = '';
    matchState = { first: null, lock: false, pairs: 0, total: 8 };
    const picks = shuffle(activeWords()).slice(0, 8);
    const cards = [];
    picks.forEach(w => {
        cards.push({ key: w.zh, text: w.zh, kind: 'zh' });
        cards.push({ key: w.zh, text: w.en, kind: 'en' });
    });
    shuffle(cards).forEach(c => {
        const el = document.createElement('div');
        el.className = 'match-card';
        el.textContent = c.text;
        el.dataset.key = c.key;
        el.dataset.kind = c.kind;
        el.onclick = () => selectMatch(el);
        grid.appendChild(el);
    });
}

function selectMatch(el) {
    if (matchState.lock || el.classList.contains('matched') || el === matchState.first) return;
    el.classList.add('selected');
    // Auto-pronounce in Mandarin when the selected card is the Chinese side
    if (el.dataset.kind === 'zh') speak(el.dataset.key);
    if (!matchState.first) { matchState.first = el; return; }
    matchState.lock = true;
    const a = matchState.first, b = el;
    if (a.dataset.key === b.dataset.key && a !== b) {
        setTimeout(() => {
            a.classList.add('matched'); b.classList.add('matched');
            a.classList.remove('selected'); b.classList.remove('selected');
            matchState.first = null; matchState.lock = false;
            matchState.pairs++;
            onAnswer(true, 'Matching');
            if (matchState.pairs >= matchState.total) {
                const bonus = award(currentDiff, 'Matching — cleared board!');
                showReward(`You matched all ${matchState.total} pairs! Bonus +${fmt(bonus)} 💰`);
            }
        }, 350);
    } else {
        setTimeout(() => {
            a.classList.remove('selected'); b.classList.remove('selected');
            matchState.first = null; matchState.lock = false;
            onAnswer(false, 'Matching');
        }, 700);
    }
}

// === 3. WORD CHOICE (see English, pick the Chinese) ===
// Tap an option = select it AND hear the Mandarin. Submit checks the answer.
let wcState = { answer: null, selected: null };

function startWordChoice() {
    resetGameScore();
    nextWordChoice();
}

function nextWordChoice() {
    const correct = pickWord();
    quizWord = correct.zh;
    wcState = { answer: correct.zh, selected: null };
    document.getElementById('wcPrompt').innerHTML =
        `What is <b style="color:var(--gold)">${escapeHtml(correct.en)}</b>?`;
    document.getElementById('wcPinyinHint').textContent = '';
    const opts = shuffle([correct, ...otherWords(correct, 3)]);
    const grid = document.getElementById('wcOptions');
    grid.innerHTML = '';
    opts.forEach(o => {
        const btn = document.createElement('button');
        btn.className = 'option-btn';
        btn.dataset.zh = o.zh;
        btn.innerHTML = `<span class="opt-zh">${escapeHtml(o.zh)}</span><span class="opt-speak" title="Listen in Mandarin">🔊</span>`;
        btn.onclick = (e) => {
            if (e.target.closest('.opt-speak')) { speak(o.zh); return; }
            selectWordChoice(btn, o.zh);
        };
        grid.appendChild(btn);
    });
    document.getElementById('wcSubmit').disabled = true;
}

function selectWordChoice(btn, zh) {
    document.querySelectorAll('#wcOptions .option-btn').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    wcState.selected = zh;
    speak(zh);
    document.getElementById('wcSubmit').disabled = false;
}

function submitWordChoice() {
    if (!wcState.selected) return;
    const buttons = document.querySelectorAll('#wcOptions .option-btn');
    buttons.forEach(b => b.disabled = true);
    document.getElementById('wcSubmit').disabled = true;
    const correct = wcState.selected === wcState.answer;
    const sel = [...buttons].find(b => b.dataset.zh === wcState.selected);
    if (sel) sel.classList.add(correct ? 'correct' : 'wrong');
    if (!correct) {
        buttons.forEach(b => { if (b.dataset.zh === wcState.answer) b.classList.add('correct'); });
    } else {
        speak(wcState.answer);
    }
    document.getElementById('wcPinyinHint').textContent = 'Pinyin: ' +
        (activeWords().find(w => w.zh === wcState.answer) || {}).pinyin;
    onAnswer(correct, 'Word Choice');
    setTimeout(nextWordChoice, 1400);
}

// === 4. LISTENING (hear the word, pick it) ===
let listenState = { answer: null };

function startListening() {
    resetGameScore();
    nextListening();
}

function nextListening() {
    const correct = pickWord();
    quizWord = correct.zh;
    listenState.answer = correct.zh;
    const opts = shuffle([correct, ...otherWords(correct, 3)]);
    const grid = document.getElementById('listeningOptions');
    grid.innerHTML = '';
    opts.forEach(o => {
        const btn = document.createElement('button');
        btn.className = 'option-btn';
        btn.textContent = o.zh;
        btn.onclick = () => answerListening(btn, o.zh);
        grid.appendChild(btn);
    });
    setTimeout(() => speak(correct.zh), 300);
}

function answerListening(btn, zh) {
    const buttons = document.querySelectorAll('#listeningOptions .option-btn');
    buttons.forEach(b => b.disabled = true);
    const correct = zh === listenState.answer;
    btn.classList.add(correct ? 'correct' : 'wrong');
    if (!correct) buttons.forEach(b => { if (b.textContent === listenState.answer) b.classList.add('correct'); });
    onAnswer(correct, 'Listening');
    setTimeout(nextListening, 1400);
}

// === 12. WRONG-WORD NOTEBOOK GAME 錯字簿 ===
// Drills the words collected by noteAnswer(). Each word has HP = its miss
// count (hearts). Correct answer = 1 damage; wrong = +1 HP. HP hits 0 →
// the word is healed (leaves the book) with a +1💰 bonus on top of the
// normal 0.5💰 reward.
let wbState = { word: null, selected: null };

function startWrongBook() {
    resetGameScore();
    nextWrongBook();
}

function nextWrongBook() {
    const b = getWrongBook();
    const keys = Object.keys(b);
    const emptyEl = document.getElementById('wbEmpty');
    const playEl = document.getElementById('wbPlay');
    if (!keys.length) {
        emptyEl.style.display = 'block';
        playEl.style.display = 'none';
        quizWord = null;
        return;
    }
    emptyEl.style.display = 'none';
    playEl.style.display = 'block';
    // weighted pick: more misses = shows up more often
    const weighted = keys.flatMap(k => Array(b[k].n).fill(k));
    const zh = weighted[Math.floor(Math.random() * weighted.length)];
    const w = allWords().find(x => x.zh === zh);
    if (!w) { delete b[zh]; saveWrongBook(b); return nextWrongBook(); }
    wbState = { word: w, selected: null };
    quizWord = zh; // wrongs here feed straight back into the book
    document.getElementById('wbTotal').textContent =
        `還有 ${keys.length} 個錯字要治好 · 全部治好有獎賞！`;
    document.getElementById('wbPrompt').innerHTML =
        `治好這個錯字 <b style="color:var(--gold)">「${escapeHtml(w.zh)}」</b> &nbsp;<button class="speak-inline" onclick="speak('${w.zh}')">🔊</button>`;
    document.getElementById('wbHearts').textContent =
        '❤️'.repeat(b[zh].n) + '🖤'.repeat(Math.max(0, 5 - b[zh].n));
    const opts = shuffle([w, ...shuffle(allWords().filter(x => x.zh !== zh)).slice(0, 3)]);
    const grid = document.getElementById('wbOptions');
    grid.innerHTML = '';
    opts.forEach(o => {
        const btn = document.createElement('button');
        btn.className = 'option-btn';
        btn.dataset.en = o.en;
        btn.textContent = o.en;
        btn.onclick = () => selectWB(btn, o.en);
        grid.appendChild(btn);
    });
    document.getElementById('wbSubmit').disabled = true;
}

function selectWB(btn, en) {
    document.querySelectorAll('#wbOptions .option-btn').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    wbState.selected = en;
    document.getElementById('wbSubmit').disabled = false;
}

function submitWB() {
    if (!wbState.selected) return;
    const buttons = document.querySelectorAll('#wbOptions .option-btn');
    buttons.forEach(b => b.disabled = true);
    document.getElementById('wbSubmit').disabled = true;
    const correct = wbState.selected === wbState.word.en;
    const sel = [...buttons].find(b => b.dataset.en === wbState.selected);
    if (sel) sel.classList.add(correct ? 'correct' : 'wrong');
    if (!correct) {
        const right = [...buttons].find(b => b.dataset.en === wbState.word.en);
        if (right) right.classList.add('correct');
    }
    onAnswer(correct, '錯字簿 Wrong Words');
    if (correct) {
        speak(wbState.word.zh);
        if (!getWrongBook()[wbState.word.zh]) {
            const bonus = awardFlat(1, `❌➜✅ 治好錯字: ${wbState.word.zh}`);
            const fb = document.getElementById('gameFeedback');
            if (fb) { fb.textContent = `🎉 治好了「${wbState.word.zh}」! +${fmt(bonus)} 💰`; fb.className = 'feedback correct'; }
        }
    }
    setTimeout(nextWrongBook, 1600);
}
