import * as tl from "@akashic-extension/akashic-timeline";
import { commonDefine } from "./commonDefine";
import { entityUtil } from "../util/entityUtil";
import { gameUtil } from "../util/gameUtil";

/**
 * 残り時間警告の赤点滅演出を管理するクラス
 */
export class CautionFilledRect extends g.FilledRect {
	/** 点滅中フラグ */
	private isBlinking_: boolean;

	constructor(_scene: g.Scene) {
		super({
			scene: _scene,
			cssColor: commonDefine.CAUTION_FILLRECT_COLOR,
			width: _scene.game.width,
			height: _scene.game.height
		});
		this.hide();
	}

	/**
	 * 点滅状態を取得する
	 * @return {boolean} 点滅中ならばtrue
	 */
	isBlinking(): boolean {
		return this.isBlinking_;
	}

	/**
	 * 赤点滅演出を開始する
	 */
	startBlink(): void {
		this.isBlinking_ = true;
		this.setTween();
		entityUtil.showEntity(this);
	}

	/**
	 * 赤点滅演出を終了する
	 */
	stopBlink(): void {
		this.isBlinking_ = false;
		entityUtil.hideEntity(this);
		// stopBlinkのあと実行中のtweenが終了する前にstartBlinkされると
		// 正常に動かないが仕様上起きない前提とする。
	}

	/**
	 * 赤点滅一周期分のtweenを設定する
	 */
	private setTween(): void {
		this.opacity = commonDefine.CAUTION_FILLRECT_OPACITY_OFF;

		const timeline: tl.Timeline = this.scene.game.vars.scenedata.timeline;
		const fps: number = this.scene.game.fps;
		gameUtil.createTween(timeline, this).
			to(
				{ opacity: commonDefine.CAUTION_FILLRECT_OPACITY_ON },
				commonDefine.CAUTION_TIME_ON * 1000 / fps).
			to(
				{ opacity: commonDefine.CAUTION_FILLRECT_OPACITY_OFF },
				commonDefine.CAUTION_TIME_OFF * 1000 / fps).
			call((): void => {
				if (this.isBlinking_) {
					this.setTween();
				}
			});
	}
}
