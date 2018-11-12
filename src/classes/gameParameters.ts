import { RireGameParameters } from "../commonNicowariGame/rireGameParameters";

/**
 * ニコニコウェーブのパラメータ
 */
export interface GameParameters extends RireGameParameters {
	/** マップの開始位置 */
	startPixel?: number;
}
