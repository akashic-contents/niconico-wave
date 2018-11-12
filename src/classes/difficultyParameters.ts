
/**
 * ニコニコウェーブの難易度設定データの型
 */
export interface DifficultyParameter {
	/** このパラメータが適用される難易度の最小値 */
	minimumDifficulty: number;
	/** マップの開始位置 */
	startPixel: number;
}

/**
 * ニコニコウェーブの難易度設定データJSONの型
 */
export interface DifficultyParametersJson {
	/**
	 * 難易度設定データの配列
	 * minimumDifficultyが小さいものから並べる
	 */
	difficultyParameterList: DifficultyParameter[];
}
