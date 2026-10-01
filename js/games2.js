// === GAME ENGINE — part 2: scramble, fill blank, BOSS BATTLE ===

// === 5. WORD SCRAMBLE (tap the tiles in the correct order) ===
let scState = { answer: '', tiles: [], build: [] };

function startScramble() {
    resetGameScore();
    nextScramble();
}

function nextScramble() {
    const w = pickWord();
    scState.answer = w.zh;
    quizWord = w.zh;
    // scramble characters (per-instance ids so 翼翼 works); never identical to the answer
    let s;
    do { s = shuffle(Array.from(w.zh).map((ch, i) => ({ ch, id: i, used: false }))); }
    while (s.map(t => t.ch).join('') === w.zh && w.zh.length > 1);
    scState.tiles = s;
    scState.build = [];
    document.getElementById('scrambleHint').textContent = `English: ${w.en}  ·  Pinyin: ${w.pinyin}`;
    renderScramble();
}

function renderScramble() {
    const build = document.getElementById('scrambleBuild');
    const bank = document.getElementById('scrambleTiles');
    build.innerHTML = '';
    bank.innerHTML = '';
    scState.build.forEach(t => {
        const b = document.createElement('button');
        b.className = 'tile in-build';
        b.textContent = t.ch;
        b.onclick = () => { t.used = false; scState.build = scState.build.filter(x => x !== t); renderScramble(); };
        build.appendChild(b);
    });
    scState.tiles.forEach(t => {
        const b = document.createElement('button');
        b.className = 'tile' + (t.used ? ' used' : '');
        b.textContent = t.ch;
        if (!t.used) b.onclick = () => { t.used = true; scState.build.push(t); renderScramble(); };
        bank.appendChild(b);
    });
    // auto-submit once every tile is placed
    if (scState.build.length === scState.tiles.length && scState.tiles.length > 0) {
        setTimeout(checkScramble, 350);
    }
}

function checkScramble() {
    const val = scState.build.map(t => t.ch).join('');
    if (val.length !== scState.answer.length) return;
    const correct = val === scState.answer;
    onAnswer(correct, 'Word Scramble');
    if (correct) {
        speak(scState.answer);
        setTimeout(nextScramble, 1100);
    } else {
        // wrong: brief pause, then tiles bounce back
        setTimeout(() => { scState.tiles.forEach(t => t.used = false); scState.build = []; renderScramble(); }, 650);
    }
}

// === 6. FILL IN THE BLANK ===
const blankTemplates = [
    { zh: '我__去學校。', en: 'I go to school.', blank: '去' },
    { zh: '我愛我的__。', en: 'I love my family.', blank: '家' },
    { zh: '這是我的__。', en: 'This is my book.', blank: '書' },
    { zh: '老師在__課。', en: 'The teacher is teaching class.', blank: '教' },
    { zh: '我__吃飯。', en: 'I want to eat rice.', blank: '要' },
    { zh: '今天天__很好。', en: 'The weather is nice today.', blank: '氣' },
    { zh: '我有一__狗。', en: 'I have a dog.', blank: '隻' },
    { zh: '我們一起__。', en: 'We play together.', blank: '玩' },
    { zh: '__上好。', en: 'Good morning.', blank: '早' },
    { zh: '__謝你。', en: 'Thank you.', blank: '謝' }
];

let fbState = { blank: '', bank: [], template: null, selected: null };

function startFillBlank() {
    resetGameScore();
    nextFillBlank();
}

function nextFillBlank() {
    // exam-prep focus: only the workbook's example sentences, and distractors
    // come only from the assessment vocab set
    const t = assessFills[Math.floor(Math.random() * assessFills.length)];
    quizWord = t.blank;
    fbState.blank = t.blank;
    fbState.template = t;
    fbState.selected = null;
    document.getElementById('fbSubmit').disabled = true;
    document.getElementById('fbSentence').innerHTML = escapeHtml(t.zh).replace('__', '<span class="blank">?</span>');
    document.getElementById('fbEnglish').textContent = t.en;
    const setZh = (wordSets.assessment || []).map(w => w.zh);
    const sameLen = shuffle(setZh.filter(z => z !== t.blank && z.length === t.blank.length));
    const otherLen = shuffle(setZh.filter(z => z !== t.blank && z.length !== t.blank.length));
    fbState.bank = shuffle(sameLen.concat(otherLen).slice(0, 3).concat(t.blank));
    const bankEl = document.getElementById('fbBank');
    bankEl.innerHTML = '';
    fbState.bank.forEach(z => {
        const chip = document.createElement('button');
        chip.className = 'word-chip';
        chip.textContent = z;
        chip.onclick = () => selectFillBlank(chip, z);
        bankEl.appendChild(chip);
    });
}

function speakFBQuestion() {
    const t = fbState.template;
    if (!t || !window.speechSynthesis) return;
    speechSynthesis.cancel();
    const parts = t.zh.split('__');
    const v = pickVoice();
    const mk = (txt) => {
        const u = new SpeechSynthesisUtterance(txt);
        u.lang = 'zh-CN';
        if (v) u.voice = v;
        u.rate = 0.8;
        return u;
    };
    const u1 = mk(parts[0]);
    if (parts[1]) u1.onend = () => setTimeout(() => speechSynthesis.speak(mk(parts[1])), 500);
    speechSynthesis.speak(u1);
}

function speakFBAnswer() {
    if (fbState.blank) speak(fbState.blank);
}

// Tap a chip = select it AND hear the pronunciation. Submit checks.
function selectFillBlank(chip, z) {
    document.querySelectorAll('#fbBank .word-chip').forEach(c => c.classList.remove('selected'));
    chip.classList.add('selected');
    fbState.selected = z;
    speak(z);
    document.getElementById('fbSubmit').disabled = false;
}

function submitFillBlank() {
    if (!fbState.selected) return;
    const chips = document.querySelectorAll('#fbBank .word-chip');
    chips.forEach(c => { c.style.pointerEvents = 'none'; c.classList.remove('selected'); });
    document.getElementById('fbSubmit').disabled = true;
    const correct = fbState.selected === fbState.blank;
    const sel = [...chips].find(c => c.textContent === fbState.selected);
    if (sel) sel.style.borderColor = correct ? '#22c55e' : '#ef4444';
    if (!correct) chips.forEach(c => { if (c.textContent === fbState.blank) c.style.borderColor = '#22c55e'; });
    document.getElementById('fbSentence').innerHTML =
        document.getElementById('fbSentence').innerHTML.replace('<span class="blank">?</span>', `<b style="color:var(--gold)">${fbState.blank}</b>`);
    if (correct) speak(fbState.blank);
    onAnswer(correct, 'Fill the Blank');
    setTimeout(nextFillBlank, 1400);
}

// === 7. BOSS BATTLE 👹 ===
// One of 4 villains appears at random. 10-second timer per question,
// wrong answer (or timeout) = boss hits YOU for 1 HP.
// Hits deal 1 damage; every 5th consecutive correct answer is a SUPER ATTACK
// critical hit for 2 damage (then back to normal).
// No per-hit Robux: WIN = 5 Robux, FLAWLESS win (full HP) = 10 Robux.
const BOSS_HP = 10;
const PLAYER_HP = 5;
const BOSS_TIME = 10;
const CRIT_STREAK = 5;
const BOSS_REWARD = 5;
const BOSS_REWARD_FLAWLESS = 10;

let bossState = null;
let bossTimerId = null;

const bosses = [
    { name: 'The Prototype', img: 'assets/bosses/prototype.jpg', hp: BOSS_HP },
    { name: 'Piggy', img: 'assets/bosses/piggy.jpg', hp: BOSS_HP },
    { name: 'Nightmare Huggy', img: 'assets/bosses/huggy.jpg', hp: BOSS_HP },
    { name: 'Captain Clark', img: 'assets/bosses/clark.jpg', hp: BOSS_HP },
    { name: 'Headhunter', img: 'assets/bosses/headhunter.jpg', hp: BOSS_HP },
    { name: 'El Gran Maja', img: 'assets/bosses/elgranmaja.jpg', hp: BOSS_HP }
];

function startBossBattle() {
    resetGameScore();
    const boss = bosses[Math.floor(Math.random() * bosses.length)];
    bossState = {
        boss, bossHp: boss.hp, playerHp: PLAYER_HP,
        q: null, timeLeft: BOSS_TIME, selected: null, hitStreak: 0
    };
    const img = document.getElementById('bossImg');
    img.src = boss.img;
    img.alt = boss.name;
    document.getElementById('bossName').textContent = boss.name;
    setDifficulty('boss');
    renderBossBars();
    renderBossStreak();
    nextBossQuestion();
}

function renderBossStreak() {
    const el = document.getElementById('bossStreak');
    if (!el) return;
    const n = bossState ? bossState.hitStreak : 0;
    el.textContent = n > 0 ? `⚡ Super attack in ${CRIT_STREAK - n} more!` : '';
}

function renderBossBars() {
    document.getElementById('bossHpFill').style.width = (bossState.bossHp / bossState.boss.hp * 100) + '%';
    document.getElementById('playerHpFill').style.width = (bossState.playerHp / PLAYER_HP * 100) + '%';
    document.getElementById('bossHpText').textContent = `${bossState.bossHp} / ${bossState.boss.hp}`;
    document.getElementById('playerHpText').textContent = `${bossState.playerHp} / ${PLAYER_HP}`;
}

function nextBossQuestion() {
    if (!bossState || bossState.bossHp <= 0 || bossState.playerHp <= 0) return;
    const correct = pickWord();
    bossState.q = correct;
    bossState.selected = null;
    document.getElementById('bossSubmit').disabled = true;
    document.getElementById('bossQuestion').textContent = correct.zh;
    speak(correct.zh);
    const opts = shuffle([correct, ...otherWords(correct, 3)]);
    const grid = document.getElementById('bossOptions');
    grid.innerHTML = '';
    opts.forEach(o => {
        const btn = document.createElement('button');
        btn.className = 'option-btn';
        btn.dataset.en = o.en;
        btn.textContent = o.en;
        btn.onclick = () => selectBoss(btn, o.en);
        grid.appendChild(btn);
    });
    startBossTimer();
}

// tap = choose your attack answer; Submit (Attack) confirms it
function selectBoss(btn, en) {
    if (!bossState) return;
    document.querySelectorAll('#bossOptions .option-btn').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    bossState.selected = en;
    document.getElementById('bossSubmit').disabled = false;
}

function submitBoss() {
    if (!bossState || !bossState.selected) return;
    const sel = [...document.querySelectorAll('#bossOptions .option-btn')]
        .find(b => b.dataset.en === bossState.selected);
    answerBoss(sel || null, bossState.selected);
}

function speakBossWord() {
    if (bossState && bossState.q) speak(bossState.q.zh);
}

function startBossTimer() {
    clearInterval(bossTimerId);
    bossState.timeLeft = BOSS_TIME;
    const el = document.getElementById('bossTimer');
    el.textContent = `⏱️ ${bossState.timeLeft}s`;
    bossTimerId = setInterval(() => {
        bossState.timeLeft--;
        el.textContent = `⏱️ ${bossState.timeLeft}s`;
        if (bossState.timeLeft <= 3) el.style.color = '#ef4444';
        else el.style.color = '';
        if (bossState.timeLeft <= 0) {
            clearInterval(bossTimerId);
            answerBoss(null, null); // timeout = miss
        }
    }, 1000);
}

function answerBoss(btn, en) {
    clearInterval(bossTimerId);
    if (bossState) bossState.selected = null;
    const submitBtn = document.getElementById('bossSubmit');
    if (submitBtn) submitBtn.disabled = true;
    const buttons = document.querySelectorAll('#bossOptions .option-btn');
    buttons.forEach(b => b.disabled = true);
    const correct = en === bossState.q.en;
    if (btn) btn.classList.add(correct ? 'correct' : 'wrong');
    if (!correct) {
        buttons.forEach(b => { if (b.textContent === bossState.q.en) b.classList.add('correct'); });
    }
    if (correct) {
        bossState.hitStreak++;
        bumpStreak();
        gameScore.correct++;
        let dmg = 1, crit = false;
        if (bossState.hitStreak >= CRIT_STREAK) {
            dmg = 2;
            crit = true;
            bossState.hitStreak = 0; // super attack, then back to normal
        }
        bossState.bossHp -= dmg;
        renderBossStreak();
        flashBossHit(false, crit);
        const fb = document.getElementById('gameFeedback');
        if (fb) {
            fb.textContent = crit
                ? `⚡ SUPER ATTACK! Critical hit — ${dmg} damage!`
                : `⚔️ Hit! ${dmg} damage — beat the boss for ${BOSS_REWARD}💰!`;
            fb.className = 'feedback correct';
        }
    } else {
        bossState.hitStreak = 0;
        renderBossStreak();
        bossState.playerHp--;
        breakStreak();
        gameScore.wrong++;
        flashBossHit(true);
        const fb = document.getElementById('gameFeedback');
        if (fb) {
            fb.textContent = en === null ? `⏰ Too slow! ${bossState.boss.name} hit you!` : `💥 ${bossState.boss.name} hit you!`;
            fb.className = 'feedback wrong';
        }
    }
    renderBossBars();
    updateGameStats();
    setTimeout(() => bossEndCheck(), 900);
}

function flashBossHit(playerHurt, crit) {
    const img = document.getElementById('bossImg');
    img.style.transform = playerHurt ? 'translateX(0)' : (crit ? 'rotate(-8deg) scale(1.15)' : 'scale(1.05)');
    img.style.filter = playerHurt ? 'none' : (crit ? 'brightness(2.2) hue-rotate(-40deg)' : 'brightness(1.8) saturate(0)');
    setTimeout(() => { img.style.filter = ''; img.style.transform = ''; }, 300);
}

function bossEndCheck() {
    if (!bossState) return;
    if (bossState.bossHp <= 0) {
        // Victory pays out: 5 Robux, or 10 if you never got hit (full HP).
        const flawless = bossState.playerHp === PLAYER_HP;
        const reward = flawless ? BOSS_REWARD_FLAWLESS : BOSS_REWARD;
        const amt = awardFlat(reward, `🏆 BOSS DEFEATED: ${bossState.boss.name}${flawless ? ' — FLAWLESS!' : ''}`);
        showReward(flawless
            ? `🏆 FLAWLESS! You beat ${bossState.boss.name} at full HP! +${fmt(amt)} Robux`
            : `You defeated ${bossState.boss.name}! +${fmt(amt)} Robux`);
        bossState = null;
    } else if (bossState.playerHp <= 0) {
        showReward(`${bossState.boss.name} was too strong this time... No Robux. Win a fight for ${BOSS_REWARD}💰 — flawless for ${BOSS_REWARD_FLAWLESS}💰!`);
        bossState = null;
    } else {
        nextBossQuestion();
    }
}

// === 8. SENTENCE BUILDER 造句 ===
// A target word + meaning is shown. Listen to the model sentence, then tap
// the word-chunk tiles to rebuild the sentence in order (auto-checks when full).
let sbState = { target: null, tiles: [], build: [] };

function startSentenceBuilder() {
    resetGameScore();
    nextSentenceBuilder();
}

function nextSentenceBuilder() {
    const s = sentenceBuilders[Math.floor(Math.random() * sentenceBuilders.length)];
    sbState.target = s;
    quizWord = s.zh;
    let arr;
    do {
        arr = shuffle(s.chunks.map((t, i) => ({ t, id: i, used: false })));
    } while (arr.map(x => x.t).join('') === s.chunks.join('') && s.chunks.length > 1);
    sbState.tiles = arr;
    sbState.build = [];
    document.getElementById('sbPrompt').innerHTML =
        `用 <b style="color:var(--gold)">「${escapeHtml(s.zh)}」</b> 造句`;
    document.getElementById('sbMeaning').textContent = `${s.pinyin} — ${s.meaning}`;
    document.getElementById('sbEnglish').textContent = '';
    renderSB();
}

function renderSB() {
    const build = document.getElementById('sbBuild');
    const bank = document.getElementById('sbTiles');
    build.innerHTML = '';
    bank.innerHTML = '';
    sbState.build.forEach(t => {
        const b = document.createElement('button');
        b.className = 'tile sentence in-build';
        b.textContent = t.t;
        b.onclick = () => { t.used = false; sbState.build = sbState.build.filter(x => x !== t); renderSB(); };
        build.appendChild(b);
    });
    sbState.tiles.forEach(t => {
        const b = document.createElement('button');
        b.className = 'tile sentence' + (t.used ? ' used' : '');
        b.textContent = t.t;
        if (!t.used) b.onclick = () => { t.used = true; sbState.build.push(t); renderSB(); };
        bank.appendChild(b);
    });
    if (sbState.build.length === sbState.tiles.length && sbState.tiles.length > 0) {
        setTimeout(checkSB, 350);
    }
}

function checkSB() {
    const val = sbState.build.map(t => t.t).join('');
    const answer = sbState.target.chunks.join('');
    if (val.length !== answer.length) return;
    const correct = val === answer;
    onAnswer(correct, '造句 Sentence Builder');
    if (correct) {
        speak(answer);
        document.getElementById('sbEnglish').textContent = sbState.target.en;
        setTimeout(nextSentenceBuilder, 1800);
    } else {
        setTimeout(() => { sbState.tiles.forEach(t => t.used = false); sbState.build = []; renderSB(); }, 700);
    }
}

function speakSBWord() {
    if (sbState.target) speak(sbState.target.zh);
}

function speakSBSentence() {
    if (sbState.target) speak(sbState.target.chunks.join(''));
}

// === 9. DICTATION 默寫 (hear the word, build it from characters + distractors) ===
let dcState = { answer: '', tiles: [], build: [], attempts: 0 };

function startDictation() {
    resetGameScore();
    nextDictation();
}

function nextDictation() {
    const w = pickWord();
    dcState.answer = w.zh;
    quizWord = w.zh;
    dcState.build = [];
    dcState.attempts = 0;
    // distractor chars: from OTHER words in the active set, never from the target
    const targetChars = Array.from(new Set(Array.from(w.zh)));
    const pool = Array.from(new Set(
        activeWords().filter(x => x.zh !== w.zh).flatMap(x => Array.from(x.zh))
    )).filter(c => !targetChars.includes(c));
    const n = Array.from(w.zh).length;
    const distract = shuffle(pool).slice(0, Math.min(n, pool.length));
    let s = shuffle(Array.from(w.zh).map((ch, i) => ({ ch, id: i, used: false }))
        .concat(distract.map((ch, i) => ({ ch, id: 100 + i, used: false }))));
    dcState.tiles = s;
    document.getElementById('dictHint').textContent = '👂 聽一聽，用字卡砌出詞語 Listen and build the word';
    document.getElementById('dictHint').classList.remove('hint-on');
    renderDict();
    speak(w.zh);
}

function renderDict() {
    const build = document.getElementById('dictBuild');
    const bank = document.getElementById('dictTiles');
    build.innerHTML = '';
    bank.innerHTML = '';
    dcState.build.forEach(t => {
        const b = document.createElement('button');
        b.className = 'tile in-build';
        b.textContent = t.ch;
        b.onclick = () => { t.used = false; dcState.build = dcState.build.filter(x => x !== t); renderDict(); };
        build.appendChild(b);
    });
    dcState.tiles.forEach(t => {
        const b = document.createElement('button');
        b.className = 'tile' + (t.used ? ' used' : '');
        b.textContent = t.ch;
        if (!t.used) b.onclick = () => {
            t.used = true; dcState.build.push(t); renderDict();
        };
        bank.appendChild(b);
    });
    // auto-check as soon as the build reaches the word length
    if (dcState.build.length === Array.from(dcState.answer).length) {
        setTimeout(checkDict, 350);
    }
}

function checkDict() {
    const val = dcState.build.map(t => t.ch).join('');
    if (val.length !== Array.from(dcState.answer).length) return;
    const correct = val === dcState.answer;
    if (correct) {
        if (dcState.attempts === 0) {
            onAnswer(true, '默寫 Dictation'); // full reward + streak
        } else {
            // retry after hint: half reward, no streak bump
            awardFlat(0.25, `默寫 retry: ${dcState.answer}`);
            const fb = document.getElementById('gameFeedback');
            if (fb) { fb.textContent = '✅ Correct! +0.25 💰 (hint was on)'; fb.className = 'feedback correct'; }
            gameScore.correct++;
        }
        speak(dcState.answer);
        setTimeout(nextDictation, 1400);
    } else {
        if (dcState.attempts === 0) {
            onAnswer(false, '默寫 Dictation');
            // first miss: reveal English + pinyin as a scaffold
            const w = activeWords().find(x => x.zh === dcState.answer);
            const hint = document.getElementById('dictHint');
            hint.textContent = `💡 ${w ? `${w.en} · ${w.pinyin}` : ''} — 再試一次!`;
            hint.classList.add('hint-on');
            dcState.attempts = 1;
        }
        setTimeout(() => { dcState.tiles.forEach(t => t.used = false); dcState.build = []; renderDict(); }, 650);
    }
}

function speakDictWord() {
    if (dcState.answer) speak(dcState.answer);
}
