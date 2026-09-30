// === ASSESSMENT DATA — 進展性評估指引(一) 單元一：記敘文(一)故事的王國 ===
// Sources: son's workbook photos 2026-09-29 (P3, St. Hilary's)
// Assessment date: 十月二十日. Texts: 《農夫的遺產》《北風和太陽》
// Stories drilled: 《狼來了》《守株待兔》

// --- 19 vocab words (課文第五課 + 評估指引詞語) ---
wordSets.assessment = [
    {zh: '辛勞', en: 'hard work', pinyin: 'xīn láo'},
    {zh: '照料', en: 'look after', pinyin: 'zhào liào'},
    {zh: '苦惱', en: 'distressed', pinyin: 'kǔ nǎo'},
    {zh: '遊手好閒', en: 'idle, loaf around', pinyin: 'yóu shǒu hào xián'},
    {zh: '憂心', en: 'worried', pinyin: 'yōu xīn'},
    {zh: '爭先恐後', en: 'rush to be first', pinyin: 'zhēng xiān kǒng hòu'},
    {zh: '避免', en: 'avoid', pinyin: 'bì miǎn'},
    {zh: '破壞', en: 'destroy, damage', pinyin: 'pò huài'},
    {zh: '小心翼翼', en: 'very careful', pinyin: 'xiǎo xīn yì yì'},
    {zh: '挖掘', en: 'dig out', pinyin: 'wā jué'},
    {zh: '漸漸', en: 'gradually', pinyin: 'jiàn jiàn'},
    {zh: '傷透', en: 'heartbroken', pinyin: 'shāng tòu'},
    {zh: '腦筋', en: 'brains, mind', pinyin: 'nǎo jīn'},
    {zh: '任何', en: 'any, whatever', pinyin: 'rèn hé'},
    {zh: '拼命', en: 'desperately', pinyin: 'pīn mìng'},
    {zh: '筋疲力盡', en: 'exhausted', pinyin: 'jīn pí lì jìn'},
    {zh: '不慌不忙', en: 'calm, unhurried', pinyin: 'bù huāng bù máng'},
    {zh: '鬆開', en: 'loosen, let go', pinyin: 'sōng kāi'},
    {zh: '勝利', en: 'victory', pinyin: 'shèng lì'}
];

// --- 排句成段：ordered events per story (display order shuffled each round) ---
const orderStories = [
    {
        title: '《農夫的遺產》',
        events: [
            '從前，有一個老農夫和三個兒子。',
            '農夫臨死前，叫兒子們到床前。',
            '他說田地裏藏着寶物，要兒子們自己找出來。',
            '兒子們天天翻土，甚麼也找不到。',
            '翻過的泥土很鬆軟，長出很多禾苗。',
            '兒子們終於明白：團結努力才是真正的寶物。'
        ]
    },
    {
        title: '《狼來了》',
        events: [
            '有一天，牧童上山放羊。',
            '牧童大叫「狼來了！」戲弄村民。',
            '村民趕來幫忙，卻被牧童嘲笑。',
            '狼真的來了，村民不再理他。',
            '牧童損失了所有的羊。'
        ]
    },
    {
        title: '《守株待兔》',
        events: [
            '一個農夫在田裏耕種。',
            '兔子撞到樹幹上，死了。',
            '農夫撿起兔子，以為天天都能拾到。',
            '農夫天天坐在樹下等，不再種田。',
            '農夫甚麼都沒等到，終於餓死了。'
        ]
    },
    {
        title: '《北風和太陽》',
        events: [
            '北風和太陽爭論誰的本領大。',
            '北風猛烈地吹，行人把衣服裹得更緊。',
            '太陽發出溫暖的陽光。',
            '行人熱得脫下了衣服。',
            '北風認輸，太陽獲勝了。'
        ]
    }
];

// --- 敘事六要素 (photo: time/place/character/start/process/end) ---
const elementCats = ['時間 Time', '地點 Place', '人物 Character', '開始 Start', '經過 Process', '結果 End'];
const elementItems = [
    // 《狼來了》
    { t: '有一天', c: 0, story: '狼來了' },
    { t: '山上', c: 1, story: '狼來了' },
    { t: '牧童', c: 2, story: '狼來了' },
    { t: '村民', c:2, story: '狼來了' },
    { t: '狼', c: 2, story: '狼來了' },
    { t: '牧童大叫「狼來了！」，戲弄村民', c: 3, story: '狼來了' },
    { t: '村民被牧童嘲笑，生氣地離開', c: 4, story: '狼來了' },
    { t: '狼真的來了，村民不再相信牧童', c: 4, story: '狼來了' },
    { t: '牧童損失了所有的羊', c: 5, story: '狼來了' },
    // 《守株待兔》
    { t: '從前', c: 0, story: '守株待兔' },
    { t: '大樹下', c: 1, story: '守株待兔' },
    { t: '農夫', c: 2, story: '守株待兔' },
    { t: '兔子', c: 2, story: '守株待兔' },
    { t: '兔子撞到樹幹上，死了', c: 3, story: '守株待兔' },
    { t: '農夫撿起兔子，想天天不勞而獲', c: 3, story: '守株待兔' },
    { t: '農夫天天坐在樹下等，不再種田', c: 4, story: '守株待兔' },
    { t: '農夫甚麼都沒等到，終於餓死了', c: 5, story: '守株待兔' }
];

// --- 閱讀理解 / 語文知識 MC questions ---
// a = correct answer TEXT (options shuffled at display time)
const compQs = [
    { q: '《狼來了》的故事發生在甚麼地方？', opts: ['山上', '學校', '海邊', '森林'], a: '山上' },
    { q: '《狼來了》的主角是誰？', opts: ['牧童和村民', '老師和學生', '農夫和兔子', '醫生和護士'], a: '牧童和村民' },
    { q: '《守株待兔》的主角是誰？', opts: ['農夫和兔子', '牧童和狼', '北風和太陽', '貓和老鼠'], a: '農夫和兔子' },
    { q: '《守株待兔》的故事發生在甚麼時候？', opts: ['從前', '明天', '下星期', '今晚'], a: '從前' },
    { q: '農夫坐在甚麼地方等兔子？', opts: ['大樹下', '山頂上', '河邊', '家裏'], a: '大樹下' },
    { q: '牧童為甚麼損失了所有的羊？', opts: ['村民不再相信他，沒有人來幫忙', '羊自己跑掉了', '狼不吃羊', '牧童把羊賣了'], a: '村民不再相信他，沒有人來幫忙' },
    { q: '農夫為甚麼最後餓死了？', opts: ['他天天等兔子，不再種田', '他生病了', '他沒有錢買食物', '他把食物給了兔子'], a: '他天天等兔子，不再種田' },
    { q: '《狼來了》教我們甚麼道理？', opts: ['不要說謊，要誠實', '要勇敢打狼', '不要到山上放羊', '要大聲叫喊'], a: '不要說謊，要誠實' },
    { q: '《守株待兔》教我們甚麼道理？', opts: ['不要想不勞而獲，要努力工作', '要愛護兔子', '種田很有趣', '等待就會有收穫'], a: '不要想不勞而獲，要努力工作' },
    { q: '《北風和太陽》中，誰最後讓行人脫下衣服？', opts: ['太陽', '北風', '牧童', '農夫'], a: '太陽' },
    { q: '北風為甚麼輸了？', opts: ['行人把衣服裹得更緊', '行人跑得太快', '太陽照得太久', '天氣不夠冷'], a: '行人把衣服裹得更緊' },
    { q: '「小心翼翼」的意思是甚麼？', opts: ['舉動十分謹慎，絲毫不敢疏忽', '十分開心', '非常粗魯', '動作很快'], a: '舉動十分謹慎，絲毫不敢疏忽' },
    { q: '「爭先恐後」的意思是甚麼？', opts: ['爭着向前，害怕落後', '慢慢走路', '排隊等候', '互相讓座'], a: '爭着向前，害怕落後' },
    { q: '「遊手好閒」的意思是甚麼？', opts: ['不愛勞動，只愛遊玩', '喜歡游泳', '努力工作', '喜歡讀書'], a: '不愛勞動，只愛遊玩' },
    { q: '「筋疲力盡」的意思是甚麼？', opts: ['非常疲倦', '很有精神', '十分開心', '非常害怕'], a: '非常疲倦' },
    { q: '「避免」的意思是甚麼？', opts: ['設法防止某種情況發生', '喜歡做某事', '幫助別人', '故意破壞'], a: '設法防止某種情況發生' },
    { q: '「照料」的意思是甚麼？', opts: ['關心照顧', '大聲叫喊', '到處亂跑', '努力讀書'], a: '關心照顧' },
    { q: '「破壞」的意思是甚麼？', opts: ['使事物受到損害', '修理東西', '保護環境', '建造房屋'], a: '使事物受到損害' }
];

// --- 詞語填充：workbook example sentences (blanked target word) ---
const assessFills = [
    { zh: '爸爸工作十分__，我們要好好孝順他。', en: 'Dad works so hard; we must be filial to him.', blank: '辛勞' },
    { zh: '護士在病房裏幫助醫生__病人。', en: 'Nurses help doctors care for patients in the ward.', blank: '照料' },
    { zh: '我考試不及格，真是__極了。', en: 'I failed the exam — I am extremely distressed.', blank: '苦惱' },
    { zh: '狐狸終日__，不肯找工作。', en: 'The fox loafs around all day, refusing to find work.', blank: '遊手好閒' },
    { zh: '姐姐卧病在床已經三天了，我們都很__。', en: 'Sister has been bedridden for three days; we are all worried.', blank: '憂心' },
    { zh: '課間休息的鈴聲響起來了，同學們__地離開課室。', en: 'The recess bell rang; classmates rushed out of the classroom.', blank: '爭先恐後' },
    { zh: '患上感冒便不應上學，__把病菌傳染給同學。', en: 'If you catch a cold you should skip school, to avoid infecting classmates.', blank: '避免' },
    { zh: '小方上課時__秩序，受到老師的處分。', en: 'Xiao Fang disrupted class order and was punished.', blank: '破壞' },
    { zh: '護士__地替我清洗傷口。', en: 'The nurse very carefully cleaned my wound.', blank: '小心翼翼' }
];

// --- 造句 SENTENCE BUILDER: short model sentences per target word ---
// Grade-3 friendly vocabulary (parent request 2026-09-30). Chunks are the
// tap-tiles; the target word always appears intact as its own tile.
const sentenceBuilders = [
    { zh: '苦惱', pinyin: 'kǔ nǎo', meaning: '痛苦煩惱', en: 'I forgot my homework — I feel so distressed.',
      chunks: ['我', '忘記帶功課，', '心裏', '很', '苦惱', '。'] },
    { zh: '苦惱', pinyin: 'kǔ nǎo', meaning: '痛苦煩惱', en: 'Xiao Ming cannot do his homework; he is very distressed.',
      chunks: ['小明', '不會做功課，', '十分', '苦惱', '。'] },
    { zh: '遊手好閒', pinyin: 'yóu shǒu hào xián', meaning: '不愛勞動，只愛遊玩', en: 'The little pig loafs around all day and refuses to work.',
      chunks: ['小豬', '遊手好閒，', '不肯', '工作', '。'] },
    { zh: '遊手好閒', pinyin: 'yóu shǒu hào xián', meaning: '不愛勞動，只愛遊玩', en: 'Brother idles about all day; Mum is very angry.',
      chunks: ['哥哥', '整天', '遊手好閒，', '媽媽', '很生氣', '。'] },
    { zh: '憂心', pinyin: 'yōu xīn', meaning: '憂慮、擔心', en: 'Little brother is sick; Mum is very worried.',
      chunks: ['弟弟', '生病了，', '媽媽', '很', '憂心', '。'] },
    { zh: '憂心', pinyin: 'yōu xīn', meaning: '憂慮、擔心', en: 'Grandma is not well; we are all worried.',
      chunks: ['奶奶', '身體不好，', '我們', '很', '憂心', '。'] },
    { zh: '爭先恐後', pinyin: 'zhēng xiān kǒng hòu', meaning: '爭着向前，害怕落後', en: 'The classmates all rushed to raise their hands.',
      chunks: ['同學們', '爭先恐後地', '舉手', '。'] },
    { zh: '爭先恐後', pinyin: 'zhēng xiān kǒng hòu', meaning: '爭着向前，害怕落後', en: 'Class is over; everyone rushed out of the classroom.',
      chunks: ['下課了，', '大家', '爭先恐後地', '跑出', '課室', '。'] },
    { zh: '避免', pinyin: 'bì miǎn', meaning: '設法防止某種情況發生', en: 'We must wash our hands often to avoid getting sick.',
      chunks: ['我們', '要勤洗手，', '避免', '生病', '。'] },
    { zh: '避免', pinyin: 'bì miǎn', meaning: '設法防止某種情況發生', en: 'Wear a mask when you go out, to avoid catching a cold.',
      chunks: ['出門', '戴口罩，', '避免', '染上', '感冒', '。'] },
    { zh: '破壞', pinyin: 'pò huài', meaning: '使事物受到損害', en: 'We must not damage public property.',
      chunks: ['我們', '不要', '破壞', '公物', '。'] },
    { zh: '破壞', pinyin: 'pò huài', meaning: '使事物受到損害', en: 'The typhoon destroyed the farmer\'s fields.',
      chunks: ['颱風', '破壞了', '農夫的', '田地', '。'] },
    { zh: '小心翼翼', pinyin: 'xiǎo xīn yì yì', meaning: '舉動十分謹慎，絲毫不敢疏忽', en: 'I carefully carried the hot soup.',
      chunks: ['我', '小心翼翼地', '端着', '熱湯', '。'] },
    { zh: '小心翼翼', pinyin: 'xiǎo xīn yì yì', meaning: '舉動十分謹慎，絲毫不敢疏忽', en: 'Little brother held the kitten very gently.',
      chunks: ['弟弟', '小心翼翼地', '抱着', '小貓', '。'] }
];
