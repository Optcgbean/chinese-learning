// === ASSESSMENT GAMES: Sentence Order / Story Elements / Comprehension ===

// --- 1. 排句成段 SENTENCE ORDER ---
let soState = { story: null, shuffled: [], progress: 0, lock: false };

function startSentenceOrder() {
    resetGameScore();
    nextSentenceOrder();
}

function nextSentenceOrder() {
    const s = orderStories[Math.floor(Math.random() * orderStories.length)];
    soState = { story: s, shuffled: shuffle(s.events.slice()), progress: 0, lock: false };
    document.getElementById('soStory').innerHTML = s.title +
        ' <button class="speak-inline" onclick="speakStoryOrder()" title="Hear the full story in order">🔊 Full Story</button>' +
        ' <span style="color:var(--muted); font-size:0.95rem">— tap the sentences in story order!</span>';
    const box = document.getElementById('soChips');
    box.innerHTML = '';
    soState.shuffled.forEach(text => {
        const chip = document.createElement('button');
        chip.className = 'order-chip';
        chip.textContent = text;
        chip.onclick = () => soPick(chip, text);
        box.appendChild(chip);
    });
}

// speak the full correct story (the answer) in order
function speakStoryOrder() {
    if (soState.story) speak(soState.story.events.join('。'));
}

function soPick(chip, text) {
    if (soState.lock || chip.classList.contains('done')) return;
    const fb = document.getElementById('gameFeedback');
    const expected = soState.story.events[soState.progress];
    if (text === expected) {
        chip.classList.add('done');
        soState.progress++;
        gameScore.correct++;
        bumpStreak();
        updateGameStats();
        if (soState.progress >= soState.story.events.length) {
            soState.lock = true;
            const amt = award(currentDiff, 'Sentence Order ' + soState.story.title);
            if (fb) { fb.innerHTML = `🎉 Correct order! +${fmt(amt)} Robux`; fb.className = 'feedback correct'; }
            setTimeout(nextSentenceOrder, 1600);
        } else if (fb) {
            fb.textContent = `✅ ${soState.progress}/${soState.story.events.length} — what happens next?`;
            fb.className = 'feedback correct';
        }
    } else {
        soState.lock = true;
        gameScore.wrong++;
        breakStreak();
        updateGameStats();
        chip.classList.add('shake');
        if (fb) { fb.textContent = '❌ Not yet — think about what happened first!'; fb.className = 'feedback wrong'; }
        setTimeout(() => {
            chip.classList.remove('shake');
            soState.lock = false;
        }, 700);
    }
}

// --- 2. 敘事六要素 STORY ELEMENTS ---
let elState = { item: null, lock: false };

function startElements() {
    resetGameScore();
    // render category buttons once
    const grid = document.getElementById('elCats');
    grid.innerHTML = '';
    elementCats.forEach((label, idx) => {
        const b = document.createElement('button');
        b.className = 'option-btn';
        b.style.fontSize = '1rem';
        b.textContent = label;
        b.onclick = () => answerElement(b, idx);
        grid.appendChild(b);
    });
    nextElement();
}

function nextElement() {
    const pool = elementItems.filter(i => !elState.item || i.t !== elState.item.t);
    elState.item = pool[Math.floor(Math.random() * pool.length)];
    elState.lock = false;
    document.getElementById('elStoryTag').textContent = '《' + elState.item.story + '》';
    document.getElementById('elItem').textContent = elState.item.t;
}

function answerElement(btn, cat) {
    if (elState.lock) return;
    elState.lock = true;
    const buttons = document.querySelectorAll('#elCats .option-btn');
    buttons.forEach(b => b.disabled = true);
    const correct = cat === elState.item.c;
    btn.classList.add(correct ? 'correct' : 'wrong');
    if (!correct) buttons.forEach(b => { if (b.textContent === elementCats[elState.item.c]) b.classList.add('correct'); });
    onAnswer(correct, 'Story Elements');
    setTimeout(() => {
        buttons.forEach(b => { b.disabled = false; b.classList.remove('correct', 'wrong'); });
        nextElement();
    }, 1300);
}

// --- 3. 閱讀理解 COMPREHENSION ---
// Each option has a 🔊; tapping the option selects it (and speaks it). Submit checks.
let compState = { q: null, selected: null };

function startComprehension() {
    resetGameScore();
    nextComp();
}

function nextComp() {
    let q;
    do { q = compQs[Math.floor(Math.random() * compQs.length)]; } while (compState.q && compQs.length > 1 && q.q === compState.q.q);
    compState = { q, selected: null };
    quizWord = null; // comprehension MCQs aren't single-word drills
    document.getElementById('compQuestion').textContent = q.q;
    const grid = document.getElementById('compOptions');
    grid.innerHTML = '';
    shuffle(q.opts).forEach(opt => {
        const btn = document.createElement('button');
        btn.className = 'option-btn';
        btn.style.fontSize = '1.05rem';
        btn.dataset.opt = opt;
        btn.innerHTML = `<span class="opt-zh">${escapeHtml(opt)}</span><span class="opt-speak" title="Listen">🔊</span>`;
        btn.onclick = (e) => {
            if (e.target.closest('.opt-speak')) { speak(opt); return; }
            selectComp(btn, opt);
        };
        grid.appendChild(btn);
    });
    document.getElementById('compSubmit').disabled = true;
}

function selectComp(btn, opt) {
    document.querySelectorAll('#compOptions .option-btn').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    compState.selected = opt;
    speak(opt);
    document.getElementById('compSubmit').disabled = false;
}

function submitComp() {
    if (!compState.selected) return;
    const buttons = document.querySelectorAll('#compOptions .option-btn');
    buttons.forEach(b => b.disabled = true);
    document.getElementById('compSubmit').disabled = true;
    const correct = compState.selected === compState.q.a;
    const sel = [...buttons].find(b => b.dataset.opt === compState.selected);
    if (sel) sel.classList.add(correct ? 'correct' : 'wrong');
    if (!correct) buttons.forEach(b => { if (b.dataset.opt === compState.q.a) b.classList.add('correct'); });
    onAnswer(correct, 'Reading Comprehension');
    setTimeout(nextComp, 1500);
}

function speakCompQuestion() {
    if (compState.q) speak(compState.q.q);
}

// --- 4. 四字成語 ANIMAL IDIOMS ---
// Two question types from the worksheet 與動物有關的成語:
//   char    — pick the correct character (confusable pair) to finish the idiom
//   meaning — pick the idiom that matches the 【meaning】 in the sentence
let idiomState = { q: null, selected: null };

function startIdioms() {
    resetGameScore();
    nextIdiom();
}

function idiomPool() {
    return [
        ...idiomCharQs.map(q => ({ ...q, type: 'char' })),
        ...idiomMeaningQs.map(q => ({ ...q, type: 'meaning' }))
    ];
}

function nextIdiom() {
    const pool = idiomPool();
    let q;
    do { q = pool[Math.floor(Math.random() * pool.length)]; }
    while (idiomState.q && pool.length > 1 && q.idiom === idiomState.q.idiom);
    idiomState = { q, selected: null };
    quizWord = q.idiom; // idioms can land in the 錯字簿 too
    document.getElementById('idMeaning').textContent = '';
    const sent = document.getElementById('idSentence');
    const opts = document.getElementById('idOptions');
    opts.innerHTML = '';
    document.getElementById('idSubmit').disabled = true;
    if (q.type === 'char') {
        document.getElementById('idPromptType').textContent = '選出正確的字 · Pick the right character';
        sent.innerHTML = escapeHtml(q.context).replace('□', '<span class="blank">?</span>') +
            ` <button class="speak-inline" onclick="speak('${q.idiom}')" title="Hear the idiom">🔊</button>`;
        q.pair.forEach(c => {
            const btn = document.createElement('button');
            btn.className = 'option-btn idiom-char-btn';
            btn.dataset.val = c;
            btn.textContent = c;
            btn.onclick = () => selectIdiom(btn, c);
            opts.appendChild(btn);
        });
    } else {
        document.getElementById('idPromptType').textContent = '選出正確的成語 · Pick the right idiom';
        sent.innerHTML = escapeHtml(q.context).replace(/【(.+?)】/g, '<b style="color:var(--gold)">$1</b>') +
            ` <button class="speak-inline" onclick="speak('${q.idiom}')" title="Hear the idiom">🔊</button>`;
        shuffle(q.options.slice()).forEach(c => {
            const btn = document.createElement('button');
            btn.className = 'option-btn';
            btn.style.fontSize = '1.1rem';
            btn.dataset.val = c;
            btn.textContent = c;
            btn.onclick = () => selectIdiom(btn, c);
            opts.appendChild(btn);
        });
    }
}

function selectIdiom(btn, val) {
    document.querySelectorAll('#idOptions .option-btn').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    idiomState.selected = val;
    if (idiomState.q.type === 'char') speak(val);
    document.getElementById('idSubmit').disabled = false;
}

function submitIdiom() {
    if (!idiomState.selected) return;
    const q = idiomState.q;
    const buttons = document.querySelectorAll('#idOptions .option-btn');
    buttons.forEach(b => b.disabled = true);
    document.getElementById('idSubmit').disabled = true;
    // the correct option: for char type, the pair char that appears in the idiom
    let correctVal;
    if (q.type === 'char') {
        correctVal = q.pair.find(c => q.idiom.includes(c));
    } else {
        correctVal = q.idiom;
    }
    const correct = idiomState.selected === correctVal;
    const sel = [...buttons].find(b => b.dataset.val === idiomState.selected);
    if (sel) sel.classList.add(correct ? 'correct' : 'wrong');
    if (!correct) {
        const right = [...buttons].find(b => b.dataset.val === correctVal);
        if (right) right.classList.add('correct');
    }
    onAnswer(correct, '四字成語 Idioms');
    document.getElementById('idMeaning').textContent =
        `${q.idiom} (${q.pinyin}) — ${q.meaning}`;
    if (correct) speak(q.idiom);
    setTimeout(nextIdiom, 2400);
}
