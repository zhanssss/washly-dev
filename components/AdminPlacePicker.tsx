// components/AdminPlacePicker.tsx
import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import {GIS_API_KEY} from "@/src/config/env";

type Props = {
    apiKey: string; // 2ГИС API KEY
    onPicked: (p: { id: string; name?: string; rating?: number }) => void;
    initialCenter?: { latitude: number; longitude: number };
    initialZoom?: number;
    style?: any;
};

const AdminPlacePicker: React.FC<Props> = ({
                                               apiKey,
                                               onPicked,
                                               initialCenter = { latitude: 43.238293, longitude: 76.945465 }, // Алматы
                                               initialZoom = 13,
                                               style,
                                           }) => {
    const html = useMemo(() => {
        const centerStr = JSON.stringify([initialCenter.longitude, initialCenter.latitude]);

        return `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="initial-scale=1, maximum-scale=1, user-scalable=no, width=device-width" />
<style>
  html,body,#root{height:100%;margin:0;padding:0;background:#0B0B0B;color:#fff;font-family:-apple-system,system-ui,Roboto}
  #bar{height:56px;display:flex;gap:8px;align-items:center;padding:8px}
  #pick{height:40px;border-radius:8px;border:none;background:#FF6B35;color:#0B0B0B;font-weight:800;padding:0 12px}
  #pick:disabled{opacity:.5}
  #map{height:calc(100% - 56px);width:100%}
  .popup{background:#111;color:#fff;border-radius:8px;padding:8px 10px;font-size:12px;border:1px solid #2a2a2a}
  .popup .t{font-weight:700;margin-bottom:4px}
</style>
<script src="https://mapgl.2gis.com/api/js/v1"></script>
</head>
<body>
  <div id="root">
    <div id="bar">
      <div style="flex:1;opacity:.8">Тап по карте — выберем ближайшую организацию</div>
      <button id="pick" disabled>Выбрать</button>
    </div>
    <div id="map"></div>
  </div>

<script>
(function(){
  // пробрасываем ошибки в RN
  window.onerror = function (msg, url, line, col) {
    try { window.ReactNativeWebView?.postMessage(JSON.stringify({type:'error', message:String(msg)})); } catch(_) {}
  };

  var map = new mapgl.Map('map', {
    key: '${apiKey}',
    center: ${centerStr},
    zoom: ${initialZoom},
  });

  var activeMarker = null;
  var activeInfo = null;
  var selected = null; // {id,name,rating,lat,lon}

  function closeInfo(){
    if (activeInfo && activeInfo.destroy) { try { activeInfo.destroy(); } catch(_){}; activeInfo = null; }
  }

  function showInfo(p){
    closeInfo();
    var el = document.createElement('div');
    el.className = 'popup';
    el.innerHTML = '<div class="t">' + (p.name||'Организация') + '</div>' +
                   '<div>★ ' + (p.rating ?? '—') + '</div>';
    activeInfo = new mapgl.HtmlMarker(map, { coordinates:[p.lon, p.lat], html: el, offset:[0,-18] });
  }

  async function geocodeNearest(lat, lon){
    // 2ГИС Catalog API: ближайшая организация по координатам
    var url = 'https://catalog.api.2gis.com/3.0/items/geocode?lat=' + lat + '&lon=' + lon + '&key=${apiKey}';
    var r = await fetch(url);
    var data = await r.json();
    if (data?.result?.items?.length) {
      var it = data.result.items[0];
      // NB: id у 2ГИС называется item.id
      return {
        id: String(it.id),
        name: it.name || '',
        rating: it.rating?.value ?? null
      };
    }
    return null;
  }

  map.on('click', async function(e){
    var lat = e.lngLat[1];
    var lon = e.lngLat[0];

    // ставим маркер
    if (activeMarker) { activeMarker.destroy(); activeMarker = null; }
    activeMarker = new mapgl.Marker(map, { coordinates: [lon, lat] });

    // тянем ближайшую организацию
    try {
      var info = await geocodeNearest(lat, lon);
      if (info) {
        selected = { ...info, lat: lat, lon: lon };
        showInfo({ name: info.name, rating: info.rating, lat: lat, lon: lon });
        document.getElementById('pick').disabled = false;
      } else {
        selected = null;
        document.getElementById('pick').disabled = true;
        closeInfo();
      }
    } catch (e) {
      selected = null;
      document.getElementById('pick').disabled = true;
      closeInfo();
    }
  });

  document.getElementById('pick').addEventListener('click', function(){
    if (!selected) return;
    try {
      window.ReactNativeWebView?.postMessage(JSON.stringify({
        type: 'PLACE_SELECTED',
        id: selected.id,
        name: selected.name,
        rating: selected.rating
      }));
    } catch(_) {}
  });

})();
</script>
</body>
</html>
`.trim();
    }, [apiKey, initialCenter.latitude, initialCenter.longitude, initialZoom]);

    const onMessage = (e: WebViewMessageEvent) => {
        try {
            const data = JSON.parse(e.nativeEvent.data);
            if (data?.type === 'PLACE_SELECTED' && data?.id) {
                onPicked({ id: String(data.id), name: data.name, rating: data.rating });
            }
            if (data?.type === 'error') {
                // можно залогировать в Metro
                console.warn('2GIS picker error:', data.message);
            }
        } catch {}
    };

    return (
        <View style={[styles.wrap, style]}>
            <WebView
                source={{ html }}
                onMessage={onMessage}
                originWhitelist={['*']}
                javaScriptEnabled
                domStorageEnabled
                setSupportMultipleWindows={false}
                startInLoadingState
                style={{ flex: 1, backgroundColor: 'transparent' }}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    wrap: { flex: 1, backgroundColor: '#000' },
});

export default AdminPlacePicker;
