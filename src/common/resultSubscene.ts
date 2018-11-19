import { CommonAsaInfo } from "./commonAsaInfo";
import { CommonAssetInfo } from "./commonAssetInfo";
import { CommonSoundInfo } from "./commonSoundInfo";
import { commonDefine } from "./commonDefine";
import { asaEx } from "../util/asaEx";
import { spriteUtil } from "../util/spriteUtil";
import { entityUtil } from "../util/entityUtil";
import { gameUtil } from "../util/gameUtil";
import { audioUtil } from "../util/audioUtil";
import { AssetInfoType } from "../commonTypes/assetInfoType";
import { Subscene } from "../commonNicowariGame/subscene";

/**
 * リザルトサブシーンの処理と表示を行うクラス
 */
export class ResultSubscene extends Subscene {
	/** 次のサブシーンへの遷移を要求するトリガー */
	requestedNextSubscene: g.Trigger<void>;

	/** リザルト表示アニメ */
	private asaResult: asaEx.Actor;
	/** 点数 */
	private scoreValue: number;
	/** 点数ラベル */
	private scoreLabel: g.Label;
	/** ロール演出中はtrueになるフラグ */
	private isRolling: boolean;
	/** tipsを表示しない場合のリザルトオブジェクトのY座標補正値 */
	private offsetY: number;
	/** tips画像リスト */
	private tipsImgList: string[] = [];

	constructor(_scene: g.Scene) {
		super(_scene);
	}

	/**
	 * このクラスで使用するオブジェクトを生成する
	 * @override
	 */
	init(): void {
		this.requestedNextSubscene = new g.Trigger<void>();

		const game = this.scene.game;

		if (commonDefine.SHOW_TIPS) {
			this.offsetY = 0;
			this.initTipsImgList();
		} else {
			this.offsetY = commonDefine.RESULT_OBJECTS_OFFSET_Y;
		}

		const result = this.asaResult =
			new asaEx.Actor(this.scene, CommonAsaInfo.nwCommon.pj);
		result.x = game.width / 2;
		result.y = (game.height / 2) + this.offsetY;
		result.update.handle(spriteUtil.makeActorUpdater(result));
		result.hide();
		entityUtil.appendEntity(result, this);

		this.scoreValue = 0;

		const font = gameUtil.createNumFontWithAssetInfo(
			CommonAssetInfo.numResult, this.scene.assets);
		const score = this.scoreLabel = entityUtil.createNumLabel(
			this.scene, font, commonDefine.RESULT_SCORE_DIGIT);
		entityUtil.moveNumLabelTo(score, 320 + ((game.width - 480) / 2), 84 + this.offsetY);
		score.hide();
		entityUtil.appendEntity(score, this);
		this.isRolling = false;

		entityUtil.hideEntity(this);
	}

	/**
	 * 表示系以外のオブジェクトをdestroyする
	 * 表示系のオブジェクトはg.Eのdestroyに任せる
	 * @override
	 */
	destroy(): void {
		if (this.destroyed()) {
			return;
		}
		if (this.requestedNextSubscene) {
			this.requestedNextSubscene.destroy();
			this.requestedNextSubscene = null;
		}
		super.destroy();
	}

	/**
	 * 表示を開始する
	 * このサブシーンに遷移するワイプ演出で表示が始まる時点で呼ばれる
	 * @override
	 */
	showContent(): void {
		this.scoreValue = gameUtil.getGameScore();
		this.scoreLabel.hide();
		entityUtil.showEntity(this);
	}

	/**
	 * 動作を開始する
	 * このサブシーンに遷移するワイプ演出が完了した時点で呼ばれる
	 * @override
	 */
	startContent(): void {
		this.asaResult.play(CommonAsaInfo.nwCommon.anim.result, 0, false, 1);
		this.createTips();
		audioUtil.play(CommonSoundInfo.seSet.rollResult);
		this.isRolling = true;
		this.setScoreLabelText();
		entityUtil.showEntity(this.scoreLabel);
		entityUtil.showEntity(this.asaResult);
		this.scene.setTimeout(
			commonDefine.RESULT_ROLL_WAIT, this, this.onRollEnd);
	}

	/**
	 * Scene#updateを起点とする処理から呼ばれる
	 * @override
	 */
	onUpdate(): void {
		if (this.isRolling) {
			this.setScoreLabelText();
		}
	}

	/**
	 * 動作を停止する
	 * このサブシーンから遷移するワイプ演出が始まる時点で呼ばれる
	 * @override
	 */
	stopContent(): void {
		// NOP
	}

	/**
	 * 表示を終了する
	 * このサブシーンから遷移するワイプ演出で表示が終わる時点で呼ばれる
	 * @override
	 */
	hideContent(): void {
		entityUtil.hideEntity(this);
		entityUtil.hideEntity(this.asaResult);
	}

	/**
	 * スコアラベルを設定する
	 */
	private setScoreLabelText(): void {
		let value = this.scoreValue;
		const len = String(value).length;
		if (this.isRolling) { // 回転中はスコア桁内でランダム
			value = this.scene.game.random[0].get(
				Math.pow(10, len - 1),
				Math.pow(10, len) - 1);
		}
		entityUtil.setLabelText(this.scoreLabel, String(value));
	}

	/**
	 * Scene#setTimeoutのハンドラ
	 * ロール演出の終了時用
	 */
	private onRollEnd(): void {
		audioUtil.stop(CommonSoundInfo.seSet.rollResult);
		audioUtil.play(CommonSoundInfo.seSet.rollResultFinish);
		this.isRolling = false;
		this.setScoreLabelText();
		if (commonDefine.ENABLE_RETRY) {
			// リトライ操作を受け付ける場合
			this.scene.pointDownCapture.handle(this, this.onTouch);
		}
	}

	/**
	 * Scene#pointDownCaptureのハンドラ
	 * 次のシーンへの遷移を要求する
	 * @param {g.PointDownEvent} _e イベントパラメータ
	 * @return {boolean} trueを返し、ハンドラ登録を解除する
	 */
	private onTouch(_e: g.PointDownEvent): boolean {
		this.requestedNextSubscene.fire();
		return true;
	}

	/**
	 * tips画像を作成する
	 */
	private createTips(): void {
		if (this.tipsImgList.length === 0) return;
		const randIndex = gameUtil.getRandomLessThanMax(this.tipsImgList.length);
		const asset = this.tipsImgList[randIndex];
		const size = commonDefine.TIPS_IMG_SIZE;
		const spr = new g.Sprite(
			{ scene: this.scene, src: this.scene.assets[asset], width: size.width, height: size.height });
		spr.moveTo(commonDefine.TIPS_IMG_POS);
		entityUtil.appendEntity(spr, this);
	}

	/**
	 * CommonAssetInfoからtips画像アセットをリスト化する
	 */
	private initTipsImgList(): void {
		this.tipsImgList = [];
		const wk: Object = CommonAssetInfo;
		Object.keys(wk).filter((e) => {
			return (e.indexOf(commonDefine.TIPS_VAR_NAME_HEAD) === 0); // commonDefine.TIPS_VAR_NAME_HEADで始まるオブジェクト
		}).forEach((val: string) => {
			const info = (<{ [key: string]: AssetInfoType }>wk)[val];
			// console.log(info.img);
			this.tipsImgList.push(info.img);
		});
	}
}
