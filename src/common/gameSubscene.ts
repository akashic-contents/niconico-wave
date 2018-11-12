import { Subscene } from "../commonNicowariGame/subscene";
import { CommonAsaInfo } from "./commonAsaInfo";
import { CommonSoundInfo } from "./commonSoundInfo";
import { commonDefine } from "./commonDefine";
import { asaEx } from "../util/asaEx";
import { spriteUtil } from "../util/spriteUtil";
import { entityUtil } from "../util/entityUtil";
import { audioUtil } from "../util/audioUtil";
import { GameBase } from "../commonNicowariGame/gameBase";
import { CautionFilledRect } from "./cautionFilledRect";
import { GameCreator } from "../classes/gameCreator";

/**
 * ゲームサブシーンの処理と表示を行うクラス
 */
export class GameSubscene extends Subscene {
	/**
	 * 次のサブシーンへの遷移を要求するトリガー
	 * @type {g.Trigger<void>}
	 */
	requestedNextSubscene: g.Trigger<void>;

	/** ゲーム内容 */
	private gameContent: GameBase;
	/** ゲーム前ガイド表示を行っている間trueになるフラグ */
	private inPreGameGuide: boolean;
	/** Ready-Go/Timeupアニメ */
	private asaJingle: asaEx.Actor;
	/** 残り時間警告演出用 */
	private cautionFill: CautionFilledRect;

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

		const cautionFill = this.cautionFill = new CautionFilledRect(this.scene);
		entityUtil.appendEntity(cautionFill, this);

		this.inPreGameGuide = false;
		const content = this.gameContent = GameCreator.createGame(this.scene);
		content.init();
		entityUtil.appendEntity(content, this);

		const jingle = this.asaJingle =
			new asaEx.Actor(this.scene, CommonAsaInfo.nwCommon.pj);
		jingle.x = game.width / 2;
		jingle.y = game.height / 2;
		jingle.update.handle(spriteUtil.makeActorUpdater(jingle));
		jingle.hide();
		entityUtil.appendEntity(jingle, this);

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
	 * タイトル画面のBGMのアセット名を返すメソッド
	 * @return {string} アセット名
	 */
	getTitleBgmName(): string {
		return this.gameContent.getTitleBgmName();
	}

	/**
	 * 表示を開始する
	 * このサブシーンに遷移するワイプ演出で表示が始まる時点で呼ばれる
	 * @override
	 */
	showContent(): void {
		this.gameContent.showContent();
		entityUtil.showEntity(this.gameContent);
		entityUtil.showEntity(this);
	}

	/**
	 * 動作を開始する
	 * このサブシーンに遷移するワイプ演出が完了した時点で呼ばれる
	 * @override
	 */
	startContent(): void {
		this.inPreGameGuide = this.gameContent.startPreGameGuide();
		if (!this.inPreGameGuide) {
			this.startReady();
		}
	}

	/**
	 * Scene#updateを起点とする処理から呼ばれる
	 * @override
	 */
	onUpdate(): void {
		if (this.inPreGameGuide) {
			if (this.gameContent.onUpdatePreGameGuide()) {
				this.inPreGameGuide = false;
				this.startReady();
			}
		}
		this.gameContent.onUpdate();
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
		entityUtil.hideEntity(this.asaJingle);
		entityUtil.hideEntity(this.gameContent);
		this.gameContent.hideContent();
	}

	/**
	 * ReadyGoジングルを開始する
	 */
	private startReady(): void {
		if (this.gameContent.needsReadyGoJingle()) {
			this.asaJingle.play(CommonAsaInfo.nwCommon.anim.readyGo, 0, false, 1);
			this.asaJingle.ended.handle(this, this.onReadyEnd);
			entityUtil.showEntity(this.asaJingle);
			audioUtil.play(CommonSoundInfo.seSet.ready);
		} else {
			this.startGame();
		}
	}

	/**
	 * Actor#endedのハンドラ
	 * ReadyGoアニメの終了時用
	 * @return {boolean} trueを返し、ハンドラ登録を解除する
	 */
	private onReadyEnd(): boolean {
		entityUtil.hideEntity(this.asaJingle);
		this.startGame();
		return true;
	}

	/**
	 * ゲームを開始する
	 */
	private startGame(): void {
		audioUtil.play(this.gameContent.getMainBgmName());
		this.gameContent.timeCaution.handle(this, this.onTimeCaution);
		this.gameContent.timeCautionCancel.handle(
			this, this.onTimeCautionCancel);
		this.gameContent.timeup.handle(this, this.onTimeup);
		this.gameContent.timeout.handle(this, this.onTimeout);
		this.gameContent.gameClear.handle(this, this.onGameClear);
		this.gameContent.gameOver.handle(this, this.onGameOver);
		this.gameContent.startGame();
	}

	/**
	 * GaemBase#timeCautionのハンドラ
	 * 残り時間警告の赤点滅を開始する
	 */
	private onTimeCaution(): void {
		this.cautionFill.startBlink();
	}

	/**
	 * GaemBase#timeCautionCancelのハンドラ
	 * 残り時間警告の赤点滅を中断する
	 */
	private onTimeCautionCancel(): void {
		this.cautionFill.stopBlink();
	}

	/**
	 * GaemBase#timeupのハンドラ
	 * タイムアップ演出を開始する
	 * @return {boolean} trueを返し、ハンドラ登録を解除する
	 */
	private onTimeup(): boolean {
		this.finishGame(CommonAsaInfo.nwCommon.anim.timeup);
		return true;
	}

	/**
	 * GaemBase#timeoutのハンドラ
	 * タイムアウト演出を開始する
	 * @return {boolean} trueを返し、ハンドラ登録を解除する
	 */
	private onTimeout(): boolean {
		this.finishGame(CommonAsaInfo.nwCommon.anim.timeout);
		return true;
	}

	/**
	 * GaemBase#gameClearのハンドラ
	 * ゲームクリア演出を開始する
	 * @return {boolean} trueを返し、ハンドラ登録を解除する
	 */
	private onGameClear(): boolean {
		this.finishGame(CommonAsaInfo.nwCommon.anim.gameClear);
		return true;
	}

	/**
	 * GaemBase#gameOverのハンドラ
	 * ゲームオーバー演出を開始する
	 * @return {boolean} trueを返し、ハンドラ登録を解除する
	 */
	private onGameOver(): boolean {
		this.finishGame(CommonAsaInfo.nwCommon.anim.gameOver);
		return true;
	}

	/**
	 * タイムアップ/タイムアウト/ゲームクリア/ゲームオーバー時の処理を行う
	 * @param {string} _jingleAnimName ジングルアニメ名
	 */
	private finishGame(_jingleAnimName: string): void {
		audioUtil.stop(this.gameContent.getMainBgmName());
		this.cautionFill.stopBlink();
		this.gameContent.timeCaution.removeAll(this);
		this.gameContent.timeCautionCancel.removeAll(this);
		this.gameContent.timeup.removeAll(this);
		this.gameContent.timeout.removeAll(this);
		this.gameContent.gameClear.removeAll(this);
		this.gameContent.gameOver.removeAll(this);
		this.asaJingle.play(_jingleAnimName, 0, false, 1, true);
		entityUtil.showEntity(this.asaJingle);
		audioUtil.play(CommonSoundInfo.seSet.timeup);
		this.scene.setTimeout(
			commonDefine.TIMEUP_WAIT, this, this.onTimeupEnd);
	}

	/**
	 * Scene#setTimeoutのハンドラ
	 * Timeup演出の終了時用
	 * 次のシーンへの遷移を要求する
	 */
	private onTimeupEnd(): void {
		this.requestedNextSubscene.fire();
	}
}
