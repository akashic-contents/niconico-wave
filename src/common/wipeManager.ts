import * as tl from "@akashic-extension/akashic-timeline";
import asa = require("@akashic-extension/akashic-animation");
import { gameUtil } from "../util/gameUtil";
import { entityUtil } from "../util/entityUtil";
import { CommonAsaInfo } from "./commonAsaInfo";
import { asaEx } from "../util/asaEx";

/**
 * ワイプ演出を管理するクラス
 */
export class WipeManager extends g.E {
	/** ワイプアニメ */
	private fadeAsa: asa.Actor;

	constructor(_scene: g.Scene) {
		super({ scene: _scene });
		this.fadeAsa = new asaEx.Actor(_scene, CommonAsaInfo.nwCommon.pj);
		this.fadeAsa.x = _scene.game.width / 2;
		this.fadeAsa.y = _scene.game.height / 2;
		this.fadeAsa.pause = true;
		this.append(this.fadeAsa);
		entityUtil.hideEntity(this.fadeAsa);
	}

	/**
	 * @override g.E#destroy
	 */
	destroy(): void {
		if (this.destroyed()) {
			return;
		}

		if (!!this.fadeAsa) {
			this.fadeAsa.destroy();
			this.fadeAsa = null;
		}
		super.destroy();
	}

	/**
	 * ワイプ演出を開始する
	 * @param {boolean} _isRtoL trueならばRtoL、falseならばLtoRのアニメを使用する
	 * @param {() => void} _funcMid 全画面が黒になった時点で呼ばれる関数
	 * @param {() => void} _funcFinal ワイプ演出が終了した時点で呼ばれる関数
	 */
	startWipe(
		_isRtoL: boolean, _funcMid: () => void,
		_funcFinal: () => void): void {
		const animName: string = _isRtoL ?
			CommonAsaInfo.nwCommon.anim.fadeRtoL :
			CommonAsaInfo.nwCommon.anim.fadeLtoR;
		this.fadeAsa.play(animName, 0, false, 1.0);
		this.fadeAsa.pause = false;
		entityUtil.showEntity(this.fadeAsa);

		// ワイプアニメの黒幕移動部分のフレーム数
		const wipeFrames: number = 6;
		// 黒幕で完全に画面が隠れるまでのフレーム数
		const inFrames: number = (wipeFrames / 2) | 0;
		const outFrames: number = wipeFrames - inFrames;
		const timeline: tl.Timeline = this.scene.game.vars.scenedata.timeline;
		gameUtil.createTween(timeline, this.fadeAsa).
			every(
				() => {
					this.fadeAsa.modified();
					this.fadeAsa.calc();
				},
				gameUtil.frame2MSec(inFrames)).
			call((): void => {
				if (_funcMid) {
					_funcMid();
				}
			}).
			every(
				() => {
					this.fadeAsa.modified();
					this.fadeAsa.calc();
				},
				gameUtil.frame2MSec(outFrames)).
			call((): void => {
				this.fadeAsa.pause = true;
				entityUtil.hideEntity(this.fadeAsa);

				if (_funcFinal) {
					_funcFinal();
				}
			});
	}
}
