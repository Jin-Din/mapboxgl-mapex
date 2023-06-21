<template>
  <SBaseMap :config="mapconfigUrl" @onMapLoaded="maploaded">
    <template #right-top="{ map, mapConfig }">
      <div style="position: absolute; top: 120px; right: 10px">
        <SMapScene :map="map"></SMapScene>
      </div>
    </template>
    <template #right-bottom="{ map, mapConfig }">
      <div class="right-bottom-panel-container">
        <div class="nav-toolbar">
          <!-- <Measure :map="map"></Measure> -->
          <!-- <Navigation :map="map"></Navigation> -->
        </div>
        <BaseMapSwitch :map="map" :mapConfig="mapConfig"></BaseMapSwitch>
      </div>
    </template>
  </SBaseMap>
</template>
<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import SBaseMap from "./components/SBaseMap.vue";
import type { Map } from "@lib/index";
import type { PointLike } from "mapbox-gl";
onMounted(async () => {});

let mapconfigUrl = ref("configs/map4490_s.json");

let map: Map;
let mapRef = ref<Map>(null as unknown as Map);

const bMapInited = computed(() => {
  return map;
});

const maploaded = (mapInstance: Map) => {
  map = mapInstance;
  mapRef.value = mapInstance;
  map.on("click", (e) => {
    const bbox = [
      [e.point.x - 5, e.point.y - 5],
      [e.point.x + 5, e.point.y + 5],
    ] as [PointLike, PointLike];
    // Find features intersecting the bounding box.
    // const selectedFeatures = map.queryRenderedFeatures(bbox, {
    //   layers: ["测试geojson"],
    // });

    //console.log(selectedFeatures[0].layer);
  });
  map.addSourceEx("a-geojson", {
    type: "geojson",
    data: "/data/shaanxi.json",
  });
  // map.addLayer({
  //   id: "测试geojson",
  //   type: "fill",
  //   source: "a-geojson",
  //   paint: {
  //     "fill-color": "#4ED976",
  //     "fill-opacity": 0.7,
  //   },
  //   metadata: {
  //     options: {
  //       popup: "all",
  //     },
  //   },
  // });

  //初始化一些常用的图标
  ["green", "gray", "red", "blue", "orange", "yellow", "pink", "purple"].forEach((img) => {
    mapRef.value.loadImage(getImageUrl(`/img/marker/mapbox-marker-icon-20px-${img}.png`), (error, image: any) => {
      if (error) throw error;
      // Add the loaded image to the style's sprite with the ID 'kitten'.
      if (!mapRef.value.hasImage(`marker-${img}`)) mapRef.value.addImage(`marker-${img}`, image);
    });
  });
  map.addSourceEx("source-point", {
    type: "geojson",
    data: {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          geometry: {
            type: "Point",
            coordinates: [108.33, 35.1],
          },
          properties: {
            name: "这是一个symbol",
          },
        },
      ],
    },
  });
  map.addLayer({
    id: "a-point-layer",
    type: "symbol",
    source: "source-point",
    layout: {
      "icon-ignore-placement": true,
      "icon-allow-overlap": true,
      "icon-image": "marker-green",
      "text-field": "{name}",
      "text-size": 14,
      "text-offset": [0, -4],
      "text-anchor": "top",
    },
    paint: {
      "text-color": "#091d5d",
      "text-halo-color": "#fff",
      "text-halo-width": 2,
    },
    metadata: {
      options: {
        displayField: "name",
        popup: [{ name: "名称", field: "name" }],
      },
    },
  });
};
</script>
<style scoped>
.logo {
  height: 6em;
  padding: 1.5em;
  will-change: filter;
}
.logo:hover {
  filter: drop-shadow(0 0 2em #646cffaa);
}
.logo.vue:hover {
  filter: drop-shadow(0 0 2em #42b883aa);
}
</style>
