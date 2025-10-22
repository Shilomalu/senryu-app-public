import glob
import csv
import os
import re
import sys

#ipadicのインストール方法(mecabも一緒に入ります)
# sudo apt update
# sudo apt install mecab mecab-ipadic-utf8 libmecab-dev

#PATHの確認方法
# mecab-config --dicdir

#ここは各自, 上で確認したPATHに変更してください
IPADIC_PATH = "/usr/share/mecab/dic/ipadic"

class Checker:
    def __init__(self):
        self.ipadic_set = set()
        self.ipadic_words = dict()
        for csv_file in glob.glob(os.path.join(IPADIC_PATH, "*.csv")):
            with open(csv_file, encoding="euc-jp") as f:
                for row in csv.reader(f):
                    if row:
                        self.ipadic_set.add(row[0])
                        self.ipadic_words.setdefault(row[0], {"品詞": [], "品詞細分類": [], "読み方": []})
                        self.ipadic_words[row[0]]["品詞"].append(row[4])
                        self.ipadic_words[row[0]]["品詞細分類"].append(row[5])
                        self.ipadic_words[row[0]]["読み方"].append(row[11])

    #入力: 文字列S -> 出力: 読みの長さcount　(ひらがな,カタカナ,漢字のみ対応)
    def counter(self, S):
        N = len(S)
        count = 0

        hiragana = re.compile('[\u3041-\u309F]+')
        katakana = re.compile('[\u30A1-\u30FF\uFF66-\uFF9F]+')
        kanji = re.compile('[\u2E80-\u2FDF\u3005-\u3007\u3400-\u4DBF\u4E00-\u9FFF\uF900-\uFAFF\U00020000-\U0002EBEF]+')

        l = 0
        while l < N:
            if hiragana.match(S[l]) or katakana.match(S[l]) or kanji.match(S[l]):
                r = N+1
                while r > l:
                    if S[l:r] in self.ipadic_set:
                        yomi = self.ipadic_words[S[l:r]]["読み方"]
                        count += len(yomi[0])
                        print(yomi, count)
                        l = r-1
                        break
                    r -= 1
                else: count += 1

            else: pass
            l += 1

        return count



checker = Checker()
for line in sys.stdin:
    if not line.strip():
        continue

    print(checker.counter(line), flush=True)
