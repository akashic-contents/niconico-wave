import { AssetMapType } from "./gameUtil";

/**
 * Tiledのデータを扱うユーティリティ関数群
 */
export namespace tiledUtil {
	/** TileMap#orientationの値：orthogonal */
	export const ORIENTATION_ORTHOGONAL = "orthogonal";
	/** TileMap#orientationの値：isometric */
	export const ORIENTATION_ISOMETRIC = "isometric";
	/** TileMap#orientationの値：staggered */
	export const ORIENTATION_STAGGERED = "staggered";
	/** TileMap#renderorderの値：right-down */
	export const RENDERORDER_RIGHT_DOWN = "right-down";
	/** LayerFormat#typeの値：tilelayer */
	export const LAYERTYPE_TILELAYER = "tilelayer";
	/** LayerFormat#typeの値：objectgroup */
	export const LAYERTYPE_OBJECTGROUP = "objectgroup";
	/** LayerFormat#typeの値：imagelayer */
	export const LAYERTYPE_IMAGELAYER = "imagelayer";

	/** Mapオブジェクトの型 */
	export interface MapFormat {
		width: number;
		height: number;
		tilewidth: number;
		tileheight: number;
		orientation: string;
		layers: LayerFormat[];
		tilesets: TilesetFormat[];
		backgroundcolor?: string;
		renderorder?: string;
		properties?: Object;
		nextobjectid?: number;
	}

	/** Layerオブジェクトの型 */
	export interface LayerFormat {
		width: number;
		height: number;
		name: string;
		type: string;
		visible: boolean;
		x: number;
		y: number;
		data?: number[];
		objects?: ObjectFormat[];
		properties?: Object;
		opacity: number;
		offsetx?: number;
		offsety?: number;
		image?: string;
		draworder?: string;
	}

	/** Objectオブジェクトの型 */
	export interface ObjectFormat {
		id: number;
		width: number;
		height: number;
		name: string;
		type: string;
		properties?: Object;
		visible: boolean;
		x: number;
		y: number;
		rotation: number;
		gid?: number;
	}

	/** Tilesetオブジェクトの型 */
	export interface TilesetFormat {
		firstgid: number;
		image: string;
		name: string;
		tilewidth: number;
		tileheight: number;
		imagewidth: number;
		imageheight: number;
		properties?: Object;
		margin: number;
		spacing: number;
		tilecount?: number;
		columns?: number;
		tileproperties?: Object;
		terrains?: Object[];
		tiles?: Object;
	}

	/**
	 * jsonからMapオブジェクトを生成する
	 * @param _mapJsonName jsonアセット名
	 * @param opt_assets   (optional)g.Assetのマップ
	 * （省略時はg.game.scene().assetsを使用する）
	 * @return             生成したMapオブジェクト
	 */
	export function loadMapdata(
		_mapJsonName: string, opt_assets?: AssetMapType): MapFormat {
		if (!opt_assets) {
			opt_assets = g.game.scene().assets;
		}
		// console.log("loadMapdata: _mapJsonName:"+_mapJsonName+", keys(opt_assets):"+Object.keys(opt_assets).join()+".");
		const map: MapFormat = JSON.parse(
			(<g.TextAsset>opt_assets[_mapJsonName]).data);
		return map;
	}

	/**
	 * jsonからObjectLayerのobjectsを取得する
	 * @param _mapJsonName        jsonアセット名
	 * @param opt_assets          (optional)g.Assetのマップ
	 * （省略時はg.game.scene().assetsを使用する）
	 * @param opt_enableOffset    (optional)オブジェクトレイヤーのオフセットx,yを反映する
	 *  (省略時はオフセットx,yを反映しない)
	 * @param opt_useLayerVisible (optional)オブジェクトレイヤーのvisibleフラグを判定する
	 *  (省略時はvisibleフラグを判定しない)
	 * @return                    生成したMapオブジェクト
	 */
	export function getObjects(
		_mapJsonName: string, opt_assets?: AssetMapType,
		opt_enableOffset: boolean = false,
		opt_useLayerVisible: boolean = false
	): ObjectFormat[] {
		const map = loadMapdata(_mapJsonName, opt_assets);
		const layers = map.layers;
		const iEnd = layers.length;
		let resAry: ObjectFormat[] = [];
		for (let i = 0; i < iEnd; ++i) {
			if (opt_useLayerVisible && !layers[i].visible) {
				continue;
			}
			if (layers[i].type === LAYERTYPE_OBJECTGROUP) {
				// オブジェクトレイヤーのオフセットを反映する場合
				if (opt_enableOffset) {
					// オフセットが0,0の場合JSONに書き出されない為undefinedなら無効とする
					if (layers[i].offsetx !== undefined && layers[i].offsety !== undefined) {
						layers[i].objects.forEach((item) => {
							item.x += layers[i].offsetx;
							item.y += layers[i].offsety;
						});
					}
				}
				// オブジェクトレイヤーの中身を連結する
				resAry = resAry.concat(layers[i].objects);
			}
		}
		return resAry;
	}
	/**
	 * jsonからObjectLayerのobjectsを2次元配列で取得する
	 * @param _mapJsonName jsonアセット名
	 * @param opt_assets (optional)g.Assetのマップ
	 * （省略時はg.game.scene().assetsを使用する）
	 * @return           生成したMapオブジェクト
	 */
	export function getObjects2Array(
		_mapJsonName: string, opt_assets?: AssetMapType): ObjectFormat[][] {
		const resObjAry: ObjectFormat[][] = [];
		const map = loadMapdata(_mapJsonName, opt_assets);
		const layers = map.layers;
		const iEnd = layers.length;
		for (let i = 0; i < iEnd; ++i) {
			if (layers[i].type === LAYERTYPE_OBJECTGROUP) {
				resObjAry.push(layers[i].objects);
			}
		}
		return resObjAry;
	}
}
