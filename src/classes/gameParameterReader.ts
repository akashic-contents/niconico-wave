import { CommonParameterReader } from "../commonNicowariGame/commonParameterReader";
import { DifficultyParametersJson, DifficultyParameter } from "./difficultyParameters";
import { GameParameters } from "./gameParameters";
import { MiscAssetInfo } from "./miscAssetInfo";

/**
 * ゲーム固有パラメータの読み込みクラス
 * 省略されたパラメータ項目の補完などを行う
 */
export class GameParameterReader {

	/** GameParameters.startPixel に相当する値 */
	static startPixel: number;

	/**
	 * 起動パラメータから対応するメンバ変数を設定する
	 * @param {g.Scene} _scene Sceneインスタンス
	 */
	static read(_scene: g.Scene): void {

		this.startPixel = 0;

		if (!CommonParameterReader.nicowari) {
			if (CommonParameterReader.useDifficulty) {
				// 難易度指定によるパラメータを設定
				this.loadFromJson(_scene);
			} else {
				const param: GameParameters = _scene.game.vars.parameters;
				if (typeof param.startPixel === "number") {
					this.startPixel = param.startPixel;
				}
			}
		}
	}

	/**
	 * JSONから難易度指定によるパラメータを設定
	 * @param {g.Scene} _scene Sceneインスタンス
	 */
	private static loadFromJson(_scene: g.Scene): void {
		const difficultyJson: DifficultyParametersJson
			= _scene.asset.getJSONContentById(MiscAssetInfo.difficultyData.name);
		const difficultyList: DifficultyParameter[]
			= difficultyJson.difficultyParameterList;
		if (difficultyList.length === 0) {
			return;
		}
		let index = 0;
		for (let i = difficultyList.length - 1; i >= 0; --i) {
			if (difficultyList[i].minimumDifficulty
				<= CommonParameterReader.difficulty) {
				index = i;
				// console.log("minimumDifficulty[" + i + "]:" + difficultyList[i].minimumDifficulty + ".");
				break;
			}
		}
		if (typeof difficultyList[index].startPixel === "number") {
			this.startPixel = difficultyList[index].startPixel;
		}
	}
}
