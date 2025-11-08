// components/CarWashMap.tsx
import React, { useMemo, forwardRef, useImperativeHandle, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import type { CarWash } from '@/src/services/api/carWashesApi';
import {GIS_API_KEY} from "@/src/config/env";

// 👇 публичный хэндл
export type CarWashMapHandle = {
    focusOn: (id: string, opts?: { duration?: number; zoom?: number }) => void;
};

type Props = {
    carWashes: CarWash[];
    onMarkerPress?: (cw: CarWash) => void;
    center?: { latitude: number; longitude: number };
    zoom?: number;
    style?: any;
    apiKey?: string;
    showInfoPopup?: boolean;

};

const DEFAULT_KEY = GIS_API_KEY;

const CarWashMap = forwardRef<CarWashMapHandle, Props>(function CarWashMap(
    {
        carWashes,
        onMarkerPress,
        center = { latitude: 43.2220, longitude: 76.8512 },
        zoom = 12,
        style,
        apiKey,
        showInfoPopup = true,
    },
    ref
) {
    const webRef = useRef<WebView>(null);

    // стабильный key — только по составу точек; не включаем «фокус»
    const webKey = useMemo(() => carWashes.map((cw) => cw.id).join('|'), [carWashes]);

    const html = useMemo(() => {
        const safe = carWashes.filter(
            (cw) => Number.isFinite(cw.latitude) && Number.isFinite(cw.longitude),
        );
        const points = JSON.stringify(
            safe.map((cw) => ({
                id: cw.id,
                name: cw.name,
                lat: cw.latitude,
                lng: cw.longitude,
                address: cw.address,
                rating: cw.rating,
            })),
        );
        const centerStr = JSON.stringify([center.longitude, center.latitude]);
        const usePopup = showInfoPopup ? 'true' : 'false';

        return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="initial-scale=1, maximum-scale=1, user-scalable=no, width=device-width" />
  <style>
    html, body, #map { height:100%; margin:0; padding:0; background:#000; }
    .dgis-popup {
      background:#111; color:#fff; border-radius:8px; padding:8px 10px;
      font-family: -apple-system, Roboto, sans-serif; box-shadow:0 4px 12px rgba(0,0,0,0.35); font-size:12px;
      border:1px solid #2a2a2a;
    }
    .dgis-popup .title { font-weight:700; margin-bottom:4px; }
    .dgis-popup .meta { opacity:.9; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script src="https://mapgl.2gis.com/api/js/v1"></script>
  <script>
    (function(){
      var map = new mapgl.Map('map', {
        key: '${apiKey || DEFAULT_KEY}',
        center: ${centerStr},
        zoom: ${zoom},
      });

      var points = ${points};
      var showPopup = ${usePopup};

      var markers = [];
      var activeInfo = null;

      function closeActiveInfo() {
        if (activeInfo && activeInfo.destroy) {
          try { activeInfo.destroy(); } catch(e){}
          activeInfo = null;
        }
      }

      function createInfoHtml(p){
        var el = document.createElement('div');
        el.className = 'dgis-popup';
        el.innerHTML = '<div class="title">' + p.name + '</div>' +
                       '<div class="meta">★ ' + p.rating + ' • ' + p.address + '</div>';
        return el;
      }

      function showInfo(p) {
        closeActiveInfo();
        var el = createInfoHtml(p);
        activeInfo = new mapgl.HtmlMarker(map, {
          coordinates: [p.lng, p.lat],
          html: el,
          offset: [0, -18]
        });
      }

      points.forEach(function(p){
        var m = new mapgl.Marker(map, { coordinates: [p.lng, p.lat] });
        m.on('click', function(){
          if (showPopup) showInfo(p);
          if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
            window.ReactNativeWebView.postMessage(JSON.stringify({ type:'marker', id: p.id }));
          }
        });
        markers.push(m);
      });

      map.on('click', function(){ closeActiveInfo(); });

      // 👇 функция для RN — плавный фокус на точку
      window.__focusOn = function(targetId, duration, zoomLevel){
        var t = points.find(function(p){ return p.id === targetId; });
        if(!t) return;

        try {
          // если у map есть flyTo — используем анимацию
          if (typeof map.flyTo === 'function') {
            map.flyTo([t.lng, t.lat], { duration: duration || 600 });
          } else if (typeof map.setCenter === 'function') {
            // fallback: быстрый зум -> центр (некоторые сборки поддерживают duration)
            if (typeof map.setZoom === 'function' && typeof zoomLevel === 'number') {
              map.setZoom(zoomLevel);
            }
            map.setCenter([t.lng, t.lat]);
          }
          if (showPopup) showInfo(t);
        } catch(e) {}
      };
    })();
  </script>
</body>
</html>
`.trim();
    }, [carWashes, center.latitude, center.longitude, zoom, apiKey, showInfoPopup]);

    const handleMsg = (e: WebViewMessageEvent) => {
        try {
            const data = JSON.parse(e.nativeEvent.data);
            if (data?.type === 'marker') {
                const cw = carWashes.find((x) => x.id === data.id);
                if (cw) onMarkerPress?.(cw);
            }
        } catch {}
    };

    // 👇 публичный метод: дергаем функцию в WebView без перерендера
    useImperativeHandle(ref, () => ({
        focusOn: (id, opts) => {
            const js = `window.__focusOn && window.__focusOn(${JSON.stringify(id)}, ${opts?.duration ?? 600}, ${opts?.zoom ?? 15}); true;`;
            webRef.current?.injectJavaScript(js);
        },
    }));

    return (
        <View style={[stylesLocal.wrapper, style]}>
            <WebView
                ref={webRef}
                key={webKey}
                source={{ html }}
                onMessage={handleMsg}
                javaScriptEnabled
                domStorageEnabled
                originWhitelist={['*']}
                allowFileAccess
                allowUniversalAccessFromFileURLs
                setSupportMultipleWindows={false}
                automaticallyAdjustContentInsets={false}
                scrollEnabled={false}
                style={{ backgroundColor: 'transparent' }}
            />
        </View>
    );
});

const stylesLocal = StyleSheet.create({
    wrapper: { flex: 1, backgroundColor: '#000' },
});

export default CarWashMap;
