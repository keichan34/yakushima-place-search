import fs from 'fs';
import { fetch } from 'undici';
import osmtogeojson from 'osmtogeojson';

const QUERY = `
[out:json][timeout:300];
area[name="屋久島"];
nwr["name"](area);
out geom;
`;

const FEATURE_PROPERTY_ALLOWLIST = [
  "name",
  "name:en",
  "name:ja",
  "name:ja_rm",
  "name:ja_kana",
  "wikidata",
  "wikipedia",
  "wikipedia:ja",
  "website",
];

(async () => {
  const result = await fetch('https://overpass-api.de/api/interpreter', {
    method: 'POST',
    body: `data=${encodeURIComponent(QUERY)}`,
  });
  const json = await result.json() as any as { elements: { type: "node" | "way" | "relation",  id: number, lat: number, lon: number, tags: Record<string, string>}[] };

  const geojson = osmtogeojson(json);

  const out = await fs.promises.open('data/osm.json', 'w');
  for (const feature of geojson.features) {
    if (feature.properties) {
      for (const key of Object.keys(feature.properties)) {
        if (!FEATURE_PROPERTY_ALLOWLIST.includes(key)) {
          delete feature.properties[key];
        }
      }
    }
    await out.write(JSON.stringify(feature) + '\n');
  }
  await out.close();
})();
