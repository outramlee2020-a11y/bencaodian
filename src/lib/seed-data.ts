import type { Book, Category } from '@/types'

export const categories: Category[] = [
  { id: 'jing', name: '经部', nameEn: 'Confucian Classics' },
  { id: 'shi', name: '史部', nameEn: 'History' },
  { id: 'zi', name: '子部', nameEn: 'Philosophy' },
  { id: 'ji', name: '集部', nameEn: 'Literature' },
  { id: 'fo', name: '佛教部', nameEn: 'Buddhist' },
  { id: 'dao', name: '道教部', nameEn: 'Taoist' },
]

// Traditional Chinese Medicine books from shidianguji
export const books: Book[] = [
  {
    id: 'SBCK078',
    title: '证类本草',
    titleCn: '證類本草',
    author: '唐慎微',
    authorDynasty: '北宋',
    description:
      '《证类本草》是宋代唐慎微编纂的一部本草学巨著，广泛收录了前代本草文献及经史百家有关药物的知识，集宋以前本草学之大成。全书载药1746种，附方3000余首。李时珍《本草纲目》即以本书为蓝本。',
    category: categories[2], // 子部
    subcategory: '医家',
    edition: '四部丛刊景上海涵芬楼藏金刊本',
    coverUrl:
      'https://p3-ancientlib-sign.byteimg.com/tos-cn-i-ceu0di7tn2/read/SBCK078/1/book-meta/1/0-1irpg3pp1a8u0-SBCK078_000000.webp~tplv-ceu0di7tn2-presize-v1:300:q70.png',
    dynasty: '宋代',
    totalChapters: 30,
    quality: 'polished',
    createdAt: '2024-01-15',
  },
  {
    id: 'NGJ89241199902754747156',
    title: '本草发明蒙筌',
    titleCn: '本草發明蒙筌',
    author: '陈嘉谟',
    authorDynasty: '明',
    description:
      '《本草发明蒙筌》为明代陈嘉谟所撰本草学著作。全书分总论、各论两部分。总论论述药性理论，各论按部类分述药物，载药约600种。每一药物之下，先述其性味、功效、主治，次述其临床应用及配伍，多为作者临证经验之总结。',
    category: categories[2],
    subcategory: '医家',
    edition: '明刻本',
    coverUrl:
      '//lf-welfare.amemv.com/obj/douyin-welfare-image/guji/shidian/static/image/search-book-cover-default.9f0b0fd2.png',
    dynasty: '明代',
    totalChapters: 12,
    quality: 'rough',
    createdAt: '2024-02-20',
  },
  {
    id: 'DZ0769',
    title: '图经衍义本草',
    titleCn: '圖經衍義本草',
    author: '寇宗奭',
    authorDynasty: '北宋',
    description:
      '《图经衍义本草》是寇宗奭在《本草图经》基础上加以衍义补充而成。书中对药物的形态、产地、采收、炮制、性味、功效等均有详细论述，并附图说明。',
    category: categories[2],
    subcategory: '医家',
    edition: '上海涵芬楼影印明《正统道藏》本',
    coverUrl:
      '//lf-welfare.amemv.com/obj/douyin-welfare-image/guji/shidian/static/image/search-book-cover-default.9f0b0fd2.png',
    dynasty: '宋代',
    totalChapters: 20,
    quality: 'rough',
    createdAt: '2024-03-10',
  },
  {
    id: 'HY1549',
    title: '本草发明切要',
    titleCn: '本草發明切要',
    author: '张三锡',
    authorDynasty: '明',
    description:
      '《本草发明切要》为明代张三锡撰，王肯堂校。本书精选常用药物，阐发其要义，注重临床实用。张氏认为"医者不明本草，犹兵之不明兵器"，故著此书以阐发本草精要。',
    category: categories[2],
    subcategory: '医家',
    edition: '万历刻崇祯十七年张维藩等重修本',
    coverUrl:
      '//lf-welfare.amemv.com/obj/douyin-welfare-image/guji/shidian/static/image/search-book-cover-default.9f0b0fd2.png',
    dynasty: '明代',
    totalChapters: 6,
    quality: 'rough',
    createdAt: '2024-04-05',
  },
  {
    id: 'SBCK011',
    title: '论语',
    titleCn: '論語',
    author: '何晏',
    authorDynasty: '三国',
    description:
      '《论语》是孔子及其弟子的语录结集，由孔子弟子及再传弟子编写而成。该书是儒家学派的经典著作之一，与《大学》《中庸》《孟子》并称"四书"。',
    category: categories[0],
    subcategory: '四书',
    edition: '四部丛刊景长沙叶氏观古堂藏日本正平刊本',
    coverUrl:
      'https://p3-ancientlib-sign.byteimg.com/tos-cn-i-ceu0di7tn2/recommendBookCover/SBCK011_v2.webp~tplv-ceu0di7tn2-png.png',
    dynasty: '战国',
    totalChapters: 20,
    quality: 'polished',
    createdAt: '2024-01-01',
  },
  {
    id: 'SBCK051',
    title: '荀子',
    titleCn: '荀子',
    author: '荀况',
    authorDynasty: '战国',
    description:
      '《荀子》是战国时期荀子和弟子们整理或记录他人言行的著作。全书共三十二篇，其学说范围广阔，主张"性恶论"，强调礼法并用。',
    category: categories[2],
    subcategory: '儒家',
    edition: '四部丛刊景上海涵芬楼藏黎氏景宋刊本',
    coverUrl:
      'https://p3-ancientlib-sign.byteimg.com/tos-cn-i-ceu0di7tn2/recommendBookCover/SBCK051_v2.webp~tplv-ceu0di7tn2-png.png',
    dynasty: '战国',
    totalChapters: 32,
    quality: 'polished',
    createdAt: '2024-01-10',
  },
  {
    id: 'HY1492',
    title: '黄帝内经素问',
    titleCn: '黃帝內經素問',
    author: '王冰',
    authorDynasty: '唐',
    description:
      '《黄帝内经素问》是中医学奠基之作，与《灵枢》合称《黄帝内经》。全书以黄帝与岐伯问答形式，论述了人体生理、病理、诊断、治疗等医学理论，建立了中医理论体系。',
    category: categories[2],
    subcategory: '医家',
    edition: '明代刊本',
    coverUrl:
      '//lf-welfare.amemv.com/obj/douyin-welfare-image/guji/shidian/static/image/search-book-cover-default.9f0b0fd2.png',
    dynasty: '唐代',
    totalChapters: 81,
    quality: 'polished',
    createdAt: '2024-02-01',
  },
  {
    id: 'HY1493',
    title: '伤寒论',
    titleCn: '傷寒論',
    author: '张仲景',
    authorDynasty: '东汉',
    description:
      '《伤寒论》为东汉张仲景所著，是中医学最重要的经典著作之一。全书系统论述了外感热病的辨证论治规律，创立了六经辨证体系，载方113首，被后世誉为"方书之祖"。',
    category: categories[2],
    subcategory: '医家',
    edition: '明代赵开美校刻本',
    coverUrl:
      '//lf-welfare.amemv.com/obj/douyin-welfare-image/guji/shidian/static/image/search-book-cover-default.9f0b0fd2.png',
    dynasty: '东汉',
    totalChapters: 10,
    quality: 'polished',
    createdAt: '2024-02-15',
  },
  {
    id: 'HY1501',
    title: '本草纲目',
    titleCn: '本草綱目',
    author: '李时珍',
    authorDynasty: '明',
    description:
      '《本草纲目》是明代李时珍撰写的药学巨著，全书52卷，载药1892种，附方11096首，附图1160幅。该书集中国16世纪以前药学之大成，被达尔文誉为"中国古代的百科全书"。',
    category: categories[2],
    subcategory: '医家',
    edition: '金陵初刻本',
    coverUrl:
      '//lf-welfare.amemv.com/obj/douyin-welfare-image/guji/shidian/static/image/search-book-cover-default.9f0b0fd2.png',
    dynasty: '明代',
    totalChapters: 52,
    quality: 'polished',
    createdAt: '2024-03-01',
  },
  {
    id: 'HY1510',
    title: '神农本草经',
    titleCn: '神農本草經',
    author: '佚名',
    authorDynasty: '东汉',
    description:
      '《神农本草经》是我国现存最早的中药学专著，约成书于东汉时期。全书载药365种，按上中下三品分类，总结了药物的性味、功效、主治等，奠定了中药学理论基础。',
    category: categories[2],
    subcategory: '医家',
    edition: '清代孙星衍辑本',
    coverUrl:
      '//lf-welfare.amemv.com/obj/douyin-welfare-image/guji/shidian/static/image/search-book-cover-default.9f0b0fd2.png',
    dynasty: '东汉',
    totalChapters: 3,
    quality: 'polished',
    createdAt: '2024-03-15',
  },
  {
    id: 'HY1520',
    title: '金匮要略',
    titleCn: '金匱要略',
    author: '张仲景',
    authorDynasty: '东汉',
    description:
      '《金匮要略》为张仲景所著《伤寒杂病论》的杂病部分，是我国现存最早的一部诊治杂病的专著。全书共25篇，载方262首，系统论述了内科、外科、妇科等杂病的辨证论治。',
    category: categories[2],
    subcategory: '医家',
    edition: '明代刊本',
    coverUrl:
      '//lf-welfare.amemv.com/obj/douyin-welfare-image/guji/shidian/static/image/search-book-cover-default.9f0b0fd2.png',
    dynasty: '东汉',
    totalChapters: 25,
    quality: 'polished',
    createdAt: '2024-04-01',
  },
  {
    id: 'HY1530',
    title: '针灸甲乙经',
    titleCn: '針灸甲乙經',
    author: '皇甫谧',
    authorDynasty: '晋',
    description:
      '《针灸甲乙经》是魏晋时期皇甫谧编纂的针灸学专著，是我国现存最早的针灸学经典。全书12卷，128篇，系统论述了人体腧穴、针灸方法及临床治疗。',
    category: categories[2],
    subcategory: '医家',
    edition: '明代刊本',
    coverUrl:
      '//lf-welfare.amemv.com/obj/douyin-welfare-image/guji/shidian/static/image/search-book-cover-default.9f0b0fd2.png',
    dynasty: '晋代',
    totalChapters: 12,
    quality: 'rough',
    createdAt: '2024-04-15',
  },
  {
    id: 'NA05254',
    title: '本草原始·本草发明',
    titleCn: '本草原始·本草發明',
    author: '李中立·皇甫嵩',
    authorDynasty: '明',
    description:
      '《本草原始》为明代李中立撰，载药约500种，以绘图精细著称。《本草发明》为明代皇甫嵩撰，阐发药性理论与临床应用。此二书合刊，相得益彰。',
    category: categories[2],
    subcategory: '医家',
    edition: '明刻本',
    coverUrl:
      '//lf-welfare.amemv.com/obj/douyin-welfare-image/guji/shidian/static/image/search-book-cover-default.9f0b0fd2.png',
    dynasty: '明代',
    totalChapters: 14,
    quality: 'rough',
    createdAt: '2024-05-01',
  },
  {
    id: 'SBCK012',
    title: '孟子',
    titleCn: '孟子',
    author: '孟轲',
    authorDynasty: '战国',
    description:
      '《孟子》是儒家经典之一，记载了孟子及其弟子的政治、教育、哲学等思想观点。',
    category: categories[0],
    subcategory: '四书',
    edition: '四部丛刊景清内府藏宋刊大字本',
    coverUrl:
      'https://p3-ancientlib-sign.byteimg.com/tos-cn-i-ceu0di7tn2/recommendBookCover/SBCK012_v2.webp~tplv-ceu0di7tn2-png.png',
    dynasty: '战国',
    totalChapters: 7,
    quality: 'polished',
    createdAt: '2024-01-05',
  },
  {
    id: 'HY1600',
    title: '诸病源候论',
    titleCn: '諸病源候論',
    author: '巢元方',
    authorDynasty: '隋',
    description:
      '《诸病源候论》是隋代巢元方等人编撰的我国第一部病因证候学专著。全书50卷，分67门，载列证候1739条，系统论述了内、外、妇、儿、五官等各科疾病的病因、病机与证候。',
    category: categories[2],
    subcategory: '医家',
    edition: '明代刊本',
    coverUrl:
      '//lf-welfare.amemv.com/obj/douyin-welfare-image/guji/shidian/static/image/search-book-cover-default.9f0b0fd2.png',
    dynasty: '隋代',
    totalChapters: 50,
    quality: 'rough',
    createdAt: '2024-05-15',
  },
  {
    id: 'HY1650',
    title: '医宗金鉴',
    titleCn: '醫宗金鑑',
    author: '吴谦',
    authorDynasty: '清',
    description:
      '《医宗金鉴》是清代乾隆年间由太医院判吴谦主持编纂的医学丛书，全书90卷，包括《订正伤寒论注》《金匮要略注》《删补名医方论》等15种，是清代最重要的医学教科书。',
    category: categories[2],
    subcategory: '医家',
    edition: '清乾隆武英殿刊本',
    coverUrl:
      '//lf-welfare.amemv.com/obj/douyin-welfare-image/guji/shidian/static/image/search-book-cover-default.9f0b0fd2.png',
    dynasty: '清代',
    totalChapters: 90,
    quality: 'polished',
    createdAt: '2024-06-01',
  },
]

// Sample chapters for a book
export const sampleChapters = [
  { id: 'ch1', number: 1, title: '序', level: 1 },
  { id: 'ch2', number: 2, title: '卷一·上', level: 1 },
  { id: 'ch3', number: 3, title: '卷一·下', level: 1 },
  { id: 'ch4', number: 4, title: '卷二', level: 1 },
  { id: 'ch5', number: 5, title: '卷三·上', level: 1 },
  { id: 'ch6', number: 6, title: '卷三·下', level: 1 },
]

// Sample chapter content
export const sampleChapterText = `夫医药之为道，所以济夭札，全生民，其功溥矣。自神农氏尝百草，辨药性，而本草之学始兴。嗣后，《灵枢》《素问》阐发医理，《伤寒》《金匮》垂示方剂，而医学大备。然药性有寒热温凉之异，气味有厚薄升降之殊，非深究其理，不能得其要也。

本草之书，始于《神农本经》，三品分类，凡三百六十五种。梁陶弘景《本草经集注》增之，唐苏敬《新修本草》又增之，宋唐慎微《证类本草》益加详备。然历代相沿，传写多讹，学者每苦其繁而难精。

余尝读本草诸书，见其论药之性味功能，或此是而彼非，或前略而后详，未有能会通其说者。乃不自揆，采集诸家之说，参以己见，撰为是编。凡药物之性味、功能、主治、用法，无不备载，而有疑者则阙之，不敢妄为附会。

夫药之为用，犹兵之用于战也。兵有奇正，药有君臣。用之得当，则沉疴可起；用之失宜，则小疾亦危。故医者不可不深究药性，而用药不可不慎也。

书成，名曰《本草发明》，盖欲发明本草之奥义，使学者了然于心目之间。若夫探赜索隐，钩深致远，则犹有望于后之君子云尔。

时万历某年某月某日，皇甫嵩谨序。`

export const sampleChapterText2 = `本草发明卷之一

草部上

人参

味甘，微寒，无毒。主补五脏，安精神，定魂魄，止惊悸，除邪气，明目，开心，益智。久服轻身延年。

按：人参禀中和之气，为补气之圣药。其味甘而微苦，性微寒而兼温。五脏之中，尤补心肺脾胃。凡气虚者，无论脏腑经络，皆可用之。

然人参虽补，亦有不宜。肺热咳嗽者忌之，阴虚火动者慎之，实热证不可用。用当与诸药相配，或佐以他药，方能尽其功。

白术

味苦甘，温，无毒。主风寒湿痹，死肌，痉疸，止汗，除热，消食。作煎饵，久服轻身延年，不饥。

白术为健脾之要药。其味苦能燥湿，甘能补中，温能散寒。凡脾胃虚寒，饮食不消，泄泻水肿，皆赖以治。

黄芪

味甘，微温，无毒。主痈疽久败疮，排脓止痛，大风癞疾，五痔鼠瘘，补虚，小儿百病。

黄芪为补气之良品，其功专于益气固表。凡气虚表弱，自汗盗汗，或脾肺气虚，食少倦怠，皆可用之。`

export function searchBooks(query: string, category?: string): Book[] {
  let filtered = books

  if (category && category !== 'all') {
    filtered = filtered.filter((b) => b.category.id === category)
  }

  if (query) {
    const q = query.toLowerCase()
    filtered = filtered.filter(
      (b) =>
        b.title.toLowerCase().includes(q) ||
        b.titleCn.toLowerCase().includes(q) ||
        b.author.toLowerCase().includes(q) ||
        b.description.toLowerCase().includes(q)
    )
  }

  return filtered
}

export function getBookById(id: string): Book | undefined {
  return books.find((b) => b.id === id)
}

export function getBooksByCategory(categoryId: string): Book[] {
  return books.filter((b) => b.category.id === categoryId)
}

export function getFeaturedBooks(): Book[] {
  return books.filter((b) => b.quality === 'polished').slice(0, 6)
}
