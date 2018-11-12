/**
 * 具体的なシーンの処理と表示を行う抽象クラス
 */
export abstract class Subscene extends g.E {
	constructor(_scene: g.Scene) {
		super({ scene: _scene });
	}

	/**
	 * このクラスで使用するオブジェクトを生成する
	 */
	abstract init(): void;

	/**
	 * 表示を開始する
	 * このサブシーンに遷移するワイプ演出で表示が始まる時点で呼ばれる
	 */
	abstract showContent(): void;

	/**
	 * 動作を開始する
	 * このサブシーンに遷移するワイプ演出が完了した時点で呼ばれる
	 */
	abstract startContent(): void;

	/**
	 * Scene#updateを起点とする処理から呼ばれる
	 */
	abstract onUpdate(): void;

	/**
	 * 動作を停止する
	 * このサブシーンから遷移するワイプ演出が始まる時点で呼ばれる
	 */
	abstract stopContent(): void;

	/**
	 * 表示を終了する
	 * このサブシーンから遷移するワイプ演出で表示が終わる時点で呼ばれる
	 */
	abstract hideContent(): void;
}
