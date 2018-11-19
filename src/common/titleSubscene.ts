import { Subscene } from "../commonNicowariGame/subscene";
import { CommonAsaInfo } from "./commonAsaInfo";
import { asaEx } from "../util/asaEx";
import { spriteUtil } from "../util/spriteUtil";
import { entityUtil } from "../util/entityUtil";
import { audioUtil } from "../util/audioUtil";
import { commonDefine } from "./commonDefine";

/**
 * タイトルサブシーンの処理と表示を行うクラス
 */
export class TitleSubscene extends Subscene {
	/**
	 * 次のサブシーンへの遷移を要求するトリガー
	 * @type {g.Trigger<void>}
	 */
	requestedNextSubscene: g.Trigger<void>;

	/** 一定時間経過でシーンを終了するフラグ */
	private autoNext: boolean;
	/** startContent～stopContentの間trueになるフラグ */
	private inContent: boolean;
	/** タイトルロゴアニメ */
	private asaTitle: asaEx.Actor;

	/** タイトル画面のBGMのアセット名（空文字列の場合はBGMなし） */
	private bgmName: string;

	constructor(_scene: g.Scene) {
		super(_scene);
	}

	/**
	 * このクラスで使用するオブジェクトを生成する
	 * @override
	 */
	init(): void {
		this.autoNext = (commonDefine.TITLE_WAIT > 0);
		this.inContent = false;
		this.bgmName = "";
		this.requestedNextSubscene = new g.Trigger<void>();

		const game = this.scene.game;
		const title = this.asaTitle =
			new asaEx.Actor(this.scene, CommonAsaInfo.nwTitle.pj);
		title.x = game.width / 2;
		title.y = game.height / 2;
		title.update.handle(spriteUtil.makeActorUpdater(title));
		title.hide();
		entityUtil.appendEntity(title, this);

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
	 * タイトル画面のBGMのアセット名を設定するメソッド
	 * @param {string} _bgmName タイトル画面のBGMのアセット名
	 */
	setBgmName(_bgmName: string): void {
		this.bgmName = _bgmName;
	}

	/**
	 * 表示を開始する
	 * このサブシーンに遷移するワイプ演出で表示が始まる時点で呼ばれる
	 * @override
	 */
	showContent(): void {
		audioUtil.play(this.bgmName);
		entityUtil.showEntity(this);
	}

	/**
	 * 動作を開始する
	 * このサブシーンに遷移するワイプ演出が完了した時点で呼ばれる
	 * @override
	 */
	startContent(): void {
		this.inContent = true;
		this.asaTitle.play(CommonAsaInfo.nwTitle.anim.title, 0, false, 1);
		entityUtil.showEntity(this.asaTitle);
		if (this.autoNext) {
			this.scene.setTimeout(
				commonDefine.TITLE_WAIT, this, this.onTimeout);
			if (commonDefine.TOUCH_SKIP_WAIT > 0) {
				this.scene.setTimeout(
					commonDefine.TOUCH_SKIP_WAIT, this,
					this.onTimeoutToTouch);
			}
		} else {
			this.asaTitle.ended.handle(this, this.onTitleEnd);
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
		// console.log("TitleSubscene.stopContent: inContent:"+this.inContent+".");
		this.inContent = false;
		this.scene.pointDownCapture.removeAll(this);
	}

	/**
	 * 表示を終了する
	 * このサブシーンから遷移するワイプ演出で表示が終わる時点で呼ばれる
	 * @override
	 */
	hideContent(): void {
		audioUtil.stop(this.bgmName);
		entityUtil.hideEntity(this);
		entityUtil.hideEntity(this.asaTitle);
	}

	/**
	 * Scene#setTimeoutのハンドラ
	 * 次のシーンへの遷移を要求する
	 */
	private onTimeout(): void {
		// console.log("TitleSubscene.onTimeout: inContent:"+this.inContent+".");
		if (this.inContent) {
			this.requestedNextSubscene.fire();
		}
	}

	/**
	 * Scene#setTimeoutのハンドラ
	 * タッチ受付を開始する
	 */
	private onTimeoutToTouch(): void {
		// console.log("TitleSubscene.onTimeoutToTouch: inContent:"+this.inContent+".");
		if (this.inContent) {
			this.scene.pointDownCapture.handle(this, this.onTouch);
		}
	}

	/**
	 * Actor#endedのハンドラ
	 * タイトルロゴアニメの終了時用
	 * @return {boolean} trueを返し、ハンドラ登録を解除する
	 */
	private onTitleEnd(): boolean {
		if (this.inContent) {
			this.scene.pointDownCapture.handle(this, this.onTouch);
		}
		return true;
	}

	/**
	 * Scene#pointDownCaptureのハンドラ
	 * 次のシーンへの遷移を要求する
	 * @param {g.PointDownEvent} e イベントパラメータ
	 * @return {boolean} trueを返し、ハンドラ登録を解除する
	 */
	private onTouch(_e: g.PointDownEvent): boolean {
		// console.log("TitleSubscene.onTouch: inContent:"+this.inContent+".");
		if (this.inContent) {
			this.requestedNextSubscene.fire();
		}
		return true;
	}
}
