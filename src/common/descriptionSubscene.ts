import { Subscene } from "../commonNicowariGame/subscene";
import { CommonAsaInfo } from "./commonAsaInfo";
import { asaEx } from "../util/asaEx";
import { spriteUtil } from "../util/spriteUtil";
import { entityUtil } from "../util/entityUtil";
import { commonDefine } from "./commonDefine";

/**
 * 説明文言サブシーンの処理と表示を行うクラス
 */
export class DescriptionSubscene extends Subscene {
	/**
	 * 次のサブシーンへの遷移を要求するトリガー
	 * @type {g.Trigger<void>}
	 */
	requestedNextSubscene: g.Trigger<void>;

	/** 一定時間経過でシーンを終了するフラグ */
	private autoNext: boolean;
	/** startContent～stopContentの間trueになるフラグ */
	private inContent: boolean;
	/** 説明文言アニメ */
	private asaDescription: asaEx.Actor;

	constructor(_scene: g.Scene) {
		super(_scene);
	}

	/**
	 * このクラスで使用するオブジェクトを生成する
	 * @override
	 */
	init(): void {
		this.autoNext = (commonDefine.DESCRIPTION_WAIT > 0);
		this.inContent = false;
		this.requestedNextSubscene = new g.Trigger<void>();

		const game = this.scene.game;
		const desc = this.asaDescription =
			new asaEx.Actor(this.scene, CommonAsaInfo.nwTitle.pj);
		desc.x = game.width / 2;
		desc.y = game.height / 2;
		desc.update.handle(spriteUtil.makeActorUpdater(desc));
		desc.hide();
		entityUtil.appendEntity(desc, this);

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
		this.asaDescription.play(
			CommonAsaInfo.nwTitle.anim.description, 0, false, 1);
		entityUtil.showEntity(this.asaDescription);
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
			this.scene.setTimeout(
				commonDefine.DESCRIPTION_WAIT, this, this.onTimeout);
			if (commonDefine.TOUCH_SKIP_WAIT > 0) {
				this.scene.setTimeout(
					commonDefine.TOUCH_SKIP_WAIT, this,
					this.onTimeoutToTouch);
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
		// console.log("DescriptionSubscene.stopContent: inContent:"+this.inContent+".");
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
		entityUtil.hideEntity(this.asaDescription);
	}

	/**
	 * Scene#setTimeoutのハンドラ
	 * 次のシーンへの遷移を要求する
	 */
	private onTimeout(): void {
		// console.log("DescriptionSubscene.onTimeout: inContent:"+this.inContent+".");
		if (this.inContent) {
			this.requestedNextSubscene.fire();
		}
	}

	/**
	 * Scene#setTimeoutのハンドラ
	 * タッチ受付を開始する
	 */
	private onTimeoutToTouch(): void {
		// console.log("DescriptionSubscene.onTimeoutToTouch: inContent:"+this.inContent+".");
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
		// console.log("DescriptionSubscene.onTouch: inContent:"+this.inContent+".");
		if (this.inContent) {
			this.requestedNextSubscene.fire();
		}
		return true;
	}
}
