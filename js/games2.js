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
    { name: 'El Gran Maja', img: 'assets/bosses/elgranmaja.jpg', hp: BOSS_HP },
    { name: 'Candle Brute', img: 'assets/bosses/candlebrute.jpg', hp: BOSS_HP },
    { name: 'Mothza Supreme', img: 'assets/bosses/mothza.jpg', hp: BOSS_HP },
    { name: 'The Caroler', img: 'assets/bosses/caroler.jpg', hp: BOSS_HP }
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

// === 7b. 聽寫魔王 DICTATION BOSS ===
// Same bosses, same HP economy as BOSS BATTLE — but you attack by BUILDING
// the word the boss shouts: hear the Mandarin, tap character tiles in order.
// The tile bank deliberately includes homophone confusables (同音字) so every
// wrong pick is a teaching moment. The boss's FIRST attack each fight comes
// straight from the 錯字簿 (yesterday's misses come back for revenge).
const DB_TIME = 12;
let dbState = null;
let dbTimerId = null;
let dbCharSyl = null; // lazy char -> toneless syllable map

// 微教學 one-liners shown when a confusable pair is missed
const dictTips = {
    '辛': '「辛」= 辛苦、辛勞（勞碌）',
    '心': '「心」= 心臟（身體器官）',
    '惱': '「惱」= 苦惱（唔開心）',
    '腦': '「腦」= 腦筋（諗嘢嘅器官）',
    '筋': '「筋」= 肌肉（筋疲力盡）',
    '盡': '「盡」= 完（用盡）',
    '力': '「力」= 力量',
    '利': '「利」= 勝利（贏）',
    '離': '「離」= 離開',
    '手': '「手」= 對手仔',
    '守': '「守」= 守住（守株待兔）',
    '憂': '「憂」= 憂心（擔心）',
    '遊': '「遊」= 遊玩（遊手好閒）',
    '油': '「油」= 食油',
    '免': '「免」= 避免（唔使）',
    '麵': '「麵」= 麵條（食物）',
    '勝': '「勝」= 勝利',
    '聲': '「聲」= 聲音',
    '命': '「命」= 生命',
    '明': '「明」= 明日',
    '小': '「小」= 大小',
    '笑': '「笑」= 笑容',
    '校': '「校」= 學校',
    '透': '「透」= 穿過（傷透）',
    '頭': '「頭」= 頭部',
    '破': '「破」= 破壞',
    '婆': '「婆」= 老婆婆',
    '苦': '「苦」= 辛苦',
    '哭': '「哭」= 喊',
    '避': '「避」= 避免（閃開）',
    '筆': '「筆」= 鉛筆',
    '後': '「後」= 前後',
    '猴': '「猴」= 猴子',
    '蛙': '「蛙」= 青蛙（动物，虫字部）',
    '娃': '「娃」= 女娃（女字部）',
    '挖': '「挖」= 挖掘（用手）',
    '兔': '「兔」= 兔子（記住尾巴嗰一點）',
    '先': '「先」= 先後',
    '閒': '「閒」= 得閒（遊手好閒）',
    '何': '「何」= 任何',
    '喝': '「喝」= 喝水',
    '漸': '「漸」= 漸漸（慢慢）',
    '剪': '「剪」= 剪刀',
    '間': '「間」= 時間',
    '翼': '「翼」= 翼（小心翼翼）',
    '依': '「依」= 依靠',
    '蟻': '「蟻」= 螞蟻',
    '不': '「不」= 唔',
    '簿': '「簿」= 簿仔',
    '補': '「補」= 補救（亡羊補牢）'
};

function dbSyllables(py) {
    return (String(py || '').normalize('NFD').replace(/[̀-ͯ]/g, '')
        .toLowerCase().match(/[a-z]+/g) || []);
}

function dbBuildCharMap() {
    const map = {};
    allWords().forEach(w => {
        const syls = dbSyllables(w.pinyin);
        const chars = [...w.zh];
        if (syls.length === chars.length) {
            chars.forEach((c, i) => { if (!map[c]) map[c] = syls[i]; });
        }
    });
    return map;
}

function dbMakeBank(word) {
    if (!dbCharSyl) dbCharSyl = dbBuildCharMap();
    const chars = [...word];
    const pool = [];
    chars.forEach(c => {
        const syl = dbCharSyl[c];
        if (!syl) return;
        const mates = Object.keys(dbCharSyl).filter(k =>
            k !== c && dbCharSyl[k] === syl && !chars.includes(k) && !pool.includes(k));
        shuffle(mates).slice(0, 2).forEach(m => pool.push(m));
    });
    const extra = shuffle(allWords().flatMap(w => [...w.zh])
        .filter(c => !chars.includes(c) && !pool.includes(c)));
    while (pool.length < chars.length + 4 && extra.length) pool.push(extra.pop());
    return shuffle([...chars, ...pool]).map((t, i) => ({ t, id: i, used: false }));
}

// The first attack of every fight raids the 錯字簿 (spaced repetition)
function dbPickWord(isFirst) {
    if (isFirst) {
        const b = getWrongBook();
        const keys = Object.keys(b);
        if (keys.length) {
            const weighted = keys.flatMap(k => Array(Math.max(1, b[k].n)).fill(k));
            const zh = weighted[Math.floor(Math.random() * weighted.length)];
            const w = allWords().find(x => x.zh === zh);
            if (w) return w;
        }
    }
    return pickWord();
}

function startDictBoss() {
    resetGameScore();
    const boss = bosses[Math.floor(Math.random() * bosses.length)];
    dbState = {
        boss, bossHp: boss.hp, playerHp: PLAYER_HP,
        q: null, build: [], tiles: [], hitStreak: 0, timeLeft: DB_TIME, round: 0
    };
    const img = document.getElementById('dbBossImg');
    img.src = boss.img;
    img.alt = boss.name;
    document.getElementById('dbBossName').textContent = boss.name;
    document.getElementById('dbStreak').textContent = '';
    document.getElementById('dbTip').textContent = '';
    renderDbBars();
    nextDbQuestion();
}

function renderDbBars() {
    document.getElementById('dbBossHpFill').style.width = (dbState.bossHp / dbState.boss.hp * 100) + '%';
    document.getElementById('dbPlayerHpFill').style.width = (dbState.playerHp / PLAYER_HP * 100) + '%';
    document.getElementById('dbBossHpText').textContent = `${dbState.bossHp} / ${dbState.boss.hp}`;
    document.getElementById('dbPlayerHpText').textContent = `${dbState.playerHp} / ${PLAYER_HP}`;
}

function nextDbQuestion() {
    if (!dbState || dbState.bossHp <= 0 || dbState.playerHp <= 0) return;
    dbState.round++;
    const w = dbPickWord(dbState.round === 1);
    dbState.q = w;
    dbState.build = [];
    quizWord = w.zh; // builds/wrong picks feed the 錯字簿
    document.getElementById('dbAttack').disabled = true;
    document.getElementById('dbTip').textContent = '';
    document.getElementById('dbPrompt').innerHTML = '聽清楚，砌返出嚟！Build the word you hear!';
    dbState.tiles = dbMakeBank(w.zh);
    renderDbTiles();
    setTimeout(() => { if (dbState && dbState.q === w) speak(w.zh); }, 400);
    startDbTimer();
}

function renderDbTiles() {
    const build = document.getElementById('dbBuild');
    const bank = document.getElementById('dbBank');
    build.innerHTML = '';
    bank.innerHTML = '';
    dbState.build.forEach(t => {
        const b = document.createElement('button');
        b.className = 'tile in-build';
        b.style.fontSize = '1.5rem';
        b.textContent = t.t;
        b.onclick = () => { t.used = false; dbState.build = dbState.build.filter(x => x !== t); renderDbTiles(); };
        build.appendChild(b);
    });
    for (let i = dbState.build.length; i < dbState.q.zh.length; i++) {
        const ph = document.createElement('div');
        ph.className = 'tile';
        ph.style.fontSize = '1.5rem';
        ph.style.opacity = '0.25';
        ph.textContent = '？';
        build.appendChild(ph);
    }
    dbState.tiles.forEach(t => {
        const b = document.createElement('button');
        b.className = 'tile' + (t.used ? ' used' : '');
        b.style.fontSize = '1.5rem';
        b.textContent = t.t;
        if (!t.used) b.onclick = () => {
            t.used = true;
            dbState.build.push(t);
            renderDbTiles();
        };
        bank.appendChild(b);
    });
    document.getElementById('dbAttack').disabled =
        dbState.build.length !== dbState.q.zh.length;
}

function speakDbWord() {
    if (dbState && dbState.q) speak(dbState.q.zh);
}

function startDbTimer() {
    clearInterval(dbTimerId);
    dbState.timeLeft = DB_TIME;
    const el = document.getElementById('dbTimer');
    el.textContent = `⏱️ ${dbState.timeLeft}s`;
    el.style.color = '';
    dbTimerId = setInterval(() => {
        dbState.timeLeft--;
        el.textContent = `⏱️ ${dbState.timeLeft}s`;
        if (dbState.timeLeft <= 3) el.style.color = '#ef4444';
        if (dbState.timeLeft <= 0) {
            clearInterval(dbTimerId);
            resolveDb(false, true);
        }
    }, 1000);
}

function submitDb() {
    if (!dbState || dbState.build.length !== dbState.q.zh.length) return;
    const attempt = dbState.build.map(t => t.t).join('');
    resolveDb(attempt === dbState.q.zh, false, attempt);
}

function dbFlash(playerHurt, crit) {
    const img = document.getElementById('dbBossImg');
    img.style.transform = playerHurt ? 'translateX(0)' : (crit ? 'rotate(-8deg) scale(1.15)' : 'scale(1.05)');
    img.style.filter = playerHurt ? 'none' : (crit ? 'brightness(2.2) hue-rotate(-40deg)' : 'brightness(1.8) saturate(0)');
    setTimeout(() => { img.style.filter = ''; img.style.transform = ''; }, 300);
}

function resolveDb(correct, timedOut, attempt) {
    clearInterval(dbTimerId);
    const q = dbState.q;
    const fb = document.getElementById('gameFeedback');
    if (correct) {
        noteAnswer(true); // heals if this word was in the 錯字簿
        dbState.hitStreak++;
        bumpStreak();
        gameScore.correct++;
        let dmg = 1, crit = false;
        if (dbState.hitStreak >= CRIT_STREAK) {
            dmg = 2; crit = true; dbState.hitStreak = 0;
        }
        dbState.bossHp -= dmg;
        document.getElementById('dbStreak').textContent =
            dbState.hitStreak > 0 ? `⚡ Super attack in ${CRIT_STREAK - dbState.hitStreak} more!` : '';
        dbFlash(false, crit);
        if (fb) {
            fb.innerHTML = (crit ? `⚡ SUPER ATTACK! Critical hit — ${dmg} damage! ` : `⚔️ Hit! ${dmg} damage! `) +
                `「<b>${q.zh}</b> ${q.pinyin} — ${q.en}`;
            fb.className = 'feedback correct';
        }
    } else {
        noteAnswer(false);
        dbState.hitStreak = 0;
        document.getElementById('dbStreak').textContent = '';
        dbState.playerHp--;
        breakStreak();
        gameScore.wrong++;
        dbFlash(true, false);
        // 微教學: show tips for the specific confusable characters missed
        let tip = '';
        if (!timedOut && attempt) {
            const wrongChars = [...attempt].filter((c, i) => c !== q.zh[i]);
            const lines = [];
            wrongChars.forEach(c => {
                const right = q.zh[[...attempt].indexOf(c)];
                if (dictTips[c]) lines.push(dictTips[c]);
                if (right && dictTips[right]) lines.push(dictTips[right]);
            });
            tip = [...new Set(lines)].slice(0, 2).join('　');
        }
        document.getElementById('dbTip').innerHTML = tip ||
            `正確答案：<b style="color:var(--gold)">${q.zh}</b>（${q.pinyin}）`;
        if (fb) {
            fb.textContent = timedOut
                ? `⏰ Too slow! ${dbState.boss.name} hit you!`
                : `💥 ${dbState.boss.name} hit you! Listen again: 「${q.zh}」`;
            fb.className = 'feedback wrong';
        }
        if (!timedOut) speak(q.zh);
    }
    renderDbBars();
    updateGameStats();
    setTimeout(dbEndCheck, 1100);
}

function dbEndCheck() {
    if (!dbState) return;
    if (dbState.bossHp <= 0) {
        const flawless = dbState.playerHp === PLAYER_HP;
        const reward = flawless ? BOSS_REWARD_FLAWLESS : BOSS_REWARD;
        const amt = awardFlat(reward, `🏆 聽寫魔王 DICTATION BOSS: ${dbState.boss.name}${flawless ? ' — FLAWLESS!' : ''}`);
        showReward(flawless
            ? `🏆 FLAWLESS! You beat ${dbState.boss.name} at full HP! +${fmt(amt)} Robux`
            : `You defeated ${dbState.boss.name}! +${fmt(amt)} Robux`);
        dbState = null;
    } else if (dbState.playerHp <= 0) {
        showReward(`${dbState.boss.name} was too strong this time... No Robux. Win for ${BOSS_REWARD}💰 — flawless for ${BOSS_REWARD_FLAWLESS}💰!`);
        dbState = null;
    } else {
        nextDbQuestion();
    }
}

// === 15. 成語補字 ANIMAL IDIOM FILL ===
// An animal idiom shows with one of its 4 characters blanked out (random
// position). Pick the missing character from 3 options — distractors prefer
// same-sound characters from other idioms (同音字陷阱). 10 questions per round;
// every answer feeds the 錯字簿 so missed idioms come back in Dictation Boss.
const AF_ROUNDS = 10;
let afState = null;
let afCharSyl = null; // lazy char -> syllable map from the idiom pool

function afIdioms() { return wordSets.idioms.slice(); }

function afBase(py) {
    return String(py || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

function afBuildCharMap() {
    const map = {};
    afIdioms().forEach(w => {
        const syls = w.pinyin.split(/\s+/);
        [...w.zh].forEach((c, i) => { if (syls[i] && !map[c]) map[c] = syls[i]; });
    });
    return map;
}

function afDistractors(answer, siblingChars) {
    if (!afCharSyl) afCharSyl = afBuildCharMap();
    const ansSyl = afBase(afCharSyl[answer] || '');
    const pool = [...new Set(afIdioms().flatMap(w => [...w.zh]))]
        .filter(c => c !== answer && !siblingChars.includes(c));
    const homs = shuffle(pool.filter(c => afCharSyl[c] && afBase(afCharSyl[c]) === ansSyl));
    const rest = shuffle(pool.filter(c => !homs.includes(c)));
    return [...homs, ...rest].slice(0, 2);
}

function startAnimalFill() {
    resetGameScore();
    const queue = shuffle(afIdioms()).slice(0, AF_ROUNDS)
        .map(w => ({ w, blank: Math.floor(Math.random() * 4) }));
    afState = { queue, idx: 0, q: null, selected: null };
    nextAf();
}

function nextAf() {
    const fb = document.getElementById('gameFeedback');
    if (fb) { fb.textContent = ''; fb.className = 'feedback'; }
    if (afState.idx >= AF_ROUNDS) {
        const s = afState;
        afState = null;
        showReward(`🐾 成語補字 complete! ✅ ${gameScore.correct} / ${s ? s.idx : AF_ROUNDS} ` +
            `— ${gameScore.wrong === 0 ? 'PERFECT! All idioms fixed!' : gameScore.wrong + ' to practice in the 錯字簿.'}`);
        return;
    }
    const item = afState.queue[afState.idx];
    const chars = [...item.w.zh];
    const answer = chars[item.blank];
    afState.q = { w: item.w, blank: item.blank, answer };
    afState.selected = null;
    quizWord = item.w.zh; // missed idioms land in the 錯字簿
    document.getElementById('afProgress').textContent =
        `Q${afState.idx + 1} / ${AF_ROUNDS}`;
    document.getElementById('afMeaning').textContent = '';
    // idiom tiles with one random blank
    const row = document.getElementById('afTiles');
    row.innerHTML = '';
    chars.forEach((c, i) => {
        const t = document.createElement('div');
        t.className = 'tile';
        t.style.fontSize = '2.2rem';
        t.style.minWidth = '64px';
        if (i === item.blank) {
            t.textContent = '？';
            t.style.color = 'var(--gold)';
            t.style.borderColor = 'var(--gold)';
            t.style.opacity = '1';
            t.id = 'afBlankTile';
        } else {
            t.textContent = c;
        }
        row.appendChild(t);
    });
    const opts = shuffle([answer, ...afDistractors(answer, chars)]);
    const grid = document.getElementById('afOptions');
    grid.innerHTML = '';
    opts.forEach(c => {
        const btn = document.createElement('button');
        btn.className = 'option-btn';
        btn.style.fontSize = '1.6rem';
        btn.dataset.val = c;
        btn.textContent = c;
        btn.onclick = () => selectAf(btn, c);
        grid.appendChild(btn);
    });
    document.getElementById('afSubmit').disabled = true;
    setTimeout(() => { if (afState && afState.q === item) speak(item.w.zh); }, 350);
}

function selectAf(btn, val) {
    document.querySelectorAll('#afOptions .option-btn').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    afState.selected = val;
    speak(val);
    document.getElementById('afSubmit').disabled = false;
}

function afSpeak() { if (afState && afState.q) speak(afState.q.w.zh); }

function submitAf() {
    if (!afState || !afState.selected) return;
    const q = afState.q;
    const correct = afState.selected === q.answer;
    const buttons = document.querySelectorAll('#afOptions .option-btn');
    buttons.forEach(b => b.disabled = true);
    document.getElementById('afSubmit').disabled = true;
    const sel = [...buttons].find(b => b.dataset.val === afState.selected);
    if (sel) sel.classList.add(correct ? 'correct' : 'wrong');
    if (!correct) {
        buttons.forEach(b => { if (b.dataset.val === q.answer) b.classList.add('correct'); });
    }
    // fill the blank tile with the right character
    const blank = document.getElementById('afBlankTile');
    if (blank) {
        blank.textContent = q.answer;
        blank.style.color = correct ? '#2ea36b' : '#e74c3c';
    }
    document.getElementById('afMeaning').innerHTML =
        `<b>${q.w.pinyin}</b> — ${q.w.en}`;
    speak(q.w.zh);
    onAnswer(correct, '成語補字 Animal Idiom Fill');
    afState.idx++;
    setTimeout(nextAf, 1700);
}
