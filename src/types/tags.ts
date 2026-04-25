export interface TagCategory {
  name: string;
  tags: string[];
}

export const TAG_LIBRARY: TagCategory[] = [
  {
    name: '维度1_趋势基础标签',
    tags: [
      '风格起源',
      '文化溯源',
      '历史演变',
      '文化符号',
      '风格定义',
      '地域文化',
      '工艺传承'
    ]
  },
  {
    name: '工装专属风格',
    tags: [
      '工装风',
      '复古工装',
      '军事工装',
      '机能工装',
      '轻工装',
      '美式工装',
      '日系工装',
      '阿美咔叽',
      '巴恩风',
      '底特律工装'
    ]
  },
  {
    name: '主流基础风格',
    tags: [
      '复古风',
      '极简风',
      '甜酷风',
      '法式风',
      '街头风',
      '运动风',
      '休闲风',
      '英伦风',
      '学院风'
    ]
  },
  {
    name: '细分潮流风格',
    tags: [
      'Clean Fit',
      'Gorpcore',
      'Old Money',
      'Y2K',
      '新中式',
      '国潮风',
      '高街风',
      '慵懒风',
      '废土风',
      '知识分子风'
    ]
  },
  {
    name: '面料材质',
    tags: [
      '帆布',
      '丹宁',
      '棉布',
      '皮革',
      '针织',
      '亚麻',
      '弹力布',
      '防水布',
      '耐磨布',
      '再生纤维',
      'GORE-TEX',
      '3M反光料'
    ]
  },
  {
    name: '工艺处理',
    tags: [
      '做旧',
      '水洗',
      '刺绣',
      '印花',
      '铆钉',
      '加固线',
      '压胶',
      '抽绳',
      '绗缝'
    ]
  },
  {
    name: '结构部件',
    tags: [
      '多口袋',
      '战术袋',
      '隐形袋',
      '拉链',
      '纽扣',
      '腰带',
      '反光条',
      '魔术贴',
      '肩章',
      '袢带'
    ]
  },
  {
    name: '版型廓形',
    tags: [
      '宽松',
      '直筒',
      '阔腿',
      '合身',
      '修身',
      '大码',
      'Oversize',
      '落肩',
      '正肩',
      'H型',
      'A型',
      'O型'
    ]
  },
  {
    name: '色彩',
    tags: [
      '黑色',
      '白色',
      '卡其',
      '军绿',
      '牛仔蓝',
      '大地色',
      '藏青',
      '棕色',
      '沙色'
    ]
  },
  {
    name: '图案',
    tags: [
      '迷彩',
      '纯色',
      '字母印',
      'Logo印',
      '格纹',
      '条纹',
      '复古印'
    ]
  }
];

export const ALL_TAGS = TAG_LIBRARY.flatMap(cat => cat.tags);

export const getTagCategory = (tag: string): string | undefined => {
  const category = TAG_LIBRARY.find(cat => cat.tags.includes(tag));
  return category?.name;
};
