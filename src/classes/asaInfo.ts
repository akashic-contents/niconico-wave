/**
 * asapj関連の静的情報
 */
export class AsaInfo {
	// tslint:disable-next-line:typedef
	static surfing = {
		pj: "pj_surfing",
		anim: {
			waveFlat: "wave_flat",  // 海面
			waveSL: "wave_move_s_l",  // 波が高くなる
			waveLS: "wave_move_l_s",  // 波が低くなる
			waveLowerMost: "wave_lowermost",  // 波最下位置でとまる
			pcNormal: "pc_nomal",  // ＰＣ（波のり中）
			pcDamage: "pc_damage",  // ＰＣ（ダメージ→落下）
			pcReturn: "pc_return",  // ＰＣ（復帰）
			pcRunup: "pc_strongest"  // ＰＣ（復帰後の無敵状態）
		}
	};
	// tslint:disable-next-line:typedef
	static obstacle = {
		pj: "pj_obstacle",
		anim: {
			gull: "enemy_01_a",  // 障害物Ａ（カモメ）
			rock: "enemy_02_a",  // 障害物Ｂ（岩）
			shark: "enemy_03_a",  // 障害物Ｃ（サメ）
			pteranodon: "enemy_04_a"  // 障害物Ｄ（プテラノドン）
		}
	};
}
