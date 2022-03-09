import * as tl from "@akashic-extension/akashic-timeline";
import { RectData } from "./spriteSheetTypes";
import { SpriteFrameMap } from "./spriteSheetTypes";
import { AssetInfoType } from "../commonTypes/assetInfoType";
import { MiscAssetInfoType } from "../commonTypes/miscAssetInfoType";

/** game.vars.gameStateの型 */
export type GameStateType = {
	/** ゲーム中にも更新されるスコア値 */
	score: number;
	/** ゲームが終了していたらtrueになるフラグ */
	isFinished: boolean;
};

/** Assetのマップの型 */
export type AssetMapType = { [key: string]: g.Asset };

/** GlyphAreaのマップの型 */
export type GlyphMapType = { [key: string]: g.GlyphArea };

/** ビットマップフォント定義のjsonの型 */
export type FontJsonType = {
	map: GlyphMapType;
	missingGlyph?: g.GlyphArea;
	width?: number;
	height?: number;
};

/** 0のキャラクターコード */
export const CHAR_CODE_0 = 48;
/** 9のキャラクターコード+1 */
export const CHAR_CODE_10 = 58;

/**
 * ゲームから利用するユーティリティ関数群
 */
export namespace gameUtil {
	/**
	 * MiscAssetInfoTypeのマップからアセット名を配列に追加する
	 * @param _map      MiscAssetInfoTypeのマップ
	 * @param _assetIds アセット名配列
	 */
	export function addAssetIdsFromMiscAssetInfoMap(
		_map: Object, _assetIds: string[]): void {
		const checkServer: boolean = g.game.vars.hasOwnProperty("isServer");
		const isServer: boolean = checkServer ? g.game.vars.isServer : false;
		Object.keys(_map).forEach((i: string) => {
			const info: MiscAssetInfoType =
				(<{ [key: string]: MiscAssetInfoType }>_map)[i];
			if (checkServer
				&& info.hasOwnProperty("isServer")
				&& (isServer !== info.isServer)
			) {
				return;
			}
			_assetIds[_assetIds.length] = info.name;
		});
	}

	/**
	 * マップオブジェクトの要素の配列を生成する
	 * @param _map マップオブジェクト
	 * @return     要素の配列
	 */
	export function getArrayFromMap<T>(_map: any): T[] {
		const array: T[] = [];
		Object.keys(_map).forEach((i: string) => {
			array[array.length] = _map[i];
		});
		return array;
	}

	/**
	 * 与えられたパラメータでBitmapFont生成用のGlyphAreaのマップを生成する
	 * @param _charWidth     文字の幅
	 * @param _charHeight    文字の高さ
	 * @param _charsInRow    1行の文字数
	 * @param _charCodeStart 文字コードの開始値
	 * @param _charCodeEnd   文字コードの終了値+1
	 * @return               GlyphAreaのマップ
	 */
	export function makeGlyphMap(
		_charWidth: number, _charHeight: number, _charsInRow: number,
		_charCodeStart: number, charCodeEnd: number): GlyphMapType {
		const map: GlyphMapType = {};
		for (let i = 0; i < (charCodeEnd - _charCodeStart); ++i)
			map[i + _charCodeStart] = {
				x: (i % _charsInRow) * _charWidth,
				y: Math.floor(i / _charsInRow) * _charHeight
			};
		return map;
	}

	/**
	 * スプライトシートのjsonとフレーム名配列からBitmapFont生成用の
	 * GlyphAreaのマップを生成する
	 * @param _charCodeStart 文字コードの開始値
	 * @param _charCodeEnd   文字コードの終了値+1
	 * @param _json          スプライトシートのjson
	 * @param _frames        フレーム名配列
	 * @return               GlyphAreaのマップ
	 */
	export function makeGlyphMapFromFrames(
		_charCodeStart: number, _charCodeEnd: number, _json: SpriteFrameMap,
		_frames: string[]): GlyphMapType {
		const map: GlyphMapType = {};
		for (let i = 0; i < (_charCodeEnd - _charCodeStart); ++i) {
			const frame = _json.frames[_frames[i]].frame;
			map[i + _charCodeStart] = {
				x: frame.x,
				y: frame.y,
				width: frame.w,
				height: frame.h
			};
		}
		return map;
	}

	/**
	 * GlyphAreaのマップに1文字分の情報を追加する
	 * @param _oneChar   追加する文字
	 * @param _json      スプライトシートのjson
	 * @param _frameName フレーム名
	 * @param _map       GlyphAreaのマップ
	 */
	export function addOneGlyphMapFromFrame(
		_oneChar: string, _json: SpriteFrameMap, _frameName: string,
		_map: GlyphMapType): void {
		const frame: RectData = _json.frames[_frameName].frame;
		_map[_oneChar.charCodeAt(0)] = {
			x: frame.x,
			y: frame.y,
			width: frame.w,
			height: frame.h
		};
	}

	/**
	 * AssetInfoの情報からBitmapFontを生成する
	 * @param _info   アセット情報
	 * @return         生成したBitmapFont
	 */
	export function createNumFontWithAssetInfo(_info: AssetInfoType): g.BitmapFont {
		const frameMap: SpriteFrameMap = g.game.scene().asset.getJSONContentById(_info.json);
		const glyphMap = gameUtil.makeGlyphMapFromFrames(
			CHAR_CODE_0, CHAR_CODE_10, frameMap, _info.numFrames);
		if (_info.nonnumFrames) {
			const iEnd = _info.nonnumFrames.length;
			for (let i = 0; i < iEnd; ++i) {
				const oneChar = _info.nonnumFrames[i];
				addOneGlyphMapFromFrame(
					oneChar.char, frameMap, oneChar.frame, glyphMap);
			}
		}
		let missingGlyph: g.GlyphArea;
		if (_info.missing) {
			const frame: RectData = frameMap.frames[_info.missing].frame;
			missingGlyph = {
				x: frame.x,
				y: frame.y,
				width: frame.w,
				height: frame.h
			};
		}
		const font = new g.BitmapFont({
			src: g.game.scene().asset.getImageById(_info.img),
			map: glyphMap,
			defaultGlyphWidth: _info.fontWidth,
			defaultGlyphHeight: _info.fontHeight,
			missingGlyph
		});
		return font;
	}

	/**
	 * tl.Timeline#createのショートハンド
	 * @param  _timeline Timelineインスタンス
	 * @param  _entity   Tweenの生成用エンティティ
	 * @return           生成されたTween
	 */
	export function createTween(
		_timeline: tl.Timeline, _entity: g.E): tl.Tween {
		return _timeline.create(
			_entity,
			{ modified: _entity.modified, destroyed: _entity.destroyed });
	}

	/**
	 * Matrixのdx項を返すメソッド
	 * @param  _matrix Matrixインスタンス
	 * @return         dxの値
	 */
	export function getMatrixDx(_matrix: g.Matrix): number {
		return _matrix._matrix[4];
	}
	/**
	 * Matrixのdy項を返すメソッド
	 * @param  _matrix Matrixインスタンス
	 * @return         dyの値
	 */
	export function getMatrixDy(_matrix: g.Matrix): number {
		return _matrix._matrix[5];
	}
	/**
	 * Matrixのdx項を設定するメソッド
	 * @param   _matrix Matrixインスタンス
	 * @return          設定するdxの値
	 */
	export function setMatrixDx(_matrix: g.Matrix, _dx: number): void {
		_matrix._matrix[4] = _dx;
	}
	/**
	 * Matrixのdy項を設定するメソッド
	 * @param _matrix Matrixインスタンス
	 * @param _dy     設定するdyの値
	 */
	export function setMatrixDy(_matrix: g.Matrix, _dy: number): void {
		_matrix._matrix[5] = _dy;
	}

	/**
	 * g.game.vars.gameStateを初期化するメソッド
	 */
	export function initGameState(): void {
		const gameState: GameStateType = {
			score: 0,
			isFinished: false
		};
		g.game.vars.gameState = gameState;
		// console.log("initGameState: gameState.score:" + g.game.vars.gameState.score + ".");
	}

	/**
	 * g.game.vars.gameStateのスコアを更新するメソッド
	 * @param _score スコア値
	 */
	export function updateGameStateScore(_score: number): void {
		const gameState = <GameStateType>g.game.vars.gameState;
		if (gameState && (!gameState.isFinished)) {
			gameState.score = _score;
		}
		// console.log("updateGameStateScore: gameState.score:" + g.game.vars.gameState.score + ".");
	}

	/**
	 * g.game.vars.scenedataにスコアを保存する
	 * @param _score 保存する値
	 */
	export function setGameScore(_score: number): void {
		g.game.vars.scenedata.gameScore = _score;
		// console.log("setGameScore: gameScore:" + g.game.vars.scenedata.gameScore + ".");
		(<GameStateType>g.game.vars.gameState).isFinished = true;
	}
	/**
	 * g.game.vars.scenedataからスコアを取得する
	 * @return 取得した値（setGameScoreされていない場合は0）
	 */
	export function getGameScore(): number {
		// console.log("getGameScore: gameScore:"+g.game.vars.scenedata.gameScore+".");
		let score: number = g.game.vars.scenedata.gameScore;
		if (!score) {
			score = 0;
		}
		return score;
	}

	/**
	 * フレームから秒へ換算する（小数部あり）
	 * @param _frame フレーム数
	 * @return 秒数
	 */
	export function frame2Sec(_frame: number): number {
		return (_frame / g.game.fps);
	}
	/**
	 * 秒からフレームへ換算する（小数部あり）
	 * @param _seconds 秒数
	 * @return フレーム数
	 */
	export function sec2Frame(_seconds: number): number {
		return (_seconds * g.game.fps);
	}
	/**
	 * フレームからミリ秒へ換算する（小数部あり）
	 * @param _frame フレーム数
	 * @return ミリ秒数
	 */
	export function frame2MSec(_frame: number): number {
		return (_frame * 1000 / g.game.fps);
	}
	/**
	 * ミリ秒からフレームへ換算する（小数部あり）
	 * @param _milliseconds ミリ秒数
	 * @return フレーム数
	 */
	export function mSec2Frame(_milliseconds: number): number {
		return (_milliseconds / 1000 * g.game.fps);
	}

	/**
	 * ゼロ以上で指定した最大値未満のランダムな整数を返す
	 * @param _max       最大値
	 * @param opt_random (optional)RandomGeneratorインスタンス
	 * （省略時はg.game.random[0]を使用する）
	 * @return           ランダムな整数
	 */
	export function getRandomLessThanMax(
		_max: number, opt_random?: g.RandomGenerator): number {
		if (!opt_random) {
			opt_random = g.game.random;
		}
		return Math.floor(opt_random.generate() * _max);
	}

	/**
	 * 2つの値と比率から中間値を計算する
	 * @param  _min 値1
	 * @param  _max 値2
	 * @param  _rate 比率
	 * @return       比率による中間値
	 */
	export function blendValue(
		_min: number, _max: number, _rate: number): number {
		return (_min + ((_max - _min) * _rate));
	}

	/**
	 * bからaに向かう2次元ベクトルを求める
	 * @param  _a 2次元ベクトル
	 * @param  _b 2次元ベクトル
	 * @return    bからaへのベクトル
	 */
	export function vec2Sub(
		_a: g.CommonOffset, _b: g.CommonOffset): g.CommonOffset {
		return { x: (_a.x - _b.x), y: (_a.y - _b.y) };
	}
	/**
	 * スカラー倍した2次元ベクトルを求める
	 * @param  _a     2次元ベクトル
	 * @param  _scale 倍率
	 * @return        scale倍した2次元ベクトル
	 */
	export function vec2Scale(
		_a: g.CommonOffset, _scale: number): g.CommonOffset {
		return { x: (_a.x * _scale), y: (_a.y * _scale) };
	}
	/**
	 * bからaに向かう2次元ベクトルの長さの2乗を求める
	 * @param _a 2次元ベクトル
	 * @param _b 2次元ベクトル
	 * @return   bからaへのベクトルの長さの2乗
	 */
	export function vec2SubLengthSq(
		_a: g.CommonOffset, _b: g.CommonOffset): number {
		const dx: number = _a.x - _b.x;
		const dy: number = _a.y - _b.y;
		return (dx * dx) + (dy * dy);
	}
	/**
	 * 2次元ベクトルの長さを求める
	 * @param  _a 2次元ベクトル
	 * @return    ベクトルの長さ
	 */
	export function vec2Length(_a: g.CommonOffset): number {
		return Math.sqrt((_a.x * _a.x) + (_a.y * _a.y));
	}

	/**
	 * 配列をシャッフルして新しい配列を返す
	 * @param _array     シャッフルする配列
	 * @param opt_random (optional)RandomGeneratorインスタンス
	 * （省略時はg.game.random[0]を使用する）
	 * @return           シャッフルされた配列
	 */
	export function shuffle<T>(_array: Array<T>, opt_random?: g.RandomGenerator): Array<T> {
		if (!opt_random) {
			opt_random = g.game.random;
		}
		const copyArray = _array.slice();
		let m: number = copyArray.length;
		let t: T;
		let i: number;
		while (m) {
			i = getRandomLessThanMax(--m, opt_random);
			t = copyArray[m];
			copyArray[m] = copyArray[i];
			copyArray[i] = t;
		}
		return copyArray;
	}
}
