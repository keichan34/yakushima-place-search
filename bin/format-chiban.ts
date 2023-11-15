import type { GeoJSON } from 'geojson';

import polylabel from 'polylabel';
import fs from 'fs';

const FILTER_REGEX = /^\d+(-\d+)?$/;
const EXTRA_META: { [key: string]: { romaji: string, kana: string} } = {
  "一湊": {
    "romaji": "issou",
    "kana": "いっそう",
  },
  "中間": {
    "romaji": "nakama",
    "kana": "なかま",
  },
  "原": {
    "romaji": "hara",
    "kana": "はら",
  },
  "口永良部島": {
    "romaji": "kuchinoerabujima",
    "kana": "くちのえらぶじま",
  },
  "吉田": {
    "romaji": "yoshida",
    "kana": "よしだ",
  },
  "安房": {
    "romaji": "anbou",
    "kana": "あんぼう",
  },
  "宮之浦": {
    "romaji": "miyanoura",
    "kana": "みやのうら",
  },
  "小島": {
    "romaji": "kojima",
    "kana": "こじま",
  },
  "小瀬田": {
    "romaji": "koseda",
    "kana": "こせだ",
  },
  "尾之間": {
    "romaji": "onoaida",
    "kana": "おのあいだ",
  },
  "平内": {
    "romaji": "hirauchi",
    "kana": "ひらうち",
  },
  "志戸子": {
    "romaji": "shitogo",
    "kana": "しとご",
  },
  "栗生": {
    "romaji": "kurio",
    "kana": "くりお",
  },
  "楠川": {
    "romaji": "kusukawa",
    "kana": "くすかわ",
  },
  "永田": {
    "romaji": "nagata",
    "kana": "ながた",
  },
  "湯泊": {
    "romaji": "yudomari",
    "kana": "ゆどまり",
  },
  "船行": {
    "romaji": "funayuki",
    "kana": "ふなゆき",
  },
  "麦生": {
    "romaji": "mugio",
    "kana": "むぎお",
  },
};

(async (argv: string[]) => {
  const inputRaw = await fs.promises.readFile(argv[0], 'utf-8');
  const input = JSON.parse(inputRaw) as GeoJSON.FeatureCollection<GeoJSON.Polygon>;

  // console.log(input.features.length);

  const chiban_meta: {
    oazas: { [key: string]: {
      start: number,
      end: number,
      romaji: string,
      kana: string,
    } }
  } = {
    oazas: {},
  };

  input.features.sort((a, b) => {
    // keep oaza together, because we'll be using it as a key
    const a_oaza = a.properties?.['大字名'];
    const b_oaza = b.properties?.['大字名'];
    if (!a_oaza || !b_oaza) {
      return 0;
    }
    return a_oaza.localeCompare(b_oaza);
  });

  const output = await fs.promises.open('./data/chiban.json', 'w');
  const output2 = await fs.promises.open('./data/chiban.txt', 'w');
  let output2_pos = 0, last_oaza: string | undefined;
  for (const feature of input.features) {
    const chiban = feature.properties?.['地番'];
    const oaza = feature.properties?.['大字名'];
    if (!chiban || !oaza) {
      continue;
    }
    if (!FILTER_REGEX.test(chiban)) {
      continue;
    }

    if (last_oaza !== oaza) {
      last_oaza = oaza;
      chiban_meta.oazas[oaza] = {
        start: output2_pos,
        end: -1,
        romaji: EXTRA_META[oaza]?.romaji || '',
        kana: EXTRA_META[oaza]?.kana || '',
      };
    }

    const center = polylabel(feature.geometry.coordinates);

    const pointFeature: GeoJSON.Feature<GeoJSON.Point> = {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: center,
      },
      properties: {
        oaza,
        chiban,
      },
    };

    await output.write(JSON.stringify(pointFeature) + '\n');
    const { bytesWritten } = await output2.write([pointFeature.properties?.oaza, pointFeature.properties?.chiban, center[0], center[1]].join('\t') + '\n');
    output2_pos += bytesWritten;

    chiban_meta.oazas[oaza].end = output2_pos;
  }
  await output.close();
  await output2.close();

  await fs.promises.writeFile('./data/chiban_meta.json', JSON.stringify(chiban_meta), 'utf-8');

})(process.argv.slice(2));
