import { define } from "./define";
import { AsaInfo } from "./asaInfo";
import { entityUtil } from "../util/entityUtil";
import { gameUtil } from "../util/gameUtil";
import { asaEx } from "../util/asaEx";

/** PC状態 */
export enum PcState {
	/** 通常 */
	NORMAL,
	/** ダメージ */
	DAMAGE,
	/** 復帰 */
	RETURN
}

/** 波状態 */
export enum WaveState {
	/** 上昇 */
	UP,
	/** 下降 */
	DOWN,
	/** 底 */
	FLOOR
}

/**
 * PC/波/水面を表示、管理するクラス
 */
export class WaveManager extends g.E {
	/** PC状態 */
	private pcState: PcState;
	/** PC状態がダメージから復帰に変わったタイミングでtrueになるフラグ */
	private isStartedPcReturn_: boolean;
	/** ミスからの復帰後の無敵時間カウンター */
	private runupFrames: number;

	/** 波状態 */
	private waveState: WaveState;
	/** 上昇時間カウンター */
	private upCount: number;

	/** PCのアニメ */
	private actorPC: asaEx.Actor;
	/** PCのアタッチメント */
	private attachmentPC: asaEx.ActorAttachment;
	/** 波のアニメ */
	private actorWave: asaEx.Actor;
	/** 水面のアニメ */
	private actorPlane: asaEx.Actor;

	/**
	 * コンストラクタ
	 * @param  {g.Scene} _scene Sceneインスタンス
	 */
	constructor(_scene: g.Scene) {
		super({ scene: _scene });
	}

	/**
	 * このクラスで使用するオブジェクトを生成するメソッド
	 */
	init(): void {
		this.touchable = false;
		this.pcState = PcState.NORMAL;
		this.isStartedPcReturn_ = false;
		this.runupFrames = 0;
		this.waveState = WaveState.FLOOR;
		this.upCount = 0;

		const actorPC = this.actorPC =
			new asaEx.Actor(
				this.scene, AsaInfo.surfing.pj, AsaInfo.surfing.anim.pcNormal);
		if (define.DEBUG_SHOW_COLLISION_RECT) {
			const rectCollision = new g.FilledRect({
				scene: this.scene,
				cssColor: define.DEBUG_COLLISION_RECT_COLOR,
				width: define.COLLISION_PC.width,
				height: define.COLLISION_PC.height
			});
			rectCollision.x = define.COLLISION_PC.x;
			rectCollision.y = define.COLLISION_PC.y;
			rectCollision.opacity = define.DEBUG_COLLISION_RECT_OPACITY;
			entityUtil.appendEntity(rectCollision, actorPC);
		}
		const attachmentPC = this.attachmentPC =
			new asaEx.ActorAttachment(actorPC);
		attachmentPC.cancelParentSR = true;
		const actorWave = this.actorWave =
			new asaEx.Actor(
				this.scene, AsaInfo.surfing.pj,
				AsaInfo.surfing.anim.waveLowerMost);
		actorWave.x = define.SURFING_X;
		actorWave.y = define.SURFING_Y;
		actorWave.attach(attachmentPC, define.PC_PIVOT_NAME);
		entityUtil.appendEntity(actorWave, this);
		const actorPlane = this.actorPlane =
			new asaEx.Actor(
				this.scene, AsaInfo.surfing.pj, AsaInfo.surfing.anim.waveFlat);
		actorPlane.x = define.SURFING_X;
		actorPlane.y = define.SURFING_Y;
		entityUtil.appendEntity(actorPlane, this);
	}

	/**
	 * 初期表示を行うメソッド
	 */
	showContent(): void {
		this.touchable = false;
		this.pcState = PcState.NORMAL;
		this.isStartedPcReturn_ = false;
		this.runupFrames = 0;
		this.waveState = WaveState.FLOOR;
		this.upCount = 0;

		this.actorPC.play(AsaInfo.surfing.anim.pcNormal, 0, true, 1);
		this.actorWave.play(AsaInfo.surfing.anim.waveLowerMost, 0, true, 1);
		this.actorPlane.play(AsaInfo.surfing.anim.waveFlat, 0, true, 1);
	}

	/**
	 * ゲーム開始時の処理を行うメソッド
	 */
	startGame(): void {
		this.touchable = true;
	}

	/**
	 * タッチ可能状態かどうかを返すメソッド
	 * @return {boolean} タッチ可能ならばtrue
	 */
	isTouchable(): boolean {
		return this.touchable;
	}

	/**
	 * PC状態がダメージから復帰に変わったフレームのみtrueを返すメソッド
	 * onUpdateの後から次のonUpdate呼び出しまでが一つの判定区間
	 * @return {boolean} 復帰に変わったフレームならばtrue
	 */
	isStartedPcReturn(): boolean {
		return this.isStartedPcReturn_;
	}

	/**
	 * 復帰後の無敵時間かどうかを返す返すメソッド
	 * @return {boolean} 復帰後の無敵時間中ならばtrue
	 */
	isRunup(): boolean {
		return (this.runupFrames > 0);
	}

	/**
	 * PCの座標を取得するメソッド
	 * @return {g.CommonOffset} thisの親を基準としたPCの座標
	 */
	getPcPosition(): g.CommonOffset {
		const actorWave = this.actorWave;
		const pos = actorWave.getBonePosition(define.PC_PIVOT_NAME);
		pos.x += actorWave.x + gameUtil.getMatrixDx(this.attachmentPC.matrix)
			+ this.x;
		pos.y += actorWave.y;
		return pos;
	}

	/**
	 * 波の高さに対応したスクロール加速割合を取得するメソッド
	 * @return {number} スクロール加速割合（0～1）
	 */
	getScrollFactor(): number {
		const framePosition = this.getUpFramePosition();
		const asaResource = asaEx.ResourceManager.getResource(
			this.scene, AsaInfo.surfing.pj);
		const downFrames = asaResource.getAnimationByName(
			AsaInfo.surfing.anim.waveSL).frameCount;
		const middle = (downFrames - 1) * 0.5;
		const diff = Math.abs(framePosition - middle);
		const factor = (middle - diff) / middle;
		return (factor < 0) ? 0 : (factor > 1) ? 1 : factor;
	}

	/**
	 * フレームごとの処理を行うメソッド
	 */
	onUpdateFrame(): void {
		if (this.pcState === PcState.NORMAL) {
			this.updateInNormal();
		} else {
			this.updateInMiss();
		}
	}

	/**
	 * タッチした結果を処理するメソッド
	 */
	onTouch(): void {
		if (this.waveState !== WaveState.UP) {
			this.changeWaveState(WaveState.UP);
		}
		this.upCount = define.UP_FRAMES_PER_TOUCH;
	}

	/**
	 * ミス時の処理を行うメソッド
	 */
	onMiss(): void {
		this.touchable = false;
		this.actorPC.play(AsaInfo.surfing.anim.pcDamage, 0, false, 1);
		this.pcState = PcState.DAMAGE;
	}

	/**
	 * 通常時のフレームごとの処理を行うメソッド
	 */
	private updateInNormal(): void {
		if (this.runupFrames > 0) {
			--this.runupFrames;
			if (this.runupFrames <= 0) {
				this.actorPC.play(
					AsaInfo.surfing.anim.pcNormal, 0, true, 1);
			}
		}

		if (this.waveState === WaveState.UP) {
			--this.upCount;
			if ((this.upCount === 0) || (this.actorWave.currentFrame ===
				(this.actorWave.animation.frameCount - 1))) {
				this.upCount = 0;
				this.changeWaveState(WaveState.DOWN);
			}
		} else if (this.waveState === WaveState.DOWN) {
			if (this.actorWave.currentFrame ===
				(this.actorWave.animation.frameCount - 1)) {
				this.changeWaveState(WaveState.FLOOR);
			}
		}

		this.actorPC.modified();
		this.actorPC.calc();
		this.actorWave.modified();
		this.actorWave.calc();
		this.actorPlane.modified();
		this.actorPlane.calc();

		gameUtil.setMatrixDx(
			this.attachmentPC.matrix,
			define.PC_OVERHANG_MAX * this.getScrollFactor());
	}

	/**
	 * ミス演出中のフレームごとの処理を行うメソッド
	 */
	private updateInMiss(): void {
		this.isStartedPcReturn_ = false;

		if (this.actorPC.currentFrame ===
			(this.actorPC.animation.frameCount - 1)) {
			if (this.pcState === PcState.DAMAGE) {
				// 復帰に移行する
				if (this.waveState !== WaveState.FLOOR) {
					this.actorWave.play(
						AsaInfo.surfing.anim.waveLowerMost, 0, true, 1);
					this.waveState = WaveState.FLOOR;
					gameUtil.setMatrixDx(this.attachmentPC.matrix, 0);
				}
				this.actorPC.play(AsaInfo.surfing.anim.pcReturn, 0, false, 1);
				this.pcState = PcState.RETURN;
				this.isStartedPcReturn_ = true;
			} else {
				// 通常（復帰後の無敵状態）に移行する
				this.actorPC.play(AsaInfo.surfing.anim.pcRunup, 0, true, 1);
				this.pcState = PcState.NORMAL;
				this.runupFrames = define.RUNUP_FRAMES;
				this.upCount = 0;
				this.touchable = true;
			}
		} else {
			this.actorPC.modified();
			this.actorPC.calc();
		}
		// actorPCのアタッチ先のmodifiedを呼ばないと再描画されない
		this.actorWave.modified();
	}

	/**
	 * 波の状態を切り替える
	 * @param {WaveState} _newState 切り替え後の状態
	 */
	private changeWaveState(_newState: WaveState): void {
		// 現在の状態とアニメ位置から上昇アニメでの位置を求める
		const framePosition = this.getUpFramePosition();
		// 上昇アニメでの位置に応じて切り替え後のアニメ位置を設定する
		const asaResource = asaEx.ResourceManager.getResource(
			this.scene, AsaInfo.surfing.pj);
		const downFrames = asaResource.getAnimationByName(
			AsaInfo.surfing.anim.waveLS).frameCount;
		switch (_newState) {
			case WaveState.UP:
				this.actorWave.play(
					AsaInfo.surfing.anim.waveSL, framePosition, false,
					define.PLAYSPEED_UP, true);
				break;
			case WaveState.DOWN:
				this.actorWave.play(
					AsaInfo.surfing.anim.waveLS,
					(downFrames - 1) - framePosition, false,
					define.PLAYSPEED_DOWN, true);
				break;
			case WaveState.FLOOR:
				this.actorWave.play(
					AsaInfo.surfing.anim.waveLowerMost, 0, true, 1, true);
				break;
		}

		this.waveState = _newState;
	}

	/**
	 * 上昇アニメでの位置を求めるメソッド
	 * @return {number} 上昇アニメでの位置
	 */
	private getUpFramePosition(): number {
		let framePosition = 0;
		switch (this.waveState) {
			case WaveState.UP:
				framePosition = this.actorWave.currentFrame;
				break;
			case WaveState.DOWN:
				framePosition = (this.actorWave.animation.frameCount - 1) -
					this.actorWave.currentFrame;
				break;
			case WaveState.FLOOR:
				framePosition = 0;
				break;
		}
		return framePosition;
	}
}
