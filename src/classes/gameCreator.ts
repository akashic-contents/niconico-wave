import { GameBase } from "../commonNicowariGame/gameBase";
import { WaveGame } from "./waveGame";

/**
 * GameBaseの実装クラスのインスタンス生成を行うだけのクラス
 * GameSubsceneに対して実装クラスの名前を隠ぺいする
 */
export class GameCreator {
	/**
	 * GameBaseの実装クラスのインスタンスを生成する
	 * @param {g.Scene}  _scene インスタンス生成に使用するScene
	 * @return {GameBase} 生成されたインスタンス
	 */
	static createGame(_scene: g.Scene): GameBase {
		return new WaveGame(_scene);
	}
}
