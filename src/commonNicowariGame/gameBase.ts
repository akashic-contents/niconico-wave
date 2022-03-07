import { entityUtil } from "../util/entityUtil";

/**
 * ゲームの実体を実装するベースクラス
 */
export abstract class GameBase extends g.E {
	/** 残り時間警告表示の開始を通知するトリガー */
	timeCaution: g.Trigger<void>;
	/** 残り時間警告表示の中断を通知するトリガー */
	timeCautionCancel: g.Trigger<void>;
	/** タイムアップを通知するトリガー */
	timeup: g.Trigger<void>;
	/** タイムアウトを通知するトリガー */
	timeout: g.Trigger<void>;
	/** ゲームクリアを通知するトリガー */
	gameClear: g.Trigger<void>;
	/** ゲームオーバーを通知するトリガー */
	gameOver: g.Trigger<void>;

	constructor(_scene: g.Scene) {
		super({ scene: _scene });
	}

	/**
	 * このクラスで使用するオブジェクトを生成するメソッド
	 * Scene#loadedを起点とする処理からコンストラクタの直後に呼ばれる。
	 * このクラスはゲーム画面終了時も破棄されず、次のゲームで再利用される。
	 * そのためゲーム状態の初期化はinitではなくshowContentで行う必要がある。
	 */
	init(): void {
		this.timeCaution = new g.Trigger<void>();
		this.timeCautionCancel = new g.Trigger<void>();
		this.timeup = new g.Trigger<void>();
		this.timeout = new g.Trigger<void>();
		this.gameClear = new g.Trigger<void>();
		this.gameOver = new g.Trigger<void>();
		entityUtil.hideEntity(this);
	}

	/**
	 * 表示系以外のオブジェクトをdestroyするメソッド
	 * 表示系のオブジェクトはg.Eのdestroyに任せる。
	 * @override
	 */
	destroy(): void {
		if (this.destroyed()) {
			return;
		}
		if (this.timeCaution) {
			this.timeCaution.destroy();
			this.timeCaution = null;
		}
		if (this.timeCautionCancel) {
			this.timeCautionCancel.destroy();
			this.timeCautionCancel = null;
		}
		if (this.timeup) {
			this.timeup.destroy();
			this.timeup = null;
		}
		if (this.timeout) {
			this.timeout.destroy();
			this.timeout = null;
		}
		if (this.gameClear) {
			this.gameClear.destroy();
			this.gameClear = null;
		}
		if (this.gameOver) {
			this.gameOver.destroy();
			this.gameOver = null;
		}
		super.destroy();
	}

	/**
	 * タイトル画面のBGMのアセット名を返すメソッド
	 * 共通フロー側でBGMを鳴らさない場合は実装クラスでオーバーライドして
	 * 空文字列を返すようにする
	 * @return {string} アセット名
	 */
	getTitleBgmName(): string {
		return "";
	}

	/**
	 * ゲーム中のBGMのアセット名を返すメソッド
	 * 共通フロー側でBGMを鳴らさない場合は実装クラスでオーバーライドして
	 * 空文字列を返すようにする
	 * @return {string} アセット名
	 */
	getMainBgmName(): string {
		return "";
	}

	/**
	 * 表示を開始するメソッド
	 * ゲーム画面に遷移するワイプ演出で表示が始まる時点で呼ばれる。
	 */
	showContent(): void {
		entityUtil.showEntity(this);
	}

	/**
	 * ゲーム前ガイド表示を開始するメソッド
	 * ゲーム画面に遷移したあとReady～Startジングルの前に呼ばれ、
	 * ゲーム前ガイド表示を開始する。
	 * ゲーム前ガイド表示を行わない場合はfalseを返す。
	 * trueを返すとonUpdatePreGameGuideが呼ばれるようになる。
	 * @return {boolean} ゲーム前ガイド表示を行わない場合はfalse
	 */
	startPreGameGuide(): boolean {
		return false;
	}

	/**
	 * ゲーム開始前のReadyGoジングル表示を行うかどうかを返すメソッド
	 * ReadyGoジングル表示を行わない場合は実装クラスでこのメソッドを
	 * オーバーライドしてfalseを返す
	 * @return {boolean} ReadyGoジングル表示を行う場合はtrue
	 */
	needsReadyGoJingle(): boolean {
		return true;
	}

	/**
	 * ゲームを開始するメソッド
	 * Ready～Startジングルが完了した時点で呼ばれる。
	 */
	abstract startGame(): void;

	/**
	 * 表示を終了するメソッド
	 * このサブシーンから遷移するワイプ演出で表示が終わる時点で呼ばれる。
	 */
	hideContent(): void {
		entityUtil.hideEntity(this);
	}

	/**
	 * Scene#updateを起点とする処理から呼ばれるメソッド
	 * startPreGameGuideでtrueを返した場合に呼ばれ始め、
	 * この関数でtrueを返すと呼び出しが止まるとともに
	 * Ready～Startジングルが開始される。
	 * @return {boolean} ゲーム前ガイド表示を終了する場合はtrue
	 */
	onUpdatePreGameGuide(): boolean {
		return true;
	}

	/**
	 * Scene#updateを起点とする処理から呼ばれるメソッド
	 * ゲーム画面でない期間には呼ばれない。
	 */
	abstract onUpdateScene(): void;
}
