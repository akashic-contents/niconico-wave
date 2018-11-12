/** スプライトシートのフレーム矩形の型 */
export interface RectData {
	x: number;
	y: number;
	w: number;
	h: number;
}
/** スプライトシートのフレーム情報の型 */
export interface SpriteFrame {
	/** フレームの矩形情報 */
	frame: RectData;
}
/** スプライトシートのフレーム情報マップの型 */
export interface SpriteFrameMap {
	/** フレーム情報のマップ */
	frames: { [key: string]: SpriteFrame };
}
