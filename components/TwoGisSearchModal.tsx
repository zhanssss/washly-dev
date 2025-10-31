import React, { useMemo } from 'react';
import { Modal, View } from 'react-native';
import { WebView } from 'react-native-webview';

type Props = {
    visible: boolean;
    onClose: () => void;
    apiKey: string;
    onConfirm: (p: {
        id?: string;
        title?: string;
        rating?: number | null;
        address?: string;
        latitude: number;
        longitude: number;
        photoUrl?: string | null;
    }) => void;
    initialCenter?: { lat: number; lon: number };
};

export default function MapModal({
                                     visible,
                                     onClose,
                                     apiKey,
                                     onConfirm,
                                     initialCenter = { lat: 43.238293, lon: 76.945465 },
                                 }: Props) {
    const html = useMemo(
        () => `<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no"/>
<style>
  html,body{height:100%;margin:0;padding:0;background:#000;-webkit-tap-highlight-color:transparent;}
  #map{position:absolute;inset:0;}
  .closeBtn{
    position:absolute;left:8px;top:56px;z-index:10000; /* FIX: ниже статус-бара */
    background:#111;border:1px solid #2A2A2A;color:#fff;border-radius:10px;
    padding:10px 14px;font:14px -apple-system,system-ui,sans-serif;pointer-events:auto;
  }
  .myLoc{
    position:absolute;right:8px;bottom:96px;z-index:9999;
    width:44px;height:44px;border-radius:10px;border:1px solid #2A2A2A;background:#111;
    display:flex;align-items:center;justify-content:center;color:#fff;font:16px -apple-system,system-ui,sans-serif;pointer-events:auto;
  }
  .hint{
    position:absolute;left:8px;bottom:96px;z-index:9998;
    background:rgba(0,0,0,0.6);color:#fff;padding:8px 10px;border-radius:8px;font:12px -apple-system,system-ui,sans-serif;
  }
  .confirmBar{
    position:absolute;left:8px;right:8px;bottom:12px;z-index:10000;
    display:flex;gap:8px;pointer-events:auto;
  }
  .btn{
    flex:1;height:48px;border-radius:12px;border:1px solid #2A2A2A;
    background:#111;color:#fff;font:600 15px -apple-system,system-ui,sans-serif;
  }
  .btn.primary{ background:#14213D;border-color:#14213D;color:#fff;font-weight:800; }
  .btn:disabled{ opacity:.5; }
</style>
<script src="https://maps.api.2gis.ru/2.0/loader.js?pkg=full"></script>
</head>
<body>
<div id="map"></div>

<button id="closeBtn" class="closeBtn" type="button">Назад</button>
<button id="myLocBtn" class="myLoc" type="button" title="Моё местоположение">◎</button>
<div class="hint">Тап по карте — выберем ближайшую организацию</div>

<div class="confirmBar">
  <button id="saveBtn" class="btn primary" type="button" disabled>Сохранить</button>
</div>

<script>
(function(){
  var apiKey = ${JSON.stringify(apiKey)};
  var startLat = ${initialCenter.lat};
  var startLon = ${initialCenter.lon};
  var candidate = null;
  var lastMarker = null;

  function post(payload){
    try{ window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify(payload)); }catch(e){}
  }

  async function fetchNearestOrg(lat, lon){
    var url = 'https://catalog.api.2gis.com/3.0/items/geocode?lat=' + lat + '&lon=' + lon + '&key=' + encodeURIComponent(apiKey);
    var r = await fetch(url);
    return r.json();
  }

  function setMarker(map, lat, lon){
    if(lastMarker) map.removeLayer(lastMarker);
    lastMarker = DG.marker([lat, lon]).addTo(map);
  }

  DG.then(function(){
    var map = DG.map('map', { center: DG.latLng(startLat, startLon), zoom: 13, zoomControl: true });

    var saveBtn = document.getElementById('saveBtn');
    var closeBtn = document.getElementById('closeBtn');
    var myLocBtn = document.getElementById('myLocBtn');

    // FIX: кликом по карте всегда создаём кандидата по координатам,
    // а данные 2ГИС подтягиваем "поверх" как улучшение.
    map.on('click', async function(e){
      var lat = e.latlng.lat, lon = e.latlng.lng;
      setMarker(map, lat, lon);

      // базовый кандидат по координатам
      candidate = { latitude: lat, longitude: lon };
      saveBtn.disabled = false;          // FIX: сразу активируем кнопку
      post({ type:'candidate', ...candidate });

      // пытаемся обогатить данными 2ГИС (не блокируем UX, если упадёт — не страшно)
      try{
        var data = await fetchNearestOrg(lat, lon);
        var items = (data && data.result && data.result.items) || [];
        if(items.length){
          var it = items[0];
          var title = it.name || '';
          var rating = it.rating && it.rating.value ? it.rating.value : null;
          var address = it.address_name || it.full_name || '';
          var photo = (it.photos && it.photos[0] && (it.photos[0].preview || it.photos[0].size_1024)) || null;
          var id = it.id || it.branch_id || it.guid || null; // FIX: разные поля встречаются

          candidate = { id: id || undefined, title, rating, address, latitude: lat, longitude: lon, photoUrl: photo || null };
          post({ type:'candidate', ...candidate });
        }
      }catch(err){
        // молча игнорим, координаты уже выбраны
      }
    });

    myLocBtn.addEventListener('click', function(){
      if(!navigator.geolocation) return;
      navigator.geolocation.getCurrentPosition(function(pos){
        var lat = pos.coords.latitude, lon = pos.coords.longitude;
        map.setView([lat, lon], 15);
        setMarker(map, lat, lon);
        candidate = { latitude: lat, longitude: lon };
        saveBtn.disabled = false;
        post({ type:'candidate', ...candidate });
      }, function(){}, { enableHighAccuracy:true, timeout:5000 });
    });

    closeBtn.addEventListener('click', function(){
      post({ type:'close' });
    });

    // FIX: всегда шлём confirm, если кандидат есть
    saveBtn.addEventListener('click', function(){
      if(!candidate){ return; }
      post({ type:'confirm', ...candidate });
    });
  });
})();
</script>
</body>
</html>`,
        [apiKey, initialCenter.lat, initialCenter.lon]
    );

    const onMessage = (event: any) => {
        try {
            const data = JSON.parse(event?.nativeEvent?.data || '{}');
            if (data.type === 'confirm') {
                onConfirm({
                    id: data.id,
                    title: data.title || '',
                    rating: typeof data.rating === 'number' ? data.rating : null,
                    address: data.address || '',
                    latitude: data.latitude,
                    longitude: data.longitude,
                    photoUrl: data.photoUrl || null,
                });
            } else if (data.type === 'close') {
                onClose();
            }
            // data.types === 'candidate' — можешь отрисовать превью
        } catch {}
    };

    return (
        <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
            <View style={{ flex: 1, backgroundColor: '#000' }}>
                <WebView
                    originWhitelist={['*']}
                    source={{ html }}
                    onMessage={onMessage}
                    javaScriptEnabled
                    domStorageEnabled

                    onShouldStartLoadWithRequest={() => true}
                    style={{ flex: 1 }}
                />
            </View>
        </Modal>
    );
}
