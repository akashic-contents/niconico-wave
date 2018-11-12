import { AssetInfoType } from "../commonTypes/assetInfoType";

/**
 * 共通演出用画像アセット関連の静的情報
 */
export class CommonAssetInfo {
	// tslint:disable-next-line:typedef
	static numResult = {
		img: "img_num_result",
		json: "json_num_result",
		frames: {
			cross: "num_result_0011.png",
			plus: "num_result_0012.png",
			minus: "num_result_0013.png"
		},
		numFrames: [
			"num_result_0001.png",
			"num_result_0002.png",
			"num_result_0003.png",
			"num_result_0004.png",
			"num_result_0005.png",
			"num_result_0006.png",
			"num_result_0007.png",
			"num_result_0008.png",
			"num_result_0009.png",
			"num_result_0010.png"
		],
		fontWidth: 70,
		fontHeight: 81
	};
	/** リザルトでのtips画像01 */
	static tipsImg01: AssetInfoType = { img: "result_chara_img_01" };
	/** リザルトでのtips画像02 */
	static tipsImg02: AssetInfoType = { img: "result_chara_img_02" };
	/** リザルトでのtips画像03 */
	static tipsImg03: AssetInfoType = { img: "result_chara_img_03" };
}
