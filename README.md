## mapboxgl 地图对象扩展(可适用于天地图陕西的 mapbox-gl api)

## 技术栈

- vue3+typescript

## 引入地图开发包

### 1、地图开发包资源

陕西省地理信息公共服务平台提供了专门的地图 API 包进行访问地图服务。地图 API 包提供了 CGCS2000 和 web 墨卡托两种地图坐标系的 api，用户可根据需要选择调用不同坐标系的地图并选择相应的 API。

- [js 文件（cgcs2000）](https://shaanxi.tianditu.gov.cn/vectormap/YouMapServer/JavaScriptLib/mapbox-gl-cgcs2000.js)
- [js 文件（web 墨卡托）](https://shaanxi.tianditu.gov.cn/vectormap/YouMapServer/JavaScriptLib/mapbox-gl.js)
- [css 文件](https://shaanxi.tianditu.gov.cn/vectormap/YouMapServer/JavaScriptLib/mapbox-gl.css)

> 地图 API 包基于 mapboxgl 基础上扩展封装而成，功能上与原生的 mapboxgl 没有差别。详细使用请参阅[mapbox-gl 开发帮助文档](https://docs.mapbox.com/mapbox-gl-js/api/)

### 2、引入方式

#### 方法一:在线引用

打开 index.html， 文件内直接引入以上提供的 js、css 地址。参见[陕西省地理信息公共服务平台开发帮助](https://shaanxi.tianditu.gov.cn/portal/?#/devDocument)

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Vite + Vue</title>
    <script src="https://shaanxi.tianditu.gov.cn/vectormap/YouMapServer/JavaScriptLib/mapbox-gl-cgcs2000.js"></script>
    <link rel="stylesheet" href="https://shaanxi.tianditu.gov.cn/vectormap/YouMapServer/JavaScriptLib/mapbox-gl.css" />
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.js"></script>
  </body>
</html>
```

#### 方法二:下载离线引入

1.在 vite 项目中， 将 mapbox-gl-cgcs2000.js、mapbox-gl.css 两个文件包放置在根目录下的 public 文件(
项目中没有，自己创建）下。比如 public/libs/mapbox-gl 文件夹下 2.引入到 index.html 中，同上

```html
<head>
  <meta charset="UTF-8" />
  <link rel="icon" type="image/svg+xml" href="/vite.svg" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Vite + Vue + TS</title>
  <script src="/libs/mapbox-gl/mapbox-gl-cgcs2000.js"></script>
  <link rel="stylesheet" href="/libs/mapbox-gl/mapbox-gl.css" />
</head>
```

### 如何使用

#### 安装引入

```
npm install sxgis-mapboxgl-mapex
```

```javascript
import { Map } from "@jindin/mapboxgl-mapex";

const { mapboxgl } = window;
mapboxgl.accessToken = "申请token";
//初始化创建map对象
const map = new Map(option);
map.on("load", () => {
  //do something
});
```

### 扩展内容说明

#### 1.底图与非底图分组

map 对象将底图和非底图进行分组。初始化 map 对象时，内部默认加入一个空图层进行标识分组，划分底图区域和非底图区域。同时，重新 addLayer 方法，对每个新加入的图层默认并强制加入 metadata 属性，用于标识图层的类型；

```javascript
// layer
{
  ...,
  metadata:
  {
    isBaseMap:boolean
  }
}
```

#### 2.重新 addLayer

- 1. 新加入图层强制加入{metadata:{isBaseMap:boolean}} 扩展属性，默认加入 {metadata:{isBaseMap:false}}
- 2. 图层分组。划分不同类型的图层区域--点、线、面，点层最上，线层中间，面层最下。通过传入参数来启动是否使用图层分组功能。

```javascript
 /**
     * 重写 addLayer，对新加入的图层强制加入 {metadata:{isBaseMap:boolean}} 扩展属性，默认加入 {metadata:{isBaseMap:false}}
     * @param layer
     * @param before 插入到此图层id之前。
     *
     * 特别说明：当传入的参数为boolean并且为true时，将干预新加入图层的顺序。
     *
     *
     * 便于图层的分组管理，本程序设计了一种默认的地图分组规则。地图map对象在初始化后会默认生成三个分别是点、线、面的分组，点层最上，面层最下。
     * 当有新图层加入时，如果传入的参数为boolean且未true，将使用默认分组规则干预新图层的顺序，使得点层永远在上，面层永远处于点、线层之下：
     * 反之，按正常的顺序添加图层，不干预；
     * @returns
     */
    addLayer(layer: AnyLayer, before?: string | boolean | undefined): this;
```

> map 对象扩展的内容参见接口

```typescript
export declare class Map extends mapboxgl.Map {
  constructor(options?: MapboxOptions);
  /**
   * 初始化一些默认的空图层
   * @returns
   */
  initDefaultEmptyLayers(): void;
  /**
   * 判断指定图层id的图层是否存在
   * @param id
   * @returns true or false
   */
  isLayer(id: string): boolean;
  /**
   * 重写 addLayer，对新加入的图层强制加入 {metadata:{isBaseMap:boolean}} 扩展属性，默认加入 {metadata:{isBaseMap:false}}
   * @param layer
   * @param before 插入到此图层id之前。
   *
   * 特别说明：当传入的参数为boolean并且为true时，将干预新加入图层的顺序。
   *
   *
   * 便于图层的分组管理，本程序设计了一种默认的地图分组规则。地图map对象在初始化后会默认生成三个分别是点、线、面的分组，点层最上，面层最下。
   * 当有新图层加入时，如果传入的参数为boolean且未true，将使用默认分组规则干预新图层的顺序，使得点层永远在上，面层永远处于点、线层之下：
   * 反之，按正常的顺序添加图层，不干预；
   * @returns
   */
  addLayer(layer: AnyLayer, before?: string | boolean | undefined): this;
  refreshBaseLayers(): void;
  /**
   * [自定义方法]清空除了底图、分割图层等内置图层之外的所有临时（专题）图层
   */
  removeOtherLayers(): void;
  /**
   * [自定义]切换底图
   * @param data string类型代表矢量瓦片url 地址
   * @param removeLast  是否移除上一次的底图 ，默认为true,目前不起作用
   */
  changeBaseMapStyle: (data: Style | string | undefined, removeLast?: boolean) => Promise<void>;
  /**
   * 切换底图
   * @param baseMapItem 传入底图item，可以是内置地图的id（如default，black，blue，gray），也可以是自定义的ISBaseMap对象。
   */
  /**
   * 切换style ，
   * 方法一：[不推荐] setSyle。 把新style与旧style合并，重新setStyle。简单粗暴
   *
   * 缺点：
   * 1.切换时整个地图会重新刷一遍，视觉上就会出现白屏
   * 2.之前动态加载的资源（如图标）将被清空，需要重新加载
   * @param styleJson
   * @param stay
   * @returns
   */
  private changeStyle;
  /**
   * 加载底图地图样式
   * @param styleJson
   * @param option
   */
  private addBaseMapStyle;
  /**
   * 加载地图样式
   * @param styleJson
   * @param option
   */
  private addStyle;
  /**
   * 移除底图的style，主要是 layers
   *
   * 判定依据：
   * layer对象中，没有metadata字段，是底图；
   * layer对象中，有metadata字段，isBaseMap =undefined 是底图。
   * layer对象中，有metadata字段，且metadata.isBaseMap为ture，是底图。
   * 综上： 有metadata且isBaseMap 明确标记为false 的是 非底图，其他情况都是底图
   */
  private removeBaseStyle;
  /**
   * [自定义方法]查找第一个非底图的图层。内置的 BASEMAP_SPLITED_LAYER 图层
   *
   * {layer:{meta:{isBaseMap:false}}}
   */
  getFirstBaseMapSplitedLayerId: () => [string, number];
  /**
   * [自定义方法]查找并获取紧挨着当前图层的上一个图层id，
   *
   * 如果是空，则表示当前图层不在map图层内，或者已经是第一个图层。
   * @param layerId 当前图层id
   */
  getLayerIdBefore: (layerId: string) => string | undefined;
  /**
   * [自定义方法]查找并获取紧挨着当前图层的下一个图层id，
   *
   * 如果是空，则表示当前图层不在map图层内，或者已经是最后一个图层。
   * @param layerId 当前图层id
   */
  getLayerIdAfter: (layerId: string) => string | undefined;
  /**
   * [自定义方法]添加一个空图层，仅用做占位。空图层为 background 类型，
   * @param layerId
   * @returns
   */
  addEmptyLayer: (layerId: string, beforeId?: string | undefined) => AnyLayer | null;
  /**
   * 添加底图分割图层
   * @returns
   */
  private safeAddBaseMapSplitedLayer;
  /**
   *   加载雪碧图
   *   Jin 2023.1.6
   *   */
  addSpriteImages: (spritePath: string) => Promise<void>;
  /**
   * [自定义扩展] 扩展 addSource方法，加入判断，简化addsource之前的 this.getSource(id) 是否存在的判断
   * @param id
   * @param source
   * @param bOverwrite 是否覆盖，如果是，将移除已存在的，再添加。反之，同名的source不做处理
   * @returns
   */
  addSourceEx: (id: string, source: AnySourceData, bOverwrite?: boolean) => this;
  /**
   * 设置自定义鼠标样式。 如果是自定义鼠标样式，名称要避开内置默认的鼠标样式名称
   * 建议使用大小为32x32 的png
   *
   * 不支持带别名的路径 如 @assets/image/curor.png
   * @param cursor 鼠标地址。可以用默认的鼠标样式名称
   */
  setMapCursor: (cursor: string, offset?: [number, number]) => void;
  /**
   *   绘制canvas
   *   Jin 2023.1.6
   *   */
  private createCanvas;
}
```
