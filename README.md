# 屋久島の住所検索

[デモを見る](https://keichan34.github.io/yakushima-place-search/)

(例えば `安房1854` `小瀬田849-20` などで検索してください)

屋久島全域は地番住所を使います。新しい住所だったり、あまり交通量が無い住所（民家、商店ではない場所など）だと、Google Maps などの検索ツールで出てこないケースもあるので、作ってみました。

住所のマスターデータは、[法務省が一般公開している登記所備付地図の電子データ](https://www.moj.go.jp/MINJI/minji05_00494.html) を利用しています。

G空間情報センターに GeoJSON に変換済みのデータを加工し、住所マスターを作成します。

## データ処理の手順

* `npm install` で依存ライブラリをインストール
* [変換済みデータをG空間情報センターからダウンロードする](https://front.geospatial.jp/moj-chizu-shp-download/)
  * 屋久島町の場合は、[46505_熊毛郡屋久島町_公共座標2系_筆R_2023.geojson](https://www.geospatial.jp/ckan/dataset/70d19cbf-f89e-4b36-93e6-2bdece01f876/resource/32c57ff3-51ca-427b-907c-bdc9f8f98360/download/46505__2_r_2023.geojson) を使いました
* `data/chiban-data` ディレクトリを作成し、ダウンロードした GeoJSON ファイルのその中に移動する。
* `npm run format-chiban [GeoJSONのパス]` を実行します。
  * 出力ファイルは `data/chiban_meta.json` `data/chiban.json` `data/chiban.txt`

## 懸念点

* 屋久島町全域は公共座標系になっているため、すべてのデータが GeoJSON 変換データに含まれている。任意座標系が含まれるエリアに適用しようとするとその分の住所がマスターから抜けるのでご注意ください。
* 屋久島町では住居表示住所を導入している地域が無いため、全てが地番住所となっております。
