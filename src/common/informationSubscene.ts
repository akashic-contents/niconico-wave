import { Subscene } from "../commonNicowariGame/subscene";
import { CommonAsaInfo } from "./commonAsaInfo";
import { asaEx } from "../util/asaEx";
import { spriteUtil } from "../util/spriteUtil";
import { entityUtil } from "../util/entityUtil";
import { commonDefine } from "./commonDefine";
import { CommonParameterReader, LaunchType } from "../commonNicowariGame/commonParameterReader";

/**
 * 視聴者へのゲーム開始情報表示サブシーンの処理と表示を行うクラス
 */
export class InformationSubscene extends Subscene {
	/**
	 * 次のサブシーンへの遷移を要求するトリガー
	 * @type {g.Trigger<void>}
	 */
	requestedNextSubscene: g.Trigger<void>;

	/** 一定時間経過でシーンを終了するフラグ */
	private autoNext: boolean;
	/** startContent～stopContentの間trueになるフラグ */
	private inContent: boolean;
	/** ゲーム開始情報アニメ */
	private asaInformation: asaEx.Actor;

	constructor(_scene: g.Scene) {
		super(_scene);
	}

	/**
	 * このクラスで使用するオブジェクトを生成する
	 * @override
	 */
	init(): void {
		this.autoNext = (commonDefine.INFORMATION_WAIT > 0);
		this.inContent = false;
		this.requestedNextSubscene = new g.Trigger<void>();

		const game = this.scene.game;
		const infoAnim = this.asaInformation = new asaEx.Actor(this.scene, CommonAsaInfo.nwInformation.pj);
		infoAnim.x = game.width / 2;
		infoAnim.y = game.height / 2;
		infoAnim.update.handle(spriteUtil.makeActorUpdater(infoAnim));
		infoAnim.hide();
		entityUtil.appendEntity(infoAnim, this);

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
		let anim = "";
		if (CommonParameterReader.launchType === LaunchType.SELF) {
			anim = CommonAsaInfo.nwInformation.anim.self;
		} else if (CommonParameterReader.launchType === LaunchType.LOTTERY) {
			anim = CommonAsaInfo.nwInformation.anim.lottery;
		} else if (CommonParameterReader.launchType === LaunchType.RANKING) {
			anim = CommonAsaInfo.nwInformation.anim.ranking;
		} else {
			return;
		}
		this.asaInformation.play(anim, 0, false, 1);
		entityUtil.showEntity(this.asaInformation);
		entityUtil.showEntity(this);
	}

	/**
	 * 動作を開始する
	 * このサブシーンに遷移するワイプ演出が完了した時点で呼ばれる
	 * @override
	 */
	startContent(): void {
		this.inContent = true;
		if (this.autoNext) {
			this.scene.setTimeout(commonDefine.INFORMATION_WAIT, this, this.onTimeout);
			if (commonDefine.TOUCH_SKIP_WAIT > 0) {
				this.scene.setTimeout(commonDefine.TOUCH_SKIP_WAIT, this, this.onTimeoutToTouch);
			}
		} else {
			this.scene.pointDownCapture.handle(this, this.onTouch);
		}
	}

	/**
	 * Scene#updateを起点とする処理から呼ばれる
	 * @override
	 */
	onUpdate(): void {
		// NOP
	}

	/**
	 * 動作を停止する
	 * このサブシーンから遷移するワイプ演出が始まる時点で呼ばれる
	 * @override
	 */
	stopContent(): void {
		this.inContent = false;
		this.scene.pointDownCapture.removeAll(this);
	}

	/**
	 * 表示を終了する
	 * このサブシーンから遷移するワイプ演出で表示が終わる時点で呼ばれる
	 * @override
	 */
	hideContent(): void {
		entityUtil.hideEntity(this);
		entityUtil.hideEntity(this.asaInformation);
	}

	/**
	 * Scene#setTimeoutのハンドラ
	 * 次のシーンへの遷移を要求する
	 */
	private onTimeout(): void {
		if (this.inContent) {
			this.requestedNextSubscene.fire();
		}
	}

	/**
	 * Scene#setTimeoutのハンドラ
	 * タッチ受付を開始する
	 */
	private onTimeoutToTouch(): void {
		if (this.inContent) {
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
		if (this.inContent) {
			this.requestedNextSubscene.fire();
		}
		return true;
	}
}
