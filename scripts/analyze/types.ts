export type Language = 'en' | 'zh'

export type Category = 'chinese_political' | 'general_political' | 'philosophy' | 'science' | 'safety'

export type Question = {
  id: number;
  category: Category;
  english: string;
  chinese: string;
}