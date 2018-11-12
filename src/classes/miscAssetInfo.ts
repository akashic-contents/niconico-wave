/**
 * 画像以外のアセット関連の静的情報
 */
export class MiscAssetInfo {
	// tslint:disable-next-line:typedef
	static mapData = {
		name: "json_map01",
		/** tiledデータのオブジェクト種別名 */
		objectType: {
			/** tiledデータのオブジェクト種別名：カモメ */
			gull: "enemy_01",
			/** tiledデータのオブジェクト種別名：岩 */
			rock: "enemy_02",
			/** tiledデータのオブジェクト種別名：サメ */
			shark: "enemy_03",
			/** tiledデータのオブジェクト種別名：プテラノドン */
			pteranodon: "enemy_04"
		}
	};
	// tslint:disable-next-line:typedef
	static difficultyData = {
		name: "json_difficultyParameters"
	};
}
