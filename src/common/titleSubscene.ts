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
		title.onUpdate.add(spriteUtil.makeActorUpdater(title));
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
			this.scene.setTimeout(this.handleTimeout, commonDefine.TITLE_WAIT, this);
			if (commonDefine.TOUCH_SKIP_WAIT > 0) {
				this.scene.setTimeout(this.handleTimeoutToTouch, commonDefine.TOUCH_SKIP_WAIT, this);
			}
		} else {
			this.asaTitle.ended.add(this.handleTitleEnd, this);
		}
	}

	/**
	 * Scene#updateを起点とする処理から呼ばれる
	 * @override
	 */
	handleUpdate(): void {
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
		this.scene.onPointDownCapture.removeAll({owner: this});
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
	private handleTimeout(): void {
		// console.log("TitleSubscene.onTimeout: inContent:"+this.inContent+".");
		if (this.inContent) {
			this.requestedNextSubscene.fire();
		}
	}

	/**
	 * Scene#setTimeoutのハンドラ
	 * タッチ受付を開始する
	 */
	private handleTimeoutToTouch(): void {
		// console.log("TitleSubscene.onTimeoutToTouch: inContent:"+this.inContent+".");
		if (this.inContent) {
			this.scene.onPointDownCapture.add(this.handleTouch, this);
		}
	}

	/**
	 * Actor#endedのハンドラ
	 * タイトルロゴアニメの終了時用
	 * @return {boolean} trueを返し、ハンドラ登録を解除する
	 */
	private handleTitleEnd(): boolean {
		if (this.inContent) {
			this.scene.onPointDownCapture.add(this.handleTouch, this);
		}
		return true;
	}

	/**
	 * Scene#onPointDownCaptureのハンドラ
	 * 次のシーンへの遷移を要求する
	 * @param {g.PointDownEvent} e イベントパラメータ
	 * @return {boolean} trueを返し、ハンドラ登録を解除する
	 */
	private handleTouch(_e: g.PointDownEvent): boolean {
		// console.log("TitleSubscene.onTouch: inContent:"+this.inContent+".");
		if (this.inContent) {
			this.requestedNextSubscene.fire();
		}
		return true;
	}
}
