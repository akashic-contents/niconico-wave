import * as tl from "@akashic-extension/akashic-timeline";
import { BitmapFont } from "@akashic/akashic-engine";
import { commonDefine } from "../common/commonDefine";
import { AssetInfoType } from "../commonTypes/assetInfoType";
import { entityUtil } from "../util/entityUtil";
import { gameUtil } from "../util/gameUtil";
import { define } from "./define";

/**
 * 残り時間の管理、表示を行うクラス
 * 残り時間警告の演出も管理する。
 */
export class TimerLabel extends g.E {
	/** 残り時間警告表示の開始を通知するトリガー */
	timeCaution: g.Trigger<void>;
	/** 残り時間警告表示の中断を通知するトリガー */
	timeCautionCancel: g.Trigger<void>;

	/** 点滅用レイヤー */
	private scaleLayer: g.E;
	/** 数字表示ラベル(黒) */
	private labelBlack: g.Label;
	/** 数字表示ラベル(赤) */
	private labelRed: g.Label;
	/** 点滅中フラグ */
	private isBlinking_: boolean;
	/** 残り時間[フレーム数] */
	private remainFrameCount: number;
	/** 現在表示している値 */
	private currentCount: number;

	/**
	 * コンストラクタ
	 * @param  {g.Scene} _scene Sceneインスタンス
	 */
	constructor(_scene: g.Scene) {
		super({ scene: _scene });
		this.timeCaution = new g.Trigger<void>();
		this.timeCautionCancel = new g.Trigger<void>();
	}

	/**
	 * 表示系以外のオブジェクトをdestroyするメソッド
	 * 表示系のオブジェクトはg.Eのdestroyに任せる。
	 * @override
	 */
	destroy(): void {
		if (this.destroyed()) {
			return;
		}
		if (this.timeCaution) {
			this.timeCaution.destroy();
			this.timeCaution = null;
		}
		if (this.timeCautionCancel) {
			this.timeCautionCancel.destroy();
			this.timeCautionCancel = null;
		}
		super.destroy();
	}

	/**
	 * フォントのアセット情報を渡してラベルを生成するメソッド
	 * @param {AssetInfoType} _numBlackInfo 黒文字のアセット情報
	 * @param {AssetInfoType} _numRedInfo 赤文字のアセット情報
	 */
	createLabel(
		_numBlackInfo: AssetInfoType, _numRedInfo: AssetInfoType): void {
		this.remainFrameCount = 0;
		this.currentCount = 0;

		const fontBlack = gameUtil.createNumFontWithAssetInfo(_numBlackInfo);
		const labelBlack = this.labelBlack = entityUtil.createNumLabel(
			this.scene, fontBlack, define.GAME_TIMER_DIGIT);
		entityUtil.appendEntity(labelBlack, this);

		const scaleLayer = this.scaleLayer = new g.E({ scene: this.scene });
		entityUtil.appendEntity(scaleLayer, this);

		const fontRed = gameUtil.createNumFontWithAssetInfo(_numRedInfo);
		const labelRed = this.labelRed = entityUtil.createNumLabel(
			this.scene, fontRed, define.GAME_TIMER_DIGIT);
		entityUtil.appendEntity(labelRed, scaleLayer);

		this.stopBlink();
	}

	/**
	 * 右端の数字の左上を指定してラベルの位置を設定するメソッド
	 * @param {number} _x 右端の数字の左上のx座標
	 * @param {number} _y 右端の数字の左上のy座標
	 */
	moveLabelTo(_x: number, _y: number): void {
		if (!this.labelBlack) {
			return;
		}

		// 点滅時の拡大基準点
		const label = this.labelBlack;
		const font = label.font as BitmapFont;
		const pivotX = _x + (font.defaultGlyphWidth / 2);
		const pivotY = _y + (font.defaultGlyphHeight / 2);
		entityUtil.setXY(this.scaleLayer, pivotX, pivotY);

		// ラベルの左上
		const labelX = _x + font.defaultGlyphWidth - label.width;
		const labelY = _y;

		entityUtil.setXY(this.labelBlack, labelX, labelY);
		entityUtil.setXY(this.labelRed, labelX - pivotX, labelY - pivotY);
	}

	/**
	 * 現在の残り秒数を設定するメソッド
	 * @param {number} _seconds 設定する値
	 */
	setTimeCount(_seconds: number): void {
		this.setTimeFrameCount(gameUtil.sec2Frame(_seconds));
	}
	/**
	 * 現在の残り秒数をフレーム数で設定するメソッド
	 * @param {number} _frames 設定する値
	 */
	setTimeFrameCount(_frames: number): void {
		this.remainFrameCount = _frames;
		this.renewCurrentNumber(true);
	}

	/**
	 * 現在の残り秒数を取得するメソッド（小数部は切り上げる）
	 * @return {number} 秒数
	 */
	getTimeCount(): number {
		return Math.ceil(gameUtil.frame2Sec(this.remainFrameCount));
	}

	/**
	 * 現在の残り秒数を取得するメソッド（小数部あり）
	 * @return {number} 秒数
	 */
	getTimeCountReal(): number {
		return gameUtil.frame2Sec(this.remainFrameCount);
	}

	/**
	 * 現在の残り秒数をフレーム数で取得するメソッド
	 * @return {number} フレーム数
	 */
	getTimeFrameCount(): number {
		return this.remainFrameCount;
	}

	/**
	 * 点滅状態を取得するメソッド
	 * @return {boolean} 点滅中ならばtrue
	 */
	isBlinking(): boolean {
		return this.isBlinking_;
	}

	/**
	 * 1フレーム分時間を進めるメソッド
	 */
	tick(): void {
		if (this.remainFrameCount > 0) {
			--this.remainFrameCount;
			// remainFrameCountの値が小数である場合を考慮した条件
			if (this.remainFrameCount < 0) {
				this.remainFrameCount = 0;
			}
			this.renewCurrentNumber();
		}
	}

	/**
	 * 残り時間によらず赤点滅演出を終了するメソッド
	 */
	forceStopBlink(): void {
		if (this.isBlinking_) {
			this.stopBlink();
		}
	}

	/**
	 * 残り時間表示の更新を行うメソッド
	 * opt_isForceがtrueでなければ現在の表示内容と変化がある場合のみ
	 * ラベル内容を設定する
	 * @param {boolean = false} opt_isForce (optional)強制設定フラグ
	 */
	private renewCurrentNumber(opt_isForce: boolean = false): void {
		const seconds = this.getTimeCount();
		if (opt_isForce || (seconds !== this.currentCount)) {
			const text = String(seconds);
			entityUtil.setLabelText(this.labelBlack, text);
			entityUtil.setLabelText(this.labelRed, text);
			this.currentCount = seconds;
			this.checkBlinkState();
		}
	}

	/**
	 * 赤点滅状態を確認、更新するメソッド
	 */
	private checkBlinkState(): void {
		if ((this.currentCount > 0) &&
			(this.currentCount < define.CAUTION_TIME_CONDITION)) {
			if (!this.isBlinking_) {
				this.startBlink();
			}
		} else {
			if (this.isBlinking_) {
				this.stopBlink();
			}
		}
	}

	/**
	 * 赤点滅演出を開始するメソッド
	 */
	private startBlink(): void {
		this.isBlinking_ = true;
		this.setTween();
		entityUtil.hideEntity(this.labelBlack);
		entityUtil.showEntity(this.labelRed);
		this.timeCaution.fire();
	}

	/**
	 * 赤点滅演出を終了するメソッド
	 */
	private stopBlink(): void {
		this.isBlinking_ = false;
		entityUtil.hideEntity(this.labelRed);
		entityUtil.showEntity(this.labelBlack);
		this.timeCautionCancel.fire();
		// stopBlinkのあと実行中のtweenが終了する前にstartBlinkされると
		// 正常に動かないが仕様上起きない前提とする。
	}

	/**
	 * 赤点滅一周期分のtweenを設定するメソッド
	 */
	private setTween(): void {
		const scaleOff = commonDefine.CAUTION_TIME_SCALE_OFF;
		const scaleOn = commonDefine.CAUTION_TIME_SCALE_ON;
		entityUtil.setScale(this.scaleLayer, scaleOff);

		const timeline: tl.Timeline = this.scene.game.vars.scenedata.timeline;
		gameUtil.createTween(timeline, this.scaleLayer).
			to(
				{ scaleX: scaleOn, scaleY: scaleOn },
				gameUtil.frame2MSec(commonDefine.CAUTION_TIME_ON)).
			to(
				{ scaleX: scaleOff, scaleY: scaleOff },
				gameUtil.frame2MSec(commonDefine.CAUTION_TIME_OFF)).
			call((): void => {
				if (this.isBlinking_) {
					this.setTween();
				}
			});
	}
}
