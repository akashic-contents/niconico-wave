/**
 * 共通演出関連の静的情報
 */
export namespace commonDefine {
	/** 背景透過部分の黒アルファの不透明度 */
	export const BG_SHADE_OPACITY = 0.2;
	/** デバッグ用：タイトル画面/説明画面をスキップするフラグ */
	export const DEBUG_SKIP_PREGAMESUBSCENE = false;

	/**
	 * タイトル画面と説明画面でタッチ受付を開始するまでの時間[ms]
	 * 0の場合はタッチ受付を開始しない
	 */
	export const TOUCH_SKIP_WAIT = 0;
	/** ゲーム開始情報画面開始からタイトル画面に遷移するまでの時間[ms] */
	export const INFORMATION_WAIT = 7000;
	/** タイトル画面開始から説明画面に遷移するまでの時間[ms] */
	export const TITLE_WAIT = 5000;
	/** 説明画面開始からゲーム画面に遷移するまでの時間[ms] */
	export const DESCRIPTION_WAIT = 6000;
	/** タイムアップ後リザルト画面に遷移するまでの時間[ms] */
	export const TIMEUP_WAIT = 3000;
	/** 結果画面でリトライ操作を受け付けるフラグ */
	export const ENABLE_RETRY = false;

	/** 残り時間警告の点滅時間：OFF→ON */
	export const CAUTION_TIME_ON = 5;
	/** 残り時間警告の点滅時間：ON→OFF */
	export const CAUTION_TIME_OFF = 25;
	/** 残り時間警告の赤点滅の色 */
	export const CAUTION_FILLRECT_COLOR = "#F34252";
	/** 残り時間警告の赤点滅の不透明度：OFF */
	export const CAUTION_FILLRECT_OPACITY_OFF = 0.2;
	/** 残り時間警告の赤点滅の不透明度：ON */
	export const CAUTION_FILLRECT_OPACITY_ON = 0.5;
	/** 残り時間警告の時間表示のスケール：OFF */
	export const CAUTION_TIME_SCALE_OFF = 1.0;
	/** 残り時間警告の時間表示のスケール：ON */
	export const CAUTION_TIME_SCALE_ON = 1.2;

	/** リザルトの点数の桁数 */
	export const RESULT_SCORE_DIGIT = 5;
	/** リザルト画面でスコアをロール表示する時間[ms] */
	export const RESULT_ROLL_WAIT = 1500;

	/** tipsを表示するフラグ */
	export const SHOW_TIPS: boolean = false;
	/** tipsを表示しない場合のリザルトオブジェクトのY座標補正値 */
	export const RESULT_OBJECTS_OFFSET_Y: number = 76;
	/** tipsアセット変数名の先頭部分 */
	export const TIPS_VAR_NAME_HEAD: string = "tipsImg";
	/** tips画像サイズ */
	export const TIPS_IMG_SIZE: g.CommonSize = { width: 410, height: 120 };
	/** tips画像左上座標 */
	export const TIPS_IMG_POS: g.CommonOffset = { x: 115, y: 220 };
}
