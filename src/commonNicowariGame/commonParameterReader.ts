import { RireGameParameters } from "./rireGameParameters";

/**
 * 起動方法
 * @export
 * @enum {number}
 */
export enum LaunchType {
	/** 未指定 */
	NOTHING,
	/** 放送者プレイ */
	SELF,
	/** 抽選されたユーザーがプレイ */
	LOTTERY,
	/** みんなでプレイ */
	RANKING
}

/** 特定のシーンを判定する文字列 */
const INITIAL_SCENE_STRING: string = "game";
/** 起動方法の放送者プレイを判定する文字列 */
const LAUNCH_TYPE_SELF_STRING: string = "self";
/** 起動方法の抽選されたユーザーがプレイを判定する文字列 */
const LAUNCH_TYPE_LOTTERY_STRING: string = "lottery";
/** 起動方法のみんなでプレイを判定する文字列 */
const LAUNCH_TYPE_RANKING_STRING: string = "ranking";
/** ゲームシーン以外のシーンで消費する時間 */
const TIME_EXPECT_GAME_SCENE = 32;

/**
 * 共通パラメータの読み込みクラス
 * 省略されたパラメータ項目の補完などを行う
 */
export class CommonParameterReader {
	/** RireGameParameters.initialScene に相当する値 */
	static initialScene: string;
	/** trueの場合は initialScene の値を使用するフラグ */
	static isInitialSceneGame: boolean;
	/** RireGameParameters.muteAudio に相当する値 */
	static muteAudio: boolean;
	/** RireGameParameters.nicowari に相当する値 */
	static nicowari: boolean;
	/** trueの場合は gameTimeLimit の値を使用するフラグ */
	static useGameTimeLimit: boolean;
	/** ゲームの制限時間(RireGameParameters.totalTimeLimitからTIME_EXPECT_GAME_SCENEを引いた値) */
	static gameTimeLimit: number;
	/** trueの場合は difficulty の値を使用するフラグ */
	static useDifficulty: boolean;
	/** RireGameParameters.difficulty に相当する値 */
	static difficulty: number;
	/** ユーザー間での乱数固定用の乱数生成器 */
	static randomGenerator: g.XorshiftRandomGenerator;
	/**
	 * RireGameParameters.launchType に相当する値
	 * パラメータそのものではなくLaunchType型を使わせる
	 */
	static launchType: LaunchType;

	/**
	 * 起動パラメータから対応するメンバ変数を設定する
	 * @param {RireGameParameters} parameters 起動パラメータ
	 */
	static read(parameters: RireGameParameters): void {
		this.initialScene = "";
		this.isInitialSceneGame = false;
		this.muteAudio = false;
		this.nicowari = false;
		this.useGameTimeLimit = false;
		this.gameTimeLimit = 0;
		this.useDifficulty = false;
		this.difficulty = 1;
		this.launchType = LaunchType.NOTHING;

		if (typeof parameters.nicowari === "boolean") {
			this.nicowari = parameters.nicowari;
		}
		// console.log("read: nicowari:" + this.nicowari + ".");
		if (this.nicowari) {
			return;
		}

		if (typeof parameters.initialScene === "string") {
			this.initialScene = parameters.initialScene;
		}
		if (this.initialScene === INITIAL_SCENE_STRING) {
			this.isInitialSceneGame = true;
		}
		// console.log("read: initialScene:" + this.initialScene + ", isInitialSceneGame:" + this.isInitialSceneGame + ".");
		if (typeof parameters.muteAudio === "boolean") {
			this.muteAudio = parameters.muteAudio;
		}
		// console.log("read: muteAudio:" + this.muteAudio + ".");
		if (typeof parameters.totalTimeLimit === "number") {
			this.useGameTimeLimit = true;
			this.gameTimeLimit = Math.max(0, <number>parameters.totalTimeLimit - TIME_EXPECT_GAME_SCENE);
		}
		// console.log("read: useGameTimeLimit:" + this.useGameTimeLimit + ", gameTimeLimit:" + this.gameTimeLimit + ".");
		// console.log("read: useGameTimeMax:" + this.useGameTimeMax + ".");
		if (typeof parameters.difficulty === "number") {
			this.useDifficulty = true;
			if (parameters.difficulty < 1) {
				this.difficulty = 1;
			} else if (parameters.difficulty > 10) {
				this.difficulty = 10;
			} else {
				this.difficulty = parameters.difficulty;
			}
		}
		// console.log("read: useDifficulty:" + this.useDifficulty + ", difficulty:" + this.difficulty + ".");
		if (typeof parameters.randomSeed === "number") {
			this.randomGenerator = new g.XorshiftRandomGenerator(parameters.randomSeed);
		}
		if (typeof parameters.launchType === "string") {
			if (parameters.launchType === LAUNCH_TYPE_SELF_STRING) {
				this.launchType = LaunchType.SELF;
			} else if (parameters.launchType === LAUNCH_TYPE_LOTTERY_STRING) {
				this.launchType = LaunchType.LOTTERY;
			} else if (parameters.launchType === LAUNCH_TYPE_RANKING_STRING) {
				this.launchType = LaunchType.RANKING;
			}
		}
	}
}
