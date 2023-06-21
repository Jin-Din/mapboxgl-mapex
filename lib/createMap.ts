// #region  地图操作辅助 处理逻辑
//=====================================================

import { MapboxOptions, Style, Layer, Sources, AnyLayer } from "mapbox-gl";
import { getInnerBasemapItem } from "./defaultBaseMap";

import { Map } from "./mapEx";

import { parseBasemItemToStyle } from "./parseBasemItemToStyle";
import { templateParser } from "./utils";

export type ISBaseMapType = "vector" | "raster";

// export type ISBaseMapRasterName = "TDTSX_VECTOR" | "TDTSX_IMAGE" | "TDTSX_IMAGE_LABEL";

export type VectorBaseMapStyle = "default" | "blue" | "black" | "gray"; //天地图陕西矢量地图风格

export type RasterBasemapStyle =
  | "tianditu_sx_img"
  | "tianditu_sx_img_label"
  | "tianditu_sx_img_group"
  | "tianditu_img_c"
  | "tianditu_img_c_group"
  | "tianditu_vec_c_group";
export type AnyBasemapStyle = VectorBaseMapStyle | RasterBasemapStyle;
export type tokenType = "default" | "tianditu" | "tdtsx_img" | "tdtsx_img_label"; //地图token 管理
export type EPSG = "4490" | "3857" | "4326";
export interface ISToken extends Partial<Record<tokenType, string | undefined>> {}

export interface ISCustomMapOptions {
  epsg?: EPSG;
  sprite?: string | string[]; //雪碧图
  token?: ISToken; //Partial<Record<tokenType, string>>;
  templateValues?: Record<string, string>;
  current?: string;
  baseMaps?: (ISBaseMap | string)[];
  overLayers?: {
    sources: Sources;
    layers: ISLayer[];
  };
}
export type ISMapConfig = MapboxOptions & ISCustomMapOptions;

export interface ISLayer extends Layer {
  id: any;
  layout: any;
  name?: string;
}
export interface ISBaseMap {
  id: string;
  name?: string;
  icon?: string;
  type: ISBaseMapType;
  style?: string | Style;
}
export interface ISVectorTileBaseMap extends ISBaseMap {
  type: "vector";
  style?: string;
}
export interface ISRasterBaseMap extends ISBaseMap {
  type: "raster";
  // sources: Sources;
  style?: Style;
  // baseLayers: ISLayer[];
  subLayers?: ISLayer[]; //
  // terrain?: TerrainSpecification | undefined;
}

let defaultMapConfig = {
  epsg: "4490",
  center: [108.653, 35.2],
  zoom: 6,
  dragRotate: true,
  current: "default",
  token: {
    default: "token",
    tianditu: "token",
    tdtsx_img: "token",
    tdtsx_img_label: "token",
  },
  baseMaps: ["default", "blue", "black"],
} as ISMapConfig;
// 经过格式化处理的地图配置
let _mapConfig: ISMapConfig = {
  container: "mapid",
};

const innerDefaultStyleId = "_default"; //当mapconfig 设置style 时，指向 此处；当 style为null，但 current 有值时，指向 current

//用于标识是否通过createMap 创建的地图对象
let bCreateMap = false;
let _map: Map;
let currentBaseMapId = ref("");

let storeStyles: Record<string, Style | string | undefined> = {};

function _createMap(options?: MapboxOptions): Map {
  _map = new Map(options);
  //挂载地图初始化完成事件，加入overlayers图层。【设计上有待改善，是否应该剥离出去，不“污染”原来设计的功能】
  _map.on("load", () => {
    //加载overlayers
    let { overLayers } = _mapConfig;
    if (overLayers) {
      let { sources, layers } = overLayers;
      for (const key in sources) {
        _map.addSourceEx(key, sources[key]);
      }
      layers.forEach((layer) => {
        if (!_map.getLayer(layer.id)) _map.addLayer(layer as AnyLayer);
      });
    }
  });
  return _map;
}
/**
 * 重构地图配置mapConfig，主要过滤转换一些带有默认地图名称的地图服务转换成真实的地图地址，比如矢量瓦片的名称 default，将处理转换成真实的地址
 * @param mapConfig
 * @returns
 */
const normalizeMapConfig = (mapConfig: ISMapConfig): ISMapConfig => {
  let { baseMaps, token, overLayers, templateValues } = mapConfig as ISCustomMapOptions;

  token = token ? { ...defaultMapConfig.token, ...token } : defaultMapConfig.token;
  templateValues = templateValues ?? {};
  //合并 templateValues  和  token形成
  templateValues = { ...token, ...templateValues };

  //1.把mapconfig转换成完整的结构，特别是basemap中使用简写内置的style，
  if (baseMaps) {
    mapConfig.baseMaps = baseMaps.map((basemap: string | ISBaseMap) => {
      if (typeof basemap === "string") {
        // 只有名字，则默认他是使用了内置地图
        return getInnerBasemapItem(basemap as string);
      }
      return {
        ...basemap,
        style: parseBasemItemToStyle(basemap as ISBaseMap),
      };
    });
  }
  if (overLayers && overLayers.layers) {
    let { layers } = overLayers;
    //给所有的ovelayer  加入 metadata.isBaseMap =false
    layers.forEach((layer) => {
      let { metadata } = layer;
      metadata = metadata ? { ...metadata, isBaseMap: false } : { isBaseMap: false };
      layer.metadata = metadata;
    });
  }
  //2.模板值替换，替换成真实的地址
  if (templateValues) {
    // 模板值替换
    let stringConfig = JSON.stringify(mapConfig);
    mapConfig = JSON.parse(templateParser(stringConfig, templateValues));
  }
  //存储styles
  toStoreStyles(mapConfig);
  // console.log(mapConfig);
  return mapConfig;
};
/**
 * 根据id查找并获取到地图配置项,前提是使用createMap创建过地图.
 *
 * @param id 出入底图id,优先从配置文件中找。如果id 是内置底图的id，将先从配置文件中找，找不到再从内置底图中找
 * @returns
 */
export const findBaseMapItem = (id: string): ISBaseMap => {
  //先从 mapconfig中找
  let hitBasemap = _mapConfig.baseMaps
    ?.filter((basemap: any) => basemap && typeof basemap != "string")
    .find((item: any) => {
      return (item as ISBaseMap).id === id;
    });
  // 在自定义配置中没有找到，则找默认的配置
  return (hitBasemap as ISBaseMap) ?? getInnerBasemapItem(id);
};

/**
 * 返回输出内部的一些地图控制状态，返回值具有响应式
 * @returns
 */
export const useBaseMapState = () => {
  return {
    currentBaseMapId,
  };
};
// #endregion

/**
 * 存储配置文件中的所有style
 * @param mapConfig
 */
const toStoreStyles = (mapConfig: ISMapConfig) => {
  let { current, baseMaps, style } = mapConfig;
  if (baseMaps) {
    baseMaps.forEach((basemap: string | ISBaseMap) => {
      if (typeof basemap === "string") {
        // 只有名字，则默认他是使用了内置地图
        let basemapStyle = getInnerBasemapItem(basemap as string).style;
        storeStyles[basemap] = basemapStyle;
      } else {
        storeStyles[basemap.id] = parseBasemItemToStyle(basemap as ISBaseMap);
      }
    });
  }
  if (style) {
    storeStyles[innerDefaultStyleId] = style;
  } else {
    //style 为空的情况,再次添加一个使用 current的style
    if (current && Object.keys(storeStyles)?.includes(current)) storeStyles[innerDefaultStyleId] = storeStyles[current];
  }
};

/**
 * 地图切换
 * @param baseMapItemId
 * @returns
 */
export const switchBaseMap = (baseMapItemId: string) => {
  if (!bCreateMap) throw new Error("未使用createMap创建地图对象，不能使用switchMap");
  if (!_map) throw new Error("map尚未创建，请先使用createMap创建");

  let previousId = currentBaseMapId.value;
  let currentId = "";

  if (previousId === baseMapItemId) return { previousId, baseMapItemId };
  if (!storeStyles || !Object.keys(storeStyles).includes(baseMapItemId)) return { previousId, currentId };

  currentBaseMapId.value = currentId = baseMapItemId;
  _map.changeBaseMapStyle(storeStyles[baseMapItemId]);
  return {
    previousId,
    currentId,
  };
};
/**
 * 重置返回到初始的底图
 */
export const resetBaseMap = () => {
  if (storeStyles) _map.changeBaseMapStyle(storeStyles[innerDefaultStyleId]);
};
/**
 * 提供一个创建map对象的一个方法,这是统一入口，需通过此方法创建地图对象
 * @param mapid mapcontainer 的div 元素id
 * @param mapConfig 自定义地图配置。如果为空，则使用内置的地图配置
 * @param basemapId 传入指定的basemapid，该值应与mapconfig中的配置一致
 * @returns map 对象
 */
export function createMap(mapConfig: ISMapConfig, basemapId?: string): Map {
  //对mapconfig进行组织，转换成完整的结构（转换成对象）
  let config = mapConfig ? { ...defaultMapConfig, ...mapConfig } : defaultMapConfig;
  let { templateValues } = config;
  if (templateValues) {
    // 模板值替换
    let stringConfig = JSON.stringify(config);
    config = JSON.parse(templateParser(stringConfig, templateValues));
    // console.log(config);
  }

  //解析并保存mapconfig,主要针对 ISCustomMapOptions 的属性进行解析
  _mapConfig = normalizeMapConfig(config as ISMapConfig);

  // console.log(_mapConfig);
  let { current, baseMaps } = _mapConfig;

  //如果设置了style，默认加载。 此时， config中的 current 无效
  if (!basemapId && !current && _mapConfig.style) {
    currentBaseMapId.value = innerDefaultStyleId;
    return _createMap(_mapConfig);
  }
  //如果外部传入初始加载的basemap的id，则使用
  if (basemapId) current = basemapId;

  //1.当没有配置basemaps，会根据 current 的值去解析获得内置默认地图
  if (!baseMaps) {
    // 获取默认的内置配置
    let currentBasemap = getInnerBasemapItem(current!);
    if (typeof currentBasemap === "string") throw new Error("加载初始地图失败!原因：当前配置的默认加载地图错误或不存在");
    let style = parseBasemItemToStyle(currentBasemap);
    bCreateMap = true;
    currentBaseMapId.value = current!;
    return _createMap({
      ..._mapConfig,
      style,
    });
  }
  //2. 如果 basemaps 有内容， 使用配置文件的内容
  //查找默认加载地图,此处的basemap 转换成对象
  let initBaseMap = baseMaps!.find((item: unknown) => {
    if (typeof item === "string") return item === current;
    else return (item as ISBaseMap).id === current;
  });

  if (!initBaseMap) {
    throw new Error(`加载初始地图失败!原因：在当前配置的配置中，未找到名为 ${current} 的配置`);
  }
  let style = parseBasemItemToStyle(initBaseMap as ISBaseMap);
  bCreateMap = true;
  currentBaseMapId.value = (initBaseMap as ISBaseMap).id;
  return _createMap({
    ..._mapConfig,
    style,
  });
}
