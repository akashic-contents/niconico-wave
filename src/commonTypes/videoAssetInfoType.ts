/** 動画アセット関連の静的情報の要素の型 */
export interface VideoAssetInfoType {
	/** アセット名 */
	name: string;
	/** URI */
	uri?: string;
	/** 横解像度 */
	width: number;
	/** 縦解像度 */
	height: number;
}
