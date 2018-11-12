import { define } from "./define";
import { AssetInfo } from "./assetInfo";
import { SoundInfo } from "./soundInfo";
import { entityUtil } from "../util/entityUtil";
import { spriteUtil } from "../util/spriteUtil";
import { gameUtil } from "../util/gameUtil";
import { audioUtil } from "../util/audioUtil";
import { TimerLabel } from "./timerLabel";
import { WaveManager } from "./waveManager";
import { ObstacleManager } from "./obstacleManager";
import { GameParameterReader } from "./gameParameterReader";
import { GameBase } from "../commonNicowariGame/gameBase";
import { CommonParameterReader } from "../commonNicowariGame/commonParameterReader";

/**
 * ニコニコウェーブゲームの実体を実装するクラス
 */
export class WaveGame extends GameBase {
	/** ゲーム中フラグ */
	private inGame: boolean;
	/** ミス演出中フラグ */
	private inMiss: boolean;
	/** タッチ継続中フラグ */
	private inHold: boolean;
	/** タッチ不能時間カウンタ */
	private touchCoolingFrames: number;

	/** スコア値 */
	private scoreValue: number;
	/** 残り時間表示ラベル */
	private timerLabel: TimerLabel;
	/** スコア表示ラベル */
	private scoreLabel: g.Label;

	/** スクロール/障害物表示・管理オブジェクト */
	private obstacleManager: ObstacleManager;
	/** PC/波/水面表示・管理オブジェクト */
	private waveManager: WaveManager;

	/**
	 * コンストラクタ
	 * @param  {g.Scene} _scene Sceneインスタンス
	 */
	constructor(_scene: g.Scene) {
		super(_scene);
	}

	/**
	 * このクラスで使用するオブジェクトを生成するメソッド
	 * Scene#loadedを起点とする処理からコンストラクタの直後に呼ばれる。
	 * このクラスはゲーム画面終了時も破棄されず、次のゲームで再利用される。
	 * そのためゲーム状態の初期化はinitではなくshowContentで行う必要がある。
	 * @override
	 */
	init(): void {
		super.init();

		const scene = this.scene;
		const spoUi = spriteUtil.createSpriteParameter(AssetInfo.ui);
		const sfmUi = spriteUtil.createSpriteFrameMap(AssetInfo.ui);

		GameParameterReader.read(scene);

		const landmarkLayer = new g.E({ scene: scene });
		const swimmerLayer = new g.E({ scene: scene });
		const fryerLayer = new g.E({ scene: scene });
		landmarkLayer.moveTo(define.OFFSET_X, 0);
		swimmerLayer.moveTo(define.OFFSET_X, 0);
		fryerLayer.moveTo(define.OFFSET_X, 0);

		entityUtil.appendEntity(landmarkLayer, this);
		entityUtil.appendEntity(swimmerLayer, this);

		const obstacleManager = this.obstacleManager =
			new ObstacleManager(scene);
		obstacleManager.moveTo(define.OFFSET_X, 0);
		obstacleManager.init(landmarkLayer, swimmerLayer, fryerLayer);
		entityUtil.appendEntity(obstacleManager, this);

		const waveManager = this.waveManager = new WaveManager(scene);
		waveManager.moveTo(define.OFFSET_X, 0);
		waveManager.init();
		entityUtil.appendEntity(waveManager, this);

		entityUtil.appendEntity(fryerLayer, this);

		const iconT = spriteUtil.createFrameSprite(
			spoUi, sfmUi,
			AssetInfo.ui.frames.iconT);
		iconT.moveTo(define.ICON_T_X, define.ICON_T_Y);
		entityUtil.appendEntity(iconT, this);

		const iconPt = spriteUtil.createFrameSprite(
			spoUi, sfmUi,
			AssetInfo.ui.frames.iconPt);
		iconPt.moveTo(define.ICON_PT_X, define.ICON_PT_Y);
		entityUtil.appendEntity(iconPt, this);

		const timer = this.timerLabel = new TimerLabel(this.scene);
		timer.createLabel(AssetInfo.numBlack, AssetInfo.numRed);
		timer.moveLabelTo(define.GAME_TIMER_X, define.GAME_TIMER_Y);
		entityUtil.appendEntity(timer, this);

		const fontBlack = gameUtil.createNumFontWithAssetInfo(
			AssetInfo.numBlack);

		const score = this.scoreLabel = entityUtil.createNumLabel(
			this.scene,
			fontBlack, define.GAME_SCORE_DIGIT);
		entityUtil.moveNumLabelTo(
			score, define.GAME_SCORE_X, define.GAME_SCORE_Y);
		entityUtil.appendEntity(score, this);
	}

	/**
	 * 表示系以外のオブジェクトをdestroyするメソッド
	 * 表示系のオブジェクトはg.Eのdestroyに任せる。
	 * @override
	 */
	destroy(): void {
		super.destroy();
	}

	/**
	 * タイトル画面のBGMのアセット名を返すメソッド
	 * 共通フロー側でBGMを鳴らさない場合は実装クラスでオーバーライドして
	 * 空文字列を返すようにする
	 * @return {string} アセット名
	 * @override
	 */
	getTitleBgmName(): string {
		return SoundInfo.bgmSet.title;
	}

	/**
	 * ゲーム中のBGMのアセット名を返すメソッド
	 * 共通フロー側でBGMを鳴らさない場合は実装クラスでオーバーライドして
	 * 空文字列を返すようにする
	 * @return {string} アセット名
	 * @override
	 */
	getMainBgmName(): string {
		return SoundInfo.bgmSet.main;
	}

	/**
	 * 表示を開始するメソッド
	 * ゲーム画面に遷移するワイプ演出で表示が始まる時点で呼ばれる。
	 * @override
	 */
	showContent(): void {
		this.inGame = false;
		this.inMiss = false;
		this.inHold = false;
		this.touchCoolingFrames = 0;

		this.obstacleManager.showContent();
		this.waveManager.showContent();
		this.scoreValue = 0;
		entityUtil.setLabelText(this.scoreLabel, String(this.scoreValue));

		let timeLimit = define.GAME_TIME;
		if (CommonParameterReader.useGameTimeLimit) {
			timeLimit = CommonParameterReader.gameTimeLimit;
			if (timeLimit > define.GAME_TIME_MAX) {
				timeLimit = define.GAME_TIME_MAX;
			}
		} else if (CommonParameterReader.useGameTimeMax) {
			timeLimit = define.GAME_TIME_MAX;
		}
		this.timerLabel.setTimeCount(timeLimit);

		this.timerLabel.timeCaution.handle(this, this.onTimeCaution);
		this.timerLabel.timeCautionCancel.handle(this, this.onTimeCautionCancel);
		super.showContent();
	}

	/**
	 * ゲームを開始するメソッド
	 * ReadyGo演出が完了した時点で呼ばれる。
	 * @override
	 */
	startGame(): void {
		this.inGame = true;
		this.obstacleManager.startScroll();
		this.waveManager.startGame();
		this.scene.pointDownCapture.handle(this, this.onTouch);
		if (define.DEBUG_HOLD_TO_UP) {
			this.scene.pointUpCapture.handle(this, this.onTouchOff);
		}
	}

	/**
	 * 表示を終了するメソッド
	 * このサブシーンから遷移するワイプ演出で表示が終わる時点で呼ばれる。
	 * @override
	 */
	hideContent(): void {
		this.obstacleManager.hideContent();
		this.timerLabel.timeCaution.removeAll(this);
		this.timerLabel.timeCautionCancel.removeAll(this);
		super.hideContent();
	}

	/**
	 * Scene#updateを起点とする処理から呼ばれるメソッド
	 * ゲーム画面でない期間には呼ばれない。
	 * @override
	 */
	onUpdate(): void {
		if (this.inGame) {
			if (!this.inMiss) {
				this.obstacleManager.onUpdate(
					this.waveManager.getScrollFactor());
				this.checkScrolledMeter();
			}

			this.timerLabel.tick();
			if (!this.inMiss) {
				if (this.timerLabel.getTimeCount() === 0) {
					this.finishGame();
				}
			}
		}

		if (this.inGame) {
			if (this.touchCoolingFrames > 0) {
				--this.touchCoolingFrames;
			}
			if (define.DEBUG_HOLD_TO_UP) {
				if (this.inHold && this.waveManager.isTouchable()) {
					this.waveManager.onTouch();
				}
			}

			this.waveManager.onUpdate();
			if (this.inMiss) {
				if (this.waveManager.isTouchable()) {
					// ミス処理終了時
					this.inMiss = false;
				} else if (this.waveManager.isStartedPcReturn()) {
					// PC復帰演出開始時
				}
			} else {
				this.checkCollision();  // PCと障害物のあたり判定
			}
		}
	}

	/**
	 * TimerLabel#timeCautionのハンドラ
	 */
	private onTimeCaution(): void {
		this.timeCaution.fire();
	}

	/**
	 * TimerLabel#timeCautionCancelのハンドラ
	 */
	private onTimeCautionCancel(): void {
		this.timeCautionCancel.fire();
	}

	/**
	 * 必要に応じてメートル数表示を更新するメソッド
	 */
	private checkScrolledMeter(): void {
		const scrolledMeter = this.obstacleManager.getScrolledMeter();
		if (this.scoreValue !== scrolledMeter) {
			this.scoreValue = scrolledMeter;
			if (this.scoreValue > define.SCORE_LIMIT) {
				this.scoreValue = define.SCORE_LIMIT;
			}
			gameUtil.updateGameStateScore(this.scoreValue);
			entityUtil.setLabelText(
				this.scoreLabel,
				String(this.scoreValue));
		}
	}

	/**
	 * PCと障害物のあたり判定を行うメソッド
	 */
	private checkCollision(): void {
		if (this.waveManager.isRunup()) {
			return;
		}

		const pos = this.waveManager.getPcPosition();
		const rect: g.CommonArea = {
			x: pos.x + define.COLLISION_PC.x,
			y: pos.y + define.COLLISION_PC.y,
			width: define.COLLISION_PC.width,
			height: define.COLLISION_PC.height
		};
		if (this.obstacleManager.checkCollision(rect)) {
			// ミス処理
			audioUtil.play(SoundInfo.seSet.miss);
			this.inMiss = true;
			this.waveManager.onMiss();
		}
	}

	/**
	 * ゲームを終了するメソッド
	 * gameUtil.setGameScoreしたスコアが結果画面で表示される。
	 * @param {boolean = false} opt_isLifeZero
	 * (optional)ライフ消滅によるゲーム終了の場合はtrue
	 */
	private finishGame(opt_isLifeZero: boolean = false): void {
		this.inGame = false;
		this.obstacleManager.stopScroll();
		this.scene.pointDownCapture.removeAll(this);
		if (define.DEBUG_HOLD_TO_UP) {
			this.scene.pointUpCapture.removeAll(this);
		}
		gameUtil.setGameScore(this.scoreValue);
		// 呼び出すトリガーによって共通フローのジングルアニメが変化する
		if (opt_isLifeZero) {
			this.gameOver.fire();
			this.timerLabel.forceStopBlink();
			audioUtil.play(SoundInfo.seSet.gameover);
		} else {
			this.timeup.fire();
		}
	}

	/**
	 * Scene#pointDownCaptureのハンドラ
	 * @param {g.PointDownEvent} _e イベントパラメータ
	 * @return {boolean} ゲーム終了時はtrueを返す
	 */
	private onTouch(_e: g.PointDownEvent): boolean {
		if (!this.inGame) {
			return true;
		}

		if (define.DEBUG_HOLD_TO_UP) {
			this.inHold = true;
		}
		if (this.inMiss || (this.touchCoolingFrames > 0)) {
			return false;
		}

		audioUtil.play(SoundInfo.seSet.tap);
		if (this.waveManager.isTouchable()) {
			this.waveManager.onTouch();
			this.touchCoolingFrames = define.TOUCH_COOLING_FRAMES;
		}
		return false;
	}

	/**
	 * Scene#pointUpCaptureのハンドラ
	 * @param {g.PointUpEvent} _e イベントパラメータ
	 * @return {boolean} ゲーム終了時はtrueを返す
	 */
	private onTouchOff(_e: g.PointUpEvent): boolean {
		if (!this.inGame) {
			return true;
		}

		if (define.DEBUG_HOLD_TO_UP) {
			this.inHold = false;
		}
		return false;
	}
}
