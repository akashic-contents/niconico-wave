import asa = require("@akashic-extension/akashic-animation");
import * as tl from "@akashic-extension/akashic-timeline";
import { gameUtil } from "./gameUtil";
import { AssetMapType } from "./gameUtil";
import { RectData } from "./spriteSheetTypes";
import { SpriteFrameMap } from "./spriteSheetTypes";
import { AssetInfoType } from "../commonTypes/assetInfoType";
import { AsaInfoType } from "../commonTypes/asaInfoType";

/**
 * g.Spriteとasa.Actor関連のユーティリティ関数群
 */
export namespace spriteUtil {
	/**
	 * フレーム名に対応するフレーム矩形を取得する
	 * @param _data スプライトシートのjson
	 * @param _key フレーム名
	 * @return      フレーム矩形
	 */
	export function getRectData(
		_data: SpriteFrameMap, _key: string): RectData {
		const rect: RectData = {
			x: _data.frames[_key].frame.x,
			y: _data.frames[_key].frame.y,
			w: _data.frames[_key].frame.w,
			h: _data.frames[_key].frame.h
		};
		return rect;
	}

	/**
	 * スプライトシートのjsonとフレーム名からSpriteのパラメータを設定する
	 * @param _jsonData  スプライトシートのjson
	 * @param _frameName フレーム名
	 * @param _sprite    対象のSprite
	 */
	export function setSpriteFrame(
		_jsonData: SpriteFrameMap, _frameName: string,
		_sprite: g.Sprite): void {
		const rect: RectData = getRectData(_jsonData, _frameName);
		_sprite.srcX = rect.x;
		_sprite.srcY = rect.y;
		_sprite.srcWidth = rect.w;
		_sprite.srcHeight = rect.h;
		_sprite.width = rect.w;
		_sprite.height = rect.h;
		_sprite.invalidate();
	}
	/**
	 * Spriteの生成とsetSpriteFrameを行う
	 * @param _spriteOption Sprite生成用パラメータ
	 * @param _jsonData     スプライトシートのjson
	 * @param _frameName    フレーム名
	 * @return              生成したSprite
	 */
	export function createFrameSprite(
		_spriteOption: g.SpriteParameterObject, _jsonData: SpriteFrameMap,
		_frameName: string): g.Sprite {
		const sprite: g.Sprite = new g.Sprite(_spriteOption);
		setSpriteFrame(_jsonData, _frameName, sprite);
		return sprite;
	}

	/**
	 * AssetInfoの情報からSpriteParameterObjectを生成する
	 * @param _info     アセット情報
	 * @param opt_scene (optional)g.Sceneインスタンス
	 * （省略時はg.game.scene()を使用する）
	 * @return          生成したSpriteParameterObject
	 */
	export function createSpriteParameter(
		_info: AssetInfoType, opt_scene?: g.Scene): g.SpriteParameterObject {
		if (!opt_scene) {
			opt_scene = g.game.scene();
		}
		const spriteParam: g.SpriteParameterObject = {
			scene: opt_scene,
			src: opt_scene.assets[_info.img]
		};
		return spriteParam;
	}

	/**
	 * AssetInfoの情報からSpriteFrameMapを生成する
	 * @param _info      アセット情報
	 * @param opt_assets (optional)g.Assetのマップ
	 * （省略時はg.game.scene().assetsを使用する）
	 * @return           生成したSpriteFrameMap
	 */
	export function createSpriteFrameMap(
		_info: AssetInfoType, opt_assets?: AssetMapType): SpriteFrameMap {
		if (!opt_assets) {
			opt_assets = g.game.scene().assets;
		}
		const frameMap: SpriteFrameMap = JSON.parse(
			(<g.TextAsset>opt_assets[_info.json]).data);
		return frameMap;
	}
	/**
	 * スプライトの画像だけ変更
	 * @param _sprite 変更したいスプライトオブジェクト
	 * @param _asset この画像に変更したい
	 */
	export function changeSpriteSurface(_sprite: g.Sprite, _asset: g.Asset): void {
		_sprite.surface = (<g.ImageAsset>_asset).asSurface();
		_sprite.invalidate();
	}

	/**
	 * asa.Actorをmodify/calcする関数を返す
	 * @param _actor 対象のasa.Actor
	 * @return       modify/calcする関数
	 */
	export function makeActorUpdater(_actor: asa.Actor): () => void {
		return (): void => {
			if (_actor.visible() && !_actor.pause) {
				_actor.modified();
				_actor.calc();
			}
		};
	}

	/**
	 * asa.Actorを指定時間modify/calcしてdestroyする
	 * @param _timeline      tl.Timelineインスタンス
	 * @param _actor         対象のasa.Actor
	 * @param _frameDuration destroyするまでのフレーム数
	 * @param _onFinish      destroyした時点で呼ばれる関数
	 * @return               tl.Tweenインスタンス
	 */
	export function setDelayDestroy(
		_timeline: tl.Timeline, _actor: asa.Actor, _frameDuration: number,
		_onFinish: () => void): tl.Tween {
		const fps = _timeline._scene.game.fps;
		return gameUtil.createTween(_timeline, _actor).
			every(
				(e: number, p: number): void => {
					_actor.modified();
					_actor.calc();
				},
				_frameDuration * 1000 / fps).
			call((): void => {
				_actor.destroy();
				if (!!_onFinish) {
					_onFinish();
				}
			});
	}

	/**
	 * AssetInfoTypeのマップからアセット名を配列に追加する
	 * @param _map      AssetInfoTypeのマップ
	 * @param _assetIds アセット名配列
	 */
	export function addAssetIdsFromAssetInfoMap(
		_map: Object, _assetIds: string[]): void {
		const checkServer: boolean = g.game.vars.hasOwnProperty("isServer");
		const isServer: boolean = checkServer ? g.game.vars.isServer : false;
		Object.keys(_map).forEach((i: string) => {
			const info = (<{ [key: string]: AssetInfoType }>_map)[i];
			if (checkServer
				&& info.hasOwnProperty("isServer")
				&& (isServer !== info.isServer)
			) {
				return;
			}
			_assetIds[_assetIds.length] = info.img;
			if (!info.json) return;
			_assetIds[_assetIds.length] = info.json;
		});
	}

	/**
	 * AsaInfoTypeのマップからasapj名の配列を生成する
	 * @param  _map AsaInfoTypeのマップ
	 * @return      asapj名の配列
	 */
	export function getPjNamesFromAsainfoMap(_map: Object): string[] {
		const checkServer: boolean = g.game.vars.hasOwnProperty("isServer");
		const isServer: boolean = checkServer ? g.game.vars.isServer : false;
		const array: string[] = [];
		Object.keys(_map).forEach((i: string) => {
			const info = (<{ [key: string]: AsaInfoType }>_map)[i];
			if (checkServer
				&& info.hasOwnProperty("isServer")
				&& (isServer !== info.isServer)
			) {
				return;
			}
			array[array.length] = info.pj;
		});
		return array;
	}
}
