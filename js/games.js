// === GAME ENGINE — part 1: flashcards, matching, word choice ===

let currentSet = 'assessment';
let currentDiff = 'normal';
let gameScore = { correct: 0, wrong: 0 };

function setDifficulty(d) {
    currentDiff = d;
    document.querySelectorAll('.diff-btn').forEach(b => b.classList.toggle('active', b.dataset.diff === d));
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

// Generic result handler: awards on correct, breaks combo on wrong.
function onAnswer(isCorrect, reason) {
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
let wcState = { answer: null };

function startWordChoice() {
    resetGameScore();
    nextWordChoice();
}

function nextWordChoice() {
    const correct = pickWord();
    wcState.answer = correct.zh;
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
            answerWordChoice(btn, o.zh);
        };
        grid.appendChild(btn);
    });
}

function answerWordChoice(btn, zh) {
    const buttons = document.querySelectorAll('#wcOptions .option-btn');
    buttons.forEach(b => b.disabled = true);
    const correct = zh === wcState.answer;
    btn.classList.add(correct ? 'correct' : 'wrong');
    if (!correct) {
        buttons.forEach(b => { if (b.dataset.zh === wcState.answer) b.classList.add('correct'); });
    } else {
        speak(wcState.answer);
    }
    document.getElementById('wcPinyinHint').textContent = 'Pinyin: ' +
        (activeWords().find(w => w.zh === wcState.answer) || {}).pinyin;
    onAnswer(correct, 'Word Choice');    setTimeout(nextWordChoice, 1200);
}

// === 4. LISTENING (hear the word, pick it) ===
let listenState = { answer: null };

function startListening() {
    resetGameScore();
    nextListening();
}

function nextListening() {
    const correct = pickWord();
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
