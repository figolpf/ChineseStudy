(function () {
  const O = "#e07a3d";
  const T = "#1f8a7a";
  const B = "#3d7ea6";
  const P = "#6d5bd0";
  const G = "#2d6a4f";
  const G2 = "#40916c";
  const GOLD = "#e09f3e";
  const CORAL = "#e76f51";
  const SOIL = "#a97142";

  window.STRUCT = {
    独体: "独体字",
    左右: "左右结构",
    上下: "上下结构",
    品字: "品字结构"
  };

  window.LEVELS = [
    { id: 1, name: "看图识字", step: "第一关", mark: "日", desc: "图画里藏着字", detail: "这些字，是看着样子写出来的。" },
    { id: 2, name: "生活常用", step: "第二关", mark: "一", desc: "数字、家人、身边的字", detail: "数一数，叫一叫，都是每天会碰到的字。" },
    { id: 3, name: "字形结构", step: "第三关", mark: "明", desc: "一个字分成几块", detail: "一块一块认，字的样子就清楚了。" },
    { id: 4, name: "组词游戏", step: "第四关", mark: "林", desc: "把认识的字连成词", detail: "这些词，都是学过的字组成的。" }
  ];

  window.CHARS = [
    { char: "日", level: 1, pinyin: "rì", word: "太阳", say: "日，太阳的日", scene: "sun", structure: "独体", story: "圆圆的太阳，写成了这个字。", notes: [
      { say: "外面这一圈，像太阳圆圆的边。" },
      { say: "中间一横，像太阳的光。" }
    ]},
    { char: "月", level: 1, pinyin: "yuè", word: "月亮", say: "月，月亮的月", scene: "moon", structure: "独体", story: "弯弯的月亮，写成了这个字。", notes: [
      { say: "身子弯弯的，像夜空里的月牙。" }
    ]},
    { char: "水", level: 1, pinyin: "shuǐ", word: "流水", say: "水，流水的水", scene: "water", structure: "独体", story: "流水弯弯曲曲，写成了这个字。", notes: [
      { say: "中间一竖，像一道水流。" },
      { say: "两边的笔画，像溅开的水花。" }
    ]},
    { char: "火", level: 1, pinyin: "huǒ", word: "火焰", say: "火，火焰的火", scene: "fire", structure: "独体", story: "红红的火焰，写成了这个字。", notes: [
      { say: "上面两点像火星，下面像火苗张开。" }
    ]},
    { char: "山", level: 1, pinyin: "shān", word: "高山", say: "山，高山的山", scene: "mountain", structure: "独体", story: "三座山峰站在一起，中间那座最高。", notes: [
      { say: "中间高，两边矮，就像远远的山。" }
    ]},
    { char: "人", level: 1, pinyin: "rén", word: "人", say: "人", scene: "person", structure: "独体", story: "侧过身站好，就像这个字。", notes: [
      { say: "一撇一捺，像一个人迈开腿。" }
    ]},
    { char: "口", level: 1, pinyin: "kǒu", word: "嘴巴", say: "口，嘴巴的口", scene: "mouth", structure: "独体", story: "张大嘴巴，变成方方的口。", notes: [
      { say: "方方的一圈，像一张张开的嘴。" }
    ]},
    { char: "目", level: 1, pinyin: "mù", word: "眼睛", say: "目，眼睛的目", scene: "eye", structure: "独体", story: "眼睛长长的，里面看着亮亮的。", notes: [
      { say: "外框像眼睛的外形，里面的横像目光。" }
    ]},
    { char: "木", level: 1, pinyin: "mù", word: "树木", say: "木，树木的木", scene: "tree", structure: "独体", story: "一棵小树：有树干，有树枝，还有树根。", notes: [
      { say: "一竖像树干，一横像树枝。" },
      { say: "下面的撇和捺，像伸进土里的根。" }
    ]},
    { char: "田", level: 1, pinyin: "tián", word: "田地", say: "田，田地的田", scene: "field", structure: "独体", story: "一块田，被分成一小块一小块。", notes: [
      { say: "外面是田埂，里面一横一竖，分成四小块。" }
    ]},
    { char: "鸟", level: 1, pinyin: "niǎo", word: "小鸟", say: "鸟，小鸟的鸟", scene: "bird", structure: "独体", story: "小鸟有头，有身子，写成了这个字。", notes: [
      { say: "抬头看看，是不是有点像一只鸟。" }
    ]},
    { char: "鱼", level: 1, pinyin: "yú", word: "小鱼", say: "鱼，小鱼的鱼", scene: "fish", structure: "独体", story: "小鱼摇着尾巴，游成了这个字。", notes: [
      { say: "上面像鱼头和鱼身，下面一横像水面。" }
    ]},

    { char: "一", level: 2, pinyin: "yī", word: "一个", say: "一，一个的一", scene: "one", structure: "独体", story: "只有一横，就是数字一。", notes: [
      { say: "一个苹果，写成直直的一横。" }
    ]},
    { char: "二", level: 2, pinyin: "èr", word: "两个", say: "二，两个的二", scene: "two", structure: "独体", story: "两横，就是数字二。上面短，下面长。", notes: [
      { say: "数一数，两横就是二。" }
    ]},
    { char: "三", level: 2, pinyin: "sān", word: "三个", say: "三，三个的三", scene: "three", structure: "独体", story: "三横叠在一起，就是数字三。", notes: [
      { say: "一横、两横、三横，数一数。" }
    ]},
    { char: "十", level: 2, pinyin: "shí", word: "十个", say: "十，十个的十", scene: "ten", structure: "独体", story: "一横一竖，交在一起就是十。", notes: [
      { say: "横和竖当中交叉，像一个十字。" }
    ]},
    { char: "上", level: 2, pinyin: "shàng", word: "上面", say: "上，上面的上", scene: "up", structure: "独体", story: "长横像地面，别的笔画都在上面。", notes: [
      { say: "下面一长横像地面，字在地面的上面。" }
    ]},
    { char: "下", level: 2, pinyin: "xià", word: "下面", say: "下，下面的下", scene: "down", structure: "独体", story: "有一笔伸到下面去，就是下。", notes: [
      { say: "长横像地面，有一笔探到地面下面。" }
    ]},
    { char: "大", level: 2, pinyin: "dà", word: "大大", say: "大，大大的大", scene: "big", structure: "独体", story: "人把胳膊和腿张开，就是大大的大。", notes: [
      { say: "一横像张开的胳膊，撇和捺像两条腿。" }
    ]},
    { char: "小", level: 2, pinyin: "xiǎo", word: "小小", say: "小，小小的小", scene: "small", structure: "独体", story: "小小的三笔，收得紧紧的。", notes: [
      { say: "中间一竖，左右两点，看起来小小的。" }
    ]},
    { char: "天", level: 2, pinyin: "tiān", word: "天空", say: "天，天空的天", scene: "sky", structure: "上下", split: 0.30, story: "大字上面加一横，头顶上就是天。", parts: [
      { t: "一", name: "一横", say: "头顶上面，加一横。", color: B },
      { t: "大", name: "大", say: "下面是大，人站在天底下。", color: O }
    ]},
    { char: "女", level: 2, pinyin: "nǚ", word: "女孩", say: "女，女孩的女", scene: "woman", structure: "独体", story: "这是女孩的女，字形像一个人交着手。", notes: [
      { say: "像一个人轻轻交叉着手。" }
    ]},
    { char: "子", level: 2, pinyin: "zǐ", word: "孩子", say: "子，孩子的子", scene: "child", structure: "独体", story: "这是孩子的子，头顶上还翘着一笔。", notes: [
      { say: "像一个小人，脑袋上有一笔。" }
    ]},
    { char: "妈", level: 2, pinyin: "mā", word: "妈妈", say: "妈，妈妈的妈", scene: "mom", structure: "左右", split: 0.46, story: "左边是女，右边像一匹马，合起来是妈妈。", parts: [
      { t: "女", name: "女", say: "左边是女，女孩的女。", color: P },
      { t: "马", name: "马", say: "右边像一匹马。", color: O }
    ]},
    { char: "爸", level: 2, pinyin: "bà", word: "爸爸", say: "爸，爸爸的爸", scene: "dad", structure: "上下", split: 0.48, story: "爸爸的爸，分成上下两截。", parts: [
      { t: "父", name: "上面", say: "上面一截。", color: P },
      { t: "巴", name: "下面", say: "下面一截，合起来是爸。", color: O }
    ]},
    { char: "我", level: 2, pinyin: "wǒ", word: "我", say: "我", scene: "me", structure: "独体", story: "指着自己，就是我。", notes: [
      { say: "说话的这个人，就是我。" }
    ]},
    { char: "手", level: 2, pinyin: "shǒu", word: "小手", say: "手，小手的手", scene: "hand", structure: "独体", story: "伸出一只手，写成这个字。", notes: [
      { say: "看一看，像不像手指并在一起。" }
    ]},
    { char: "地", level: 2, pinyin: "dì", word: "土地", say: "地，土地的地", scene: "earth", structure: "左右", split: 0.40, story: "左边像一小堆土，合起来就是土地的地。", parts: [
      { t: "土", name: "土", say: "左边像土。", color: SOIL },
      { t: "也", name: "也", say: "右边是也，合起来是地。", color: T }
    ]},

    { char: "明", level: 3, pinyin: "míng", word: "明亮", say: "明，明亮的明", scene: "bright", structure: "左右", split: 0.50, story: "太阳和月亮站在一起，天就亮了。", parts: [
      { t: "日", name: "日", say: "左边是日，太阳。", color: GOLD },
      { t: "月", name: "月", say: "右边是月，月亮。", color: B }
    ]},
    { char: "林", level: 3, pinyin: "lín", word: "树林", say: "林，树林的林", scene: "woods", structure: "左右", split: 0.50, story: "一棵树，再一棵树，就是林。", parts: [
      { t: "木", name: "木", say: "左边一棵树。", color: G },
      { t: "木", name: "木", say: "右边又一棵树。", color: G2 }
    ]},
    { char: "从", level: 3, pinyin: "cóng", word: "跟着", say: "从，跟着的从", scene: "follow", structure: "左右", split: 0.50, story: "一个人跟着另一个人，就是从。", parts: [
      { t: "人", name: "人", say: "左边一个人。", color: CORAL },
      { t: "人", name: "人", say: "右边一个人跟着。", color: GOLD }
    ]},
    { char: "休", level: 3, pinyin: "xiū", word: "休息", say: "休，休息的休", scene: "rest", structure: "左右", split: 0.38, story: "人靠在树旁边歇一歇，就是休。", parts: [
      { t: "人", name: "人", say: "左边是人。", color: CORAL },
      { t: "木", name: "木", say: "右边是树，靠着歇一歇。", color: G }
    ]},
    { char: "好", level: 3, pinyin: "hǎo", word: "很好", say: "好，很好的好", scene: "good", structure: "左右", split: 0.46, story: "女和子在一起，就是好。", parts: [
      { t: "女", name: "女", say: "左边是女。", color: P },
      { t: "子", name: "子", say: "右边是子，在一起真好。", color: GOLD }
    ]},
    { char: "早", level: 3, pinyin: "zǎo", word: "早上", say: "早，早上的早", scene: "morning", structure: "上下", split: 0.60, story: "太阳升起来，新的一天开始了。", parts: [
      { t: "日", name: "日", say: "上面是日，太阳出来了。", color: GOLD },
      { t: "十", name: "十", say: "下面是十。", color: O }
    ]},
    { char: "尖", level: 3, pinyin: "jiān", word: "尖尖", say: "尖，尖尖的尖", scene: "sharp", structure: "上下", split: 0.40, story: "上面小，下面大，看起来尖尖的。", parts: [
      { t: "小", name: "小", say: "上面是小。", color: B },
      { t: "大", name: "大", say: "下面是大，上小下大就是尖。", color: O }
    ]},
    { char: "杏", level: 3, pinyin: "xìng", word: "杏子", say: "杏，杏子的杏", scene: "apricot", structure: "上下", split: 0.56, story: "树上面结的果子，叫杏。", parts: [
      { t: "木", name: "木", say: "上面是木，一棵树。", color: G },
      { t: "口", name: "口", say: "下面是口。", color: CORAL }
    ]},
    { char: "炎", level: 3, pinyin: "yán", word: "热热", say: "炎，热热的炎", scene: "hot", structure: "上下", split: 0.50, story: "两团火叠在一起，热热的。", parts: [
      { t: "火", name: "火", say: "上面一团火。", color: CORAL },
      { t: "火", name: "火", say: "下面又一团火。", color: GOLD }
    ]},
    { char: "森", level: 3, pinyin: "sēn", word: "森林", say: "森，森林的森", scene: "forest", structure: "品字", story: "三棵树抱在一起，就是森林的森。", parts: [
      { t: "木", name: "木", say: "上面一棵树。", color: G },
      { t: "木", name: "木", say: "左下一棵树。", color: G2 },
      { t: "木", name: "木", say: "右下还有一棵树。", color: "#1b4332" }
    ]},
    { char: "众", level: 3, pinyin: "zhòng", word: "许多人", say: "众，许多人的众", scene: "crowd", structure: "品字", story: "三个人站在一起，人很多，就是众。", parts: [
      { t: "人", name: "人", say: "上面一个人。", color: CORAL },
      { t: "人", name: "人", say: "左下一个人。", color: GOLD },
      { t: "人", name: "人", say: "右下一个人。", color: T }
    ]},
    { char: "晶", level: 3, pinyin: "jīng", word: "亮晶晶", say: "晶，亮晶晶的晶", scene: "crystal", structure: "品字", story: "三个日字亮晶晶，就是晶。", parts: [
      { t: "日", name: "日", say: "上面一个日。", color: GOLD },
      { t: "日", name: "日", say: "左下一个日。", color: O },
      { t: "日", name: "日", say: "右下一个日，亮晶晶。", color: "#f4a261" }
    ]}
  ];

  window.WORDS = [
    { word: "山水", pinyin: "shān shuǐ", scene: "landscape", line: "远远的山，长长的水。", chars: ["山", "水"] },
    { word: "大火", pinyin: "dà huǒ", scene: "bigfire", line: "好大的一团火。", chars: ["大", "火"] },
    { word: "爸爸", pinyin: "bà ba", scene: "dad", line: "爸爸笑眯眯。", chars: ["爸", "爸"] },
    { word: "妈妈", pinyin: "mā ma", scene: "mom", line: "妈妈在身边。", chars: ["妈", "妈"] },
    { word: "小鸟", pinyin: "xiǎo niǎo", scene: "bird", line: "小鸟展开翅膀。", chars: ["小", "鸟"] },
    { word: "小鱼", pinyin: "xiǎo yú", scene: "fish", line: "小鱼在水里游。", chars: ["小", "鱼"] },
    { word: "森林", pinyin: "sēn lín", scene: "forest", line: "森林里有好多树。", chars: ["森", "林"] },
    { word: "水晶", pinyin: "shuǐ jīng", scene: "gemwater", line: "水晶亮晶晶。", chars: ["水", "晶"] },
    { word: "早上好", pinyin: "zǎo shang hǎo", scene: "morning", line: "太阳出来了，说早上好。", chars: ["早", "上", "好"] },
    { word: "火山", pinyin: "huǒ shān", scene: "volcano", line: "山头上有一团火。", chars: ["火", "山"] },
    { word: "杏子", pinyin: "xìng zi", scene: "apricot", line: "树上结着杏子。", chars: ["杏", "子"] },
    { word: "众人", pinyin: "zhòng rén", scene: "crowd", line: "好多人站在一起。", chars: ["众", "人"] },
    { word: "明月", pinyin: "míng yuè", scene: "brightmoon", line: "月亮又圆又亮。", chars: ["明", "月"] },
    { word: "三十", pinyin: "sān shí", scene: "thirty", line: "三个十，是三十。", chars: ["三", "十"] },
    { word: "天地", pinyin: "tiān dì", scene: "world", line: "上面是天，下面是地。", chars: ["天", "地"] },
    { word: "大小", pinyin: "dà xiǎo", scene: "bigsmall", line: "一个大，一个小。", chars: ["大", "小"] }
  ];
})();
