/**
 * TCM & Classical Chinese Dictionary
 * Offline dictionary for common characters and TCM terms.
 * Characters not found here will be looked up via the zdic.net API.
 */

export interface DictEntry {
  character: string
  pinyin: string
  meaning: string
  radical?: string
  strokes?: number
  /** For TCM terms: category like 药名/穴位/病症 */
  category?: 'tcm_drug' | 'tcm_point' | 'tcm_symptom' | 'general'
  /** Example usage from medical texts */
  example?: string
}

const tcmDictionary: Record<string, DictEntry> = {
  // ===== Common TCM Drugs =====
  参: { character: '参', pinyin: 'shēn', meaning: '人参。多年生草本植物，根入药，大补元气、复脉固脱。也读cān（参加）、cēn（参差）。', radical: '厶', strokes: 8, category: 'tcm_drug' },
  人: { character: '人', pinyin: 'rén', meaning: '人类，人。能制造并使用工具进行劳动的高等动物。', radical: '人', strokes: 2, category: 'general' },
  黄: { character: '黄', pinyin: 'huáng', meaning: '黄色。也指黄芪（补气）、大黄（泻下）、黄连（清热）、黄芩（燥湿）等药材。', radical: '黄', strokes: 11, category: 'tcm_drug' },
  芪: { character: '芪', pinyin: 'qí', meaning: '黄芪，补气要药。生用固表，炙用补中。', radical: '艹', strokes: 7, category: 'tcm_drug' },
  当: { character: '当', pinyin: 'dāng', meaning: '应当。也指当归，伞形科植物，补血活血，调经止痛。读dàng时意为恰当。', radical: '彐', strokes: 6, category: 'tcm_drug' },
  归: { character: '归', pinyin: 'guī', meaning: '返回。当归，补血圣药。', radical: '彐', strokes: 5, category: 'tcm_drug' },
  甘: { character: '甘', pinyin: 'gān', meaning: '甜。甘草，补脾益气，清热解毒，调和诸药。', radical: '甘', strokes: 5, category: 'tcm_drug' },
  草: { character: '草', pinyin: 'cǎo', meaning: '草本植物的总称。甘草，最常用中药之一。', radical: '艹', strokes: 9, category: 'tcm_drug' },
  川: { character: '川', pinyin: 'chuān', meaning: '河流；四川省简称。也指川芎。', radical: '川', strokes: 3, category: 'tcm_drug' },
  芎: { character: '芎', pinyin: 'xiōng', meaning: '川芎，伞形科植物，活血行气，祛风止痛。', radical: '艹', strokes: 6, category: 'tcm_drug' },
  白: { character: '白', pinyin: 'bái', meaning: '白色。白术，菊科植物，健脾益气，燥湿利水。', radical: '白', strokes: 5, category: 'tcm_drug' },
  术: { character: '术', pinyin: 'zhú', meaning: '白术，健脾燥湿要药。也读shù（技术）。', radical: '木', strokes: 5, category: 'tcm_drug' },
  茯: { character: '茯', pinyin: 'fú', meaning: '茯苓，多孔菌科真菌，利水渗湿，健脾宁心。', radical: '艹', strokes: 9, category: 'tcm_drug' },
  苓: { character: '苓', pinyin: 'líng', meaning: '茯苓。也指猪苓。', radical: '艹', strokes: 8, category: 'tcm_drug' },
  半: { character: '半', pinyin: 'bàn', meaning: '二分之一。半夏，天南星科植物，燥湿化痰，降逆止呕。', radical: '十', strokes: 5, category: 'tcm_drug' },
  夏: { character: '夏', pinyin: 'xià', meaning: '夏季。半夏（药材，因生于仲夏而得名）。', radical: '夂', strokes: 10, category: 'tcm_drug' },
  陈: { character: '陈', pinyin: 'chén', meaning: '陈列；陈旧。陈皮，橘皮晒干入药，理气健脾。', radical: '阝', strokes: 8, category: 'tcm_drug' },
  皮: { character: '皮', pinyin: 'pí', meaning: '皮肤；外皮。陈皮，理气健脾。', radical: '皮', strokes: 5, category: 'tcm_drug' },
  麻: { character: '麻', pinyin: 'má', meaning: '麻木；大麻。麻黄（发汗解表）、麻子仁（润肠）、升麻（升阳）等药材。', radical: '麻', strokes: 11, category: 'tcm_drug' },
  桂: { character: '桂', pinyin: 'guì', meaning: '肉桂，樟科植物，补火助阳，散寒止痛。', radical: '木', strokes: 10, category: 'tcm_drug' },
  枝: { character: '枝', pinyin: 'zhī', meaning: '枝条。桂枝，肉桂的嫩枝，发汗解肌。', radical: '木', strokes: 8, category: 'tcm_drug' },
  附: { character: '附', pinyin: 'fù', meaning: '附加。附子，乌头子根，回阳救逆第一药。', radical: '阝', strokes: 7, category: 'tcm_drug' },
  子: { character: '子', pinyin: 'zǐ', meaning: '儿子；果实种子。也作后缀，如附子、枸杞子。', radical: '子', strokes: 3, category: 'general' },
  柴: { character: '柴', pinyin: 'chái', meaning: '柴火。柴胡，伞形科植物，和解表里、疏肝解郁。', radical: '木', strokes: 10, category: 'tcm_drug' },
  胡: { character: '胡', pinyin: 'hú', meaning: '胡人；为何。柴胡、延胡索等药材名称的一部分。', radical: '月', strokes: 9, category: 'tcm_drug' },
  芍: { character: '芍', pinyin: 'sháo', meaning: '芍药，毛茛科植物，养血调经。白芍养血，赤芍凉血。', radical: '艹', strokes: 6, category: 'tcm_drug' },
  丹: { character: '丹', pinyin: 'dān', meaning: '红色；丹药。丹参，活血祛瘀、凉血消痈。', radical: '丶', strokes: 4, category: 'tcm_drug' },
  桃: { character: '桃', pinyin: 'táo', meaning: '桃子。桃仁，活血祛瘀，润肠通便。', radical: '木', strokes: 10, category: 'tcm_drug' },
  仁: { character: '仁', pinyin: 'rén', meaning: '仁爱；果核的种仁。桃仁、杏仁等。', radical: '亻', strokes: 4, category: 'tcm_drug' },
  杏: { character: '杏', pinyin: 'xìng', meaning: '杏树。杏仁，止咳平喘，润肠通便。', radical: '木', strokes: 7, category: 'tcm_drug' },
  生: { character: '生', pinyin: 'shēng', meaning: '生命；发生。生地黄、生姜等药材名。', radical: '生', strokes: 5, category: 'general' },
  地: { character: '地', pinyin: 'dì', meaning: '大地；地方。地黄，玄参科植物，清热凉血。', radical: '土', strokes: 6, category: 'tcm_drug' },
  麦: { character: '麦', pinyin: 'mài', meaning: '麦子。麦冬，养阴生津。', radical: '麦', strokes: 7, category: 'tcm_drug' },
  冬: { character: '冬', pinyin: 'dōng', meaning: '冬季。麦冬、天冬等药材名。', radical: '夂', strokes: 5, category: 'tcm_drug' },
  细: { character: '细', pinyin: 'xì', meaning: '细小。细辛，马兜铃科植物，祛风散寒，通窍止痛。', radical: '纟', strokes: 8, category: 'tcm_drug' },
  辛: { character: '辛', pinyin: 'xīn', meaning: '辣味；辛苦。细辛、辛夷等药材名。', radical: '辛', strokes: 7, category: 'tcm_drug' },
  连: { character: '连', pinyin: 'lián', meaning: '连接。黄连，清热燥湿、泻火解毒之要药。', radical: '辶', strokes: 7, category: 'tcm_drug' },
  大: { character: '大', pinyin: 'dà', meaning: '大小。大黄，泻下攻积、清热泻火。读dài时如"大王"。', radical: '大', strokes: 3, category: 'tcm_drug' },

  芩: { character: '芩', pinyin: 'qín', meaning: '黄芩，唇形科植物，清热燥湿、泻火解毒。', radical: '艹', strokes: 7, category: 'tcm_drug' },
  栀: { character: '栀', pinyin: 'zhī', meaning: '栀子，茜草科植物，泻火除烦、清热利湿。', radical: '木', strokes: 9, category: 'tcm_drug' },
  薄: { character: '薄', pinyin: 'bò', meaning: '薄荷，唇形科植物，疏散风热、清利头目。也读báo（厚薄）、bó（薄弱）。', radical: '艹', strokes: 16, category: 'tcm_drug' },
  荷: { character: '荷', pinyin: 'hé', meaning: '荷花。薄荷，辛凉解表药。', radical: '艹', strokes: 10, category: 'tcm_drug' },
  菊: { character: '菊', pinyin: 'jú', meaning: '菊花，疏散风热、平肝明目。', radical: '艹', strokes: 11, category: 'tcm_drug' },
  花: { character: '花', pinyin: 'huā', meaning: '花朵。菊花、红花、金银花等。', radical: '艹', strokes: 7, category: 'tcm_drug' },
  升: { character: '升', pinyin: 'shēng', meaning: '上升。升麻，升阳举陷。', radical: '十', strokes: 4, category: 'tcm_drug' },

  葛: { character: '葛', pinyin: 'gé', meaning: '葛根，豆科植物，解肌退热、生津止渴。', radical: '艹', strokes: 12, category: 'tcm_drug' },
  根: { character: '根', pinyin: 'gēn', meaning: '根部。葛根、山豆根等药材名。', radical: '木', strokes: 10, category: 'tcm_drug' },
  姜: { character: '姜', pinyin: 'jiāng', meaning: '生姜，温中止呕、温肺止咳。干姜温中散寒。', radical: '女', strokes: 9, category: 'tcm_drug' },

  // ===== TCM Symptoms & Terms =====
  阴: { character: '阴', pinyin: 'yīn', meaning: '阴，与阳相对。中医学概念：指阴精、阴液、阴气等。', radical: '阝', strokes: 6, category: 'general', example: '阴虚则内热' },
  阳: { character: '阳', pinyin: 'yáng', meaning: '阳，与阴相对。中医学概念：指阳气、阳精等。', radical: '阝', strokes: 6, category: 'general', example: '阳虚则外寒' },
  虚: { character: '虚', pinyin: 'xū', meaning: '虚弱。中医指正气不足，有阴虚、阳虚、气虚、血虚之分。', radical: '虍', strokes: 11, category: 'tcm_symptom' },
  实: { character: '实', pinyin: 'shí', meaning: '充实；实证。中医指邪气盛实。', radical: '宀', strokes: 8, category: 'tcm_symptom' },
  寒: { character: '寒', pinyin: 'hán', meaning: '寒冷。中医指寒邪，或阳气不足的病理状态。', radical: '宀', strokes: 12, category: 'tcm_symptom', example: '寒者热之' },
  热: { character: '热', pinyin: 'rè', meaning: '热度；热邪。中医指热证。', radical: '灬', strokes: 10, category: 'tcm_symptom', example: '热者寒之' },
  风: { character: '风', pinyin: 'fēng', meaning: '风。中医六淫之一，风邪致病。', radical: '风', strokes: 4, category: 'tcm_symptom', example: '风为百病之长' },
  湿: { character: '湿', pinyin: 'shī', meaning: '潮湿。中医六淫之一，湿邪重浊粘滞。', radical: '氵', strokes: 12, category: 'tcm_symptom' },
  燥: { character: '燥', pinyin: 'zào', meaning: '干燥。中医六淫之一，燥邪伤津。', radical: '火', strokes: 17, category: 'tcm_symptom' },
  火: { character: '火', pinyin: 'huǒ', meaning: '火。中医中指火热之邪。', radical: '火', strokes: 4, category: 'tcm_symptom' },
  气: { character: '气', pinyin: 'qì', meaning: '气。中医学最基本概念之一，指人体内活力很强的精微物质。', radical: '气', strokes: 4, category: 'general', example: '气为血之帅' },
  血: { character: '血', pinyin: 'xuè', meaning: '血液。中医指循行脉中的红色液态物质。', radical: '血', strokes: 6, category: 'general', example: '血为气之母' },
  脉: { character: '脉', pinyin: 'mài', meaning: '脉管；脉搏。中医通过切脉诊断疾病。', radical: '月', strokes: 9, category: 'general' },
  经: { character: '经', pinyin: 'jīng', meaning: '经典；经络。中医经脉理论的基础概念。', radical: '纟', strokes: 8, category: 'general' },
  络: { character: '络', pinyin: 'luò', meaning: '网络。经络，运行气血的通路。', radical: '纟', strokes: 9, category: 'general' },
  穴: { character: '穴', pinyin: 'xué', meaning: '孔穴；穴位。针灸施术的部位。', radical: '穴', strokes: 5, category: 'tcm_point' },
  针: { character: '针', pinyin: 'zhēn', meaning: '针。中医针灸疗法用针刺激穴位。', radical: '钅', strokes: 7, category: 'tcm_point' },
  灸: { character: '灸', pinyin: 'jiǔ', meaning: '中医灸法，用艾绒烧灼穴位以治病。', radical: '火', strokes: 7, category: 'tcm_point' },
  痰: { character: '痰', pinyin: 'tán', meaning: '痰。中医病理产物，也是致病因素。', radical: '疒', strokes: 13, category: 'tcm_symptom' },
  瘀: { character: '瘀', pinyin: 'yū', meaning: '瘀血。中医指血液运行不畅。', radical: '疒', strokes: 13, category: 'tcm_symptom' },
  痹: { character: '痹', pinyin: 'bì', meaning: '痹证。中医指因风、寒、湿等邪气引起的肢体疼痛麻木。', radical: '疒', strokes: 13, category: 'tcm_symptom' },
  痞: { character: '痞', pinyin: 'pǐ', meaning: '痞块；痞满。中医指胸腹间气机阻塞不舒。', radical: '疒', strokes: 13, category: 'tcm_symptom' },
  滞: { character: '滞', pinyin: 'zhì', meaning: '停滞。气滞、血滞，指运行不畅。', radical: '氵', strokes: 12, category: 'tcm_symptom' },
  郁: { character: '郁', pinyin: 'yù', meaning: '郁结。肝气郁结，情志抑郁。', radical: '阝', strokes: 8, category: 'tcm_symptom' },
  补: { character: '补', pinyin: 'bǔ', meaning: '补益。中医补法，用滋补药补养气血阴阳。', radical: '衤', strokes: 7, category: 'general', example: '虚则补之' },
  泻: { character: '泻', pinyin: 'xiè', meaning: '泄泻。中医泻法，用泻下药通便。', radical: '氵', strokes: 8, category: 'general', example: '实则泻之' },
  表: { character: '表', pinyin: 'biǎo', meaning: '外表。中医表证，病位在体表。', radical: '衣', strokes: 8, category: 'tcm_symptom' },
  里: { character: '里', pinyin: 'lǐ', meaning: '内部；里面。中医里证，病位在脏腑。', radical: '里', strokes: 7, category: 'tcm_symptom' },

  // ===== TCM Formula Prefixes =====
  汤: { character: '汤', pinyin: 'tāng', meaning: '汤剂。中药汤液，如麻黄汤、桂枝汤。', radical: '氵', strokes: 6, category: 'general' },
  丸: { character: '丸', pinyin: 'wán', meaning: '丸剂。中药丸状制剂，如六味地黄丸。', radical: '丶', strokes: 3, category: 'general' },
  散: { character: '散', pinyin: 'sǎn', meaning: '散剂。中药粉末制剂。也读sàn（散开）。', radical: '攵', strokes: 12, category: 'general' },

  // ===== Classical Chinese particles =====
  之: { character: '之', pinyin: 'zhī', meaning: '往；的；代词。文言文中最常用虚词之一。', radical: '丶', strokes: 3, category: 'general' },
  其: { character: '其', pinyin: 'qí', meaning: '代词（他的/它的）；语气词。', radical: '八', strokes: 8, category: 'general' },
  者: { character: '者', pinyin: 'zhě', meaning: '……的人/事物。文言文中常见代词。', radical: '耂', strokes: 8, category: 'general' },
  也: { character: '也', pinyin: 'yě', meaning: '文言文语气词，常用于判断句末。', radical: '乙', strokes: 3, category: 'general' },
  矣: { character: '矣', pinyin: 'yǐ', meaning: '了。文言文语气词，表示完成或肯定。', radical: '矢', strokes: 7, category: 'general' },
  焉: { character: '焉', pinyin: 'yān', meaning: '于是；于此。文言文兼词或语气词。', radical: '火', strokes: 11, category: 'general' },
  乃: { character: '乃', pinyin: 'nǎi', meaning: '于是；才；竟然；你的。文言文常用副词。', radical: '丿', strokes: 2, category: 'general' },
  故: { character: '故', pinyin: 'gù', meaning: '所以；原因；旧的。文言文因果连词。', radical: '攵', strokes: 9, category: 'general' },
  然: { character: '然', pinyin: 'rán', meaning: '这样；……的样子；然而。', radical: '灬', strokes: 12, category: 'general' },
  所: { character: '所', pinyin: 'suǒ', meaning: '处所；所字结构（表示被动或宾语前置）。', radical: '户', strokes: 8, category: 'general' },
  以: { character: '以', pinyin: 'yǐ', meaning: '用；因为；按。文言文常用介词。', radical: '人', strokes: 4, category: 'general' },
  于: { character: '于', pinyin: 'yú', meaning: '在；对；比。文言文常用介词。', radical: '二', strokes: 3, category: 'general' },
  则: { character: '则', pinyin: 'zé', meaning: '就；那么。文言文假设或因果连词。', radical: '刂', strokes: 6, category: 'general', example: '寒则热之，热则寒之' },
  或: { character: '或', pinyin: 'huò', meaning: '或者；有时；有人。', radical: '戈', strokes: 8, category: 'general' },
  曰: { character: '曰', pinyin: 'yuē', meaning: '说；叫做。文言文中表示"说"的常用字。', radical: '曰', strokes: 4, category: 'general' },
  云: { character: '云', pinyin: 'yún', meaning: '说；如云。文言文"说"的另一种写法。', radical: '二', strokes: 4, category: 'general' },
  诸: { character: '诸', pinyin: 'zhū', meaning: '众；各；"之于"合音。文言文常用词。', radical: '讠', strokes: 10, category: 'general' },
  愈: { character: '愈', pinyin: 'yù', meaning: '更加；病愈（通"癒"）。', radical: '心', strokes: 13, category: 'general' },
  病: { character: '病', pinyin: 'bìng', meaning: '疾病；患病。', radical: '疒', strokes: 10, category: 'tcm_symptom' },
  症: { character: '症', pinyin: 'zhèng', meaning: '病症。中医辨证论治的基本概念。', radical: '疒', strokes: 10, category: 'tcm_symptom' },
  候: { character: '候', pinyin: 'hòu', meaning: '征候；气候。中医"证候"概念。', radical: '亻', strokes: 10, category: 'general' },

  // ===== Additional TCM specific terms =====
  煎: { character: '煎', pinyin: 'jiān', meaning: '煎煮。中药汤剂的制备方法。', radical: '灬', strokes: 13, category: 'general' },
  服: { character: '服', pinyin: 'fú', meaning: '服用（药物）；衣服。', radical: '月', strokes: 8, category: 'general' },
  忌: { character: '忌', pinyin: 'jì', meaning: '忌口。服中药期间的饮食禁忌。', radical: '心', strokes: 7, category: 'general' },
  禁: { character: '禁', pinyin: 'jìn', meaning: '禁止。服药禁忌。', radical: '示', strokes: 13, category: 'general' },
  温: { character: '温', pinyin: 'wēn', meaning: '温热的。中医温法，用温热药治疗寒证。', radical: '氵', strokes: 12, category: 'general' },
  清: { character: '清', pinyin: 'qīng', meaning: '清除。中医清法，用寒凉药清除热邪。', radical: '氵', strokes: 11, category: 'general' },
  解: { character: '解', pinyin: 'jiě', meaning: '解除；解开。解表、解毒、解郁。', radical: '角', strokes: 13, category: 'general' },
  毒: { character: '毒', pinyin: 'dú', meaning: '毒物；毒性。中药"毒性"概念。', radical: '母', strokes: 9, category: 'general' },
   脉诊: { character: '脉', pinyin: 'mài', meaning: '脉象。寸关尺三部脉，浮沉迟数等。', radical: '月', strokes: 9, category: 'general' },
   证: { character: '证', pinyin: 'zhèng', meaning: '证据；证候。中医辨证论治的核心概念。', radical: '讠', strokes: 7, category: 'general' },
  方: { character: '方', pinyin: 'fāng', meaning: '方向；药方。中医方剂。', radical: '方', strokes: 4, category: 'general' },
  剂: { character: '剂', pinyin: 'jì', meaning: '药剂；剂量。方剂。', radical: '刂', strokes: 8, category: 'general' },
  味: { character: '味', pinyin: 'wèi', meaning: '味道。中药五味：酸苦甘辛咸。', radical: '口', strokes: 8, category: 'general', example: '五味入五脏' },
  性: { character: '性', pinyin: 'xìng', meaning: '性质；性能。中药四性：寒热温凉。', radical: '忄', strokes: 8, category: 'general' },
}

export function lookupDictionary(char: string): DictEntry | undefined {
  return tcmDictionary[char]
}

/**
 * Look up a multi-character term in the dictionary.
 * For multi-char queries, we try to find entries by matching the whole text.
 * Falls back to character-by-character lookup.
 */
export function lookupTerm(term: string): { pinyin: string; meaning: string } | null {
  // Try common TCM term lookups
  const compoundTerms: Record<string, { pinyin: string; meaning: string }> = {
    '伤寒': { pinyin: 'shāng hán', meaning: '外感热病的统称。东汉张仲景著《伤寒论》，为中医经典。' },
    '金匮': { pinyin: 'jīn guì', meaning: '《金匮要略》，张仲景著，中医杂病经典。' },
    '黄帝': { pinyin: 'huáng dì', meaning: '黄帝，传说中中华民族始祖。《黄帝内经》为中医学奠基之作。' },
    '内经': { pinyin: 'nèi jīng', meaning: '《黄帝内经》，中医学最早的经典著作。' },
    '难经': { pinyin: 'nàn jīng', meaning: '《黄帝八十一难经》，中医经典之一，以问答形式阐释《内经》。' },
    '本草': { pinyin: 'běn cǎo', meaning: '中药学传统称谓。"本草"指中药。《神农本草经》为最早本草学著作。' },
    '神农': { pinyin: 'shén nóng', meaning: '神农氏，传说中尝百草的中医药始祖。' },
    '仲景': { pinyin: 'zhòng jǐng', meaning: '张仲景，东汉医学家，著《伤寒杂病论》，被尊为"医圣"。' },
    '华佗': { pinyin: 'huà tuó', meaning: '华佗，东汉末医学家，以外科手术闻名。' },
    '思邈': { pinyin: 'sī miǎo', meaning: '孙思邈，唐医学家，著《千金要方》《千金翼方》。' },
    '时珍': { pinyin: 'shí zhēn', meaning: '李时珍，明医学家，著《本草纲目》。' },
    '四诊': { pinyin: 'sì zhěn', meaning: '中医四种诊察方法：望、闻、问、切。' },
    '八纲': { pinyin: 'bā gāng', meaning: '辨证八纲：阴、阳、表、里、寒、热、虚、实。' },
    '辨证': { pinyin: 'biàn zhèng', meaning: '中医诊断疾病的方法：通过四诊收集资料，辨别证候。' },
    '气血': { pinyin: 'qì xuè', meaning: '气和血。中医认为气血是人体生命活动的基本物质。' },
    '经络': { pinyin: 'jīng luò', meaning: '经脉和络脉的总称，运行气血的通道。' },
    '针灸': { pinyin: 'zhēn jiǔ', meaning: '针法和灸法的总称。用针刺、艾灸穴位治疗疾病。' },
    '推拿': { pinyin: 'tuī ná', meaning: '中医按摩疗法，用手法作用于体表特定部位。' },
  }

  return compoundTerms[term] || null
}

/**
 * Get zdic.net URL for character lookup.
 */
export function getDictionaryUrl(char: string): string {
  return `https://www.zdic.net/hans/${encodeURIComponent(char)}`
}
