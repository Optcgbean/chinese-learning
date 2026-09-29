// === GAME ENGINE — part 2: scramble, fill blank, BOSS BATTLE ===

// === 5. WORD SCRAMBLE ===
let scState = { answer: '', given: '' };

function startScramble() {
    resetGameScore();
    nextScramble();
}

function nextScramble() {
    const w = pickWord();
    scState.answer = w.zh;
    // scramble characters; ensure it's not identical to the answer
    let s;
    do { s = shuffle(Array.from(w.zh)).join(''); } while (s === w.zh && w.zh.length > 1);
    scState.given = s;
    document.getElementById('scrambleDisplay').textContent = s.split('').join(' ');
    document.getElementById('scrambleHint').textContent = `English: ${w.en}  ·  Pinyin: ${w.pinyin}`;
    document.getElementById('scrambleInput').value = '';
    document.getElementById('scrambleInput').focus();
}

function checkScramble() {
    const val = document.getElementById('scrambleInput').value.trim();
    if (!val) return;
    const correct = val === scState.answer;
    onAnswer(correct, 'Word Scramble');
    if (correct) speak(scState.answer);
    setTimeout(nextScramble, 900);
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

let fbState = { blank: '', bank: [], template: null };

function startFillBlank() {
    resetGameScore();
    nextFillBlank();
}

function nextFillBlank() {
    const t = blankTemplates[Math.floor(Math.random() * blankTemplates.length)];
    fbState.blank = t.blank;
    fbState.template = t;
    document.getElementById('fbSentence').innerHTML = escapeHtml(t.zh).replace('__', '<span class="blank">?</span>');
    document.getElementById('fbEnglish').textContent = t.en;
    const distractors = shuffle(Array.from(new Set(activeWords().map(w => w.zh))))
        .filter(z => z !== t.blank).slice(0, 3);
    fbState.bank = shuffle([t.blank, ...distractors]);
    const bankEl = document.getElementById('fbBank');
    bankEl.innerHTML = '';
    fbState.bank.forEach(z => {
        const chip = document.createElement('button');
        chip.className = 'word-chip';
        chip.textContent = z;
        chip.onclick = () => answerFillBlank(chip, z);
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

function answerFillBlank(chip, z) {
    const chips = document.querySelectorAll('#fbBank .word-chip');
    chips.forEach(c => c.style.pointerEvents = 'none');
    const correct = z === fbState.blank;
    chip.style.borderColor = correct ? '#22c55e' : '#ef4444';
    if (!correct) chips.forEach(c => { if (c.textContent === fbState.blank) c.style.borderColor = '#22c55e'; });
    document.getElementById('fbSentence').innerHTML =
        document.getElementById('fbSentence').innerHTML.replace('<span class="blank">?</span>', `<b style="color:var(--gold)">${fbState.blank}</b>`);
    if (correct) speak(fbState.blank);
    onAnswer(correct, 'Fill the Blank');
    setTimeout(nextFillBlank, 1400);
}

// === 7. BOSS BATTLE 👹 ===
// Insane-demon rules: 5x Robux multiplier, 10-second timer per question,
// wrong answer = boss hits YOU. Beat the boss before your HP hits 0.
const BOSS_HP = 10;
const PLAYER_HP = 5;
const BOSS_TIME = 10;

let bossState = null;
let bossTimerId = null;

const bosses = [
    { name: '字怪獸 Word Monster', sprite: '👹', hp: BOSS_HP },
    { name: '筆順魔王 Stroke Demon', sprite: '👺', hp: BOSS_HP + 3 },
    { name: '考試大蛇 Exam Serpent', sprite: '🐉', hp: BOSS_HP + 6 }
];

function startBossBattle() {
    resetGameScore();
    const boss = bosses[Math.floor(Math.random() * bosses.length)];
    bossState = {
        boss, bossHp: boss.hp, playerHp: PLAYER_HP,
        q: null, timeLeft: BOSS_TIME
    };
    document.getElementById('bossSprite').textContent = boss.sprite;
    document.getElementById('bossName').textContent = boss.name;
    setDifficulty('boss');
    renderBossBars();
    nextBossQuestion();
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
    document.getElementById('bossQuestion').textContent = correct.zh;
    speak(correct.zh);
    const opts = shuffle([correct, ...otherWords(correct, 3)]);
    const grid = document.getElementById('bossOptions');
    grid.innerHTML = '';
    opts.forEach(o => {
        const btn = document.createElement('button');
        btn.className = 'option-btn';
        btn.textContent = o.en;
        btn.onclick = () => answerBoss(btn, o.en);
        grid.appendChild(btn);
    });
    startBossTimer();
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
    const buttons = document.querySelectorAll('#bossOptions .option-btn');
    buttons.forEach(b => b.disabled = true);
    const correct = en === bossState.q.en;
    if (btn) btn.classList.add(correct ? 'correct' : 'wrong');
    if (!correct) {
        buttons.forEach(b => { if (b.textContent === bossState.q.en) b.classList.add('correct'); });
    }
    if (correct) {
        bossState.bossHp--;
        bumpStreak();
        const amt = award('boss', `Hit on ${bossState.boss.name}!`);
        gameScore.correct++;
        flashBossHit(false);
        const fb = document.getElementById('gameFeedback');
        if (fb) { fb.textContent = `⚔️ Critical hit! +${fmt(amt)} Robux`; fb.className = 'feedback correct'; }
    } else {
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

function flashBossHit(playerHurt) {
    const sprite = document.getElementById('bossSprite');
    sprite.style.transform = playerHurt ? 'translateX(0)' : '';
    sprite.style.filter = playerHurt ? 'none' : 'brightness(2) saturate(0)';
    setTimeout(() => { sprite.style.filter = ''; }, 250);
}

function bossEndCheck() {
    if (!bossState) return;
    if (bossState.bossHp <= 0) {
        // Victory! Big bonus on top of per-hit rewards.
        const bonus = award('boss', `🏆 BOSS DEFEATED: ${bossState.boss.name}`);
        showReward(`You defeated ${bossState.boss.name}! Victory bonus +${fmt(bonus)} 💰`);
        bossState = null;
    } else if (bossState.playerHp <= 0) {
        showReward(`${bossState.boss.name} was too strong this time... Train up and challenge it again!`);
        bossState = null;
    } else {
        nextBossQuestion();
    }
}
