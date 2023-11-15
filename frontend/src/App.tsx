/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useEffect, useState } from 'react';
import { AsyncTypeahead } from 'react-bootstrap-typeahead';
import './App.css';
import { GeoloniaMap } from '@geolonia/embed-react';
// import { Option } from 'react-bootstrap-typeahead/types/types';

interface OazaOption {
  name: string;
  romaji: string;
  kana: string;
  start: number;
  end: number;
}

interface AddrOption {
  name: string;
  romaji: string;
  kana: string;

  lat: number;
  lng: number;
}

function App() {
  const [ map, setMap ] = useState<any>(null);
  const [ searchState, setSearchState ] = useState<{
    isLoading: boolean,
    metaLoaded: boolean,
    loadedOazas: string[],
    options: (OazaOption | AddrOption)[],
  }>({isLoading: false, metaLoaded: false, options: [], loadedOazas: []});
  const [singleSelections, setSingleSelections] = useState<(OazaOption | AddrOption)[]>([]);

  useEffect(() => {
    (async () => {
      const res = await fetch('./chiban_meta.json');
      const json = await res.json();
      const options: OazaOption[] = Object.keys(json.oazas).map((oaza) => {
        const o = json.oazas[oaza];
        return {
          name: oaza,
          romaji: o.romaji,
          kana: o.kana,
          start: o.start,
          end: o.end,
        };
      });
      setSearchState({options, metaLoaded: true, isLoading: false, loadedOazas: []});
    })();
  }, []);

  useEffect(() => {
    if (!map) { return; }

    (window as any).mainMap = map;

    map.on('click', (e: any) => {
      const lngLat = e.lngLat;
      console.log(lngLat);
    });
  }, [map]);

  const onLoad = useCallback((map: any) => {
    setMap(map);
  }, []);

  const onSubmit = useCallback<React.FormEventHandler<HTMLFormElement>>((e) => {
    e.preventDefault();
    const searchVal: string = (e.target as any).search.value;
    console.log(searchVal);
  }, []);

  return (
    <>
      <form onSubmit={onSubmit}>
        <AsyncTypeahead
          id="basic-typeahead-single"
          minLength={1}
          labelKey="name"
          filterBy={['name', 'romaji', 'kana']}
          onChange={async (_selected) => {
            const selected = _selected as (OazaOption | AddrOption)[];
            setSingleSelections(selected);
            if (selected.length === 0) { return; }
            const selectedOazaOption = selected.find((s) => 'start' in s && 'end' in s) as OazaOption | undefined;
            const selectedAddrOption = selected.find((s) => 'lat' in s && 'lng' in s) as AddrOption | undefined;
            if (selectedAddrOption) {
              new (window as any).geolonia.Marker()
                .setLngLat([selectedAddrOption.lng, selectedAddrOption.lat])
                .addTo(map);
              map.flyTo({
                center: [selectedAddrOption.lng, selectedAddrOption.lat],
                zoom: 17,
              });
              return;
            }
            if (!selectedOazaOption) { return; }
            const res = await fetch('./chiban.txt', {
              headers: {
                'range': `bytes=${selectedOazaOption.start}-${selectedOazaOption.end}`,
              },
            });
            const text = await res.text();
            const lines = text.split('\n');
            const options: AddrOption[] = lines.map((line) => {
              const [oazaName, chiban, lng, lat] = line.split('\t');
              return {
                name: `${oazaName}${chiban}`,
                romaji: `${selectedOazaOption.romaji}${chiban}`,
                kana: `${selectedOazaOption.kana}${chiban}`,
                lat: parseFloat(lat),
                lng: parseFloat(lng),
              }
            });
            setSearchState(s => ({
              ...s,
              loadedOazas: [...s.loadedOazas, selectedOazaOption.name],
              options: [...options, ...s.options],
            }));
          }}
          onSearch={async (query) => {
            const oazaMatch = query.match(/^([^0-9]+)[0-9]+/);
            if (!oazaMatch) { return; }
            const oazaStr = oazaMatch[1];
            const oaza = searchState.options.find((o) => 'start' in o && 'end' in o && (o.name === oazaStr || o.romaji === oazaStr || o.kana === oazaStr)) as OazaOption | undefined;
            if (!oaza) { return; }
            if (searchState.loadedOazas.includes(oaza.name)) { return; }
            setSearchState(s => ({...s, isLoading: true}));

            const res = await fetch('./chiban.txt', {
              headers: {
                'range': `bytes=${oaza.start}-${oaza.end}`,
              },
            });
            const text = await res.text();
            const lines = text.split('\n');
            const options: AddrOption[] = lines.map((line) => {
              const [oazaName, chiban, lng, lat] = line.split('\t');
              return {
                name: `${oazaName}${chiban}`,
                romaji: `${oaza.romaji}${chiban}`,
                kana: `${oaza.kana}${chiban}`,
                lat: parseFloat(lat),
                lng: parseFloat(lng),
              };
            });
            setSearchState(s => ({
              ...s,
              loadedOazas: [...s.loadedOazas, oaza.name],
              options: [...options, ...s.options],
              isLoading: false,
            }));
          }}
          isLoading={searchState.isLoading}
          options={searchState.options}
          placeholder="住所を入力してください"
          selected={singleSelections}
        />
      </form>
      <GeoloniaMap
        className="mainMap"
        apiKey="YOUR-API-KEY"
        lat="30.340614179303643"
        lng="130.53198158175275"
        marker='off'
        zoom="9"
        mapStyle='geolonia/basic-v1'
        onLoad={onLoad}
      />
    </>
  )
}

export default App;
