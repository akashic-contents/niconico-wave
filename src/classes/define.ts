import { AssetInfo } from "./assetInfo";

/** 背景物配置情報の型 */
export interface LandmarkPlaceInfo {
	/** 背景物画像のフレーム名 */
	frameName: string;
	/** スクロール量に対応する左端の位置[メートル] */
	x: number;
}

/**
 * ゲーム関連の静的情報
 */
export namespace define {
	/** デバッグ用：タッチしている間PCが上昇するようにするフラグ */
	export const DEBUG_HOLD_TO_UP = false;
	/** デバッグ用：障害物にあたらなくするフラグ */
	export const DEBUG_COLLISION = false;
	/** デバッグ用：あたり判定範囲を表示するフラグ */
	export const DEBUG_SHOW_COLLISION_RECT = false;

	/** デバッグ用：あたり判定範囲表示の色 */
	export const DEBUG_COLLISION_RECT_COLOR = "#9999C2";
	/** デバッグ用：あたり判定範囲表示の不透明度 */
	export const DEBUG_COLLISION_RECT_OPACITY = 0.9;

	/** 制限時間[秒] */
	export const GAME_TIME = 60;
	/** このゲームが許容する最長の制限時間[秒] */
	export const GAME_TIME_MAX = 99;
	/** 残り時間警告が始まる残り時間[秒]（この時間未満になった時に始まる） */
	export const CAUTION_TIME_CONDITION = 6;

	/** 横解像度を480から640に変更した際のX座標オフセット値 */
	export const OFFSET_X = (640 - 480) / 2;
	/** ゲーム中の数字の桁数 */
	export const GAME_TIMER_DIGIT = 2;
	/** ゲーム中の数字のX座標 */
	export const GAME_TIMER_X = 70 + OFFSET_X;
	/** ゲーム中の数字のY座標 */
	export const GAME_TIMER_Y = 3;
	/** ポイント用の数字の桁数 */
	export const GAME_SCORE_DIGIT = 5;
	/** ポイント用の数字のX座標 */
	export const GAME_SCORE_X = 403 + OFFSET_X;
	/** ポイント用の数字のY座標 */
	export const GAME_SCORE_Y = 3;
	/** スコア上限 */
	export const SCORE_LIMIT = Math.pow(10, GAME_SCORE_DIGIT) - 1;

	/** UIアイコン（時計）のX座標 */
	export const ICON_T_X = 8 + OFFSET_X;
	/** UIアイコン（時計）のY座標 */
	export const ICON_T_Y = 0;
	/** UIアイコン（pt）のX座標 */
	export const ICON_PT_X = 432 + OFFSET_X;
	/** UIアイコン（pt）のY座標 */
	export const ICON_PT_Y = 0;

	/** PC/波/水面のX座標 */
	export const SURFING_X = 0;
	/** PC/波/水面のY座標 */
	export const SURFING_Y = 0;
	/** PCのアタッチ先ボーン名 */
	export const PC_PIVOT_NAME = "pc_null";

	/** ミスからの復帰後の無敵時間[フレーム] */
	export const RUNUP_FRAMES = 60;

	/** タッチ時に設定される上昇時間[フレーム] */
	export const UP_FRAMES_PER_TOUCH = 8;
	/** タッチ時に設定されるタッチ受付不能時間[フレーム] */
	export const TOUCH_COOLING_FRAMES = 1;
	/** 上昇アニメの再生速度 */
	export const PLAYSPEED_UP = 1;
	/** 下降アニメの再生速度 */
	export const PLAYSPEED_DOWN = 1.5;

	/** スクロール速度[px/フレーム]：分子 */
	export const SCROLL_PX_PER_FRAME_NUM = 30 * 160 * 2;
	/** スクロール速度[px/フレーム]：分母 */
	export const SCROLL_PX_PER_FRAME_DENOM = 60 * 30;
	/** スクロール量とメートル値の比[m/px]：分子 */
	export const SCROLL_METER_PER_PX_NUM = 1;
	/** スクロール量とメートル値の比[m/px]：分母 */
	export const SCROLL_METER_PER_PX_DENOM = 1;
	/** SCROLL_PX_PER_FRAME_NUMを基準とした最大速度 */
	export const SCROLL_FACTOR_MAX = 2;
	/** 最大速度に対応するPCせり出し量[px] */
	export const PC_OVERHANG_MAX = 60;

	/** 障害物の表示を開始する画面右端からのピクセル距離 */
	export const OBSTACLE_APPEAR_AREA_WIDTH = 480;
	/** 障害物の表示を終了する画面左端からのピクセル距離 */
	export const OBSTACLE_WIDTH_TO_VANISH_AREA = 480;

	/** プテラノドンのアニメを開始するX座標 */
	export const PTERANODON_WAKE_X = 534 + OFFSET_X;
	/** プテラノドンのあたり判定位置のボーン名 */
	export const PTERANODON_PIVOT_NAME = "obstacle_pteranodon_01_1";

	/** PCのあたり判定矩形 */
	export const COLLISION_PC: g.CommonArea = {
		x: -9 + 3, y: -44, width: 18 - 8, height: 44 - 9
	};
	/** 障害物のあたり判定矩形配列：カモメ */
	export const COLLISIONS_GULL: g.CommonArea[] = [
		{ x: 16, y: -50, width: 44, height: 18 }
	];
	/** 障害物のあたり判定矩形配列：岩 */
	export const COLLISIONS_ROCK: g.CommonArea[] = [
		{ x: 14, y: -295, width: 63, height: 295 }
	];
	/** 障害物のあたり判定矩形配列：サメ */
	export const COLLISIONS_SHARK: g.CommonArea[] = [
		{ x: 34, y: -74, width: 147, height: 54 },
		{ x: 96, y: -104, width: 28, height: 84 }
	];
	/** 障害物のあたり判定矩形配列：プテラノドン */
	export const COLLISIONS_PTERANODON: g.CommonArea[] = [
		{ x: 12, y: -45, width: 64, height: 23 }
	];

	/** 障害物に対する背景物のスクロール速度比 */
	export const LANDMARK_SCROLL_RATE = 0.35;
	/** 背景物の下端のY座標 */
	export const LANDMARK_BOTTOM_Y = 360;
	/** 背景物の配置位置情報配列 */
	export const LANDMARK_PLACEINFO: LandmarkPlaceInfo[] = [
		{ frameName: AssetInfo.bgObj.frames.bgObj01, x: -50 * 30 },
		{ frameName: AssetInfo.bgObj.frames.bgObj03, x: 80 * 30 },
		{ frameName: AssetInfo.bgObj.frames.bgObj02, x: 170 * 30 },
		{ frameName: AssetInfo.bgObj.frames.bgObj06, x: 240 * 30 },
		{ frameName: AssetInfo.bgObj.frames.bgObj04, x: 360 * 30 },
		{ frameName: AssetInfo.bgObj.frames.bgObj05, x: 480 * 30 },
		{ frameName: AssetInfo.bgObj.frames.bgObj07, x: 600 * 30 },
		{ frameName: AssetInfo.bgObj.frames.bgObj08, x: 720 * 30 },
		{ frameName: AssetInfo.bgObj.frames.bgObj09, x: 850 * 30 }
	];
	/** マップの終端座標 */
	export const MAP_END_PIXEL = 30630 + 88 + 640;
	/** マップループ時開始座標 */
	export const MAP_REPEATED_START_PIXEL = -1500;
}
