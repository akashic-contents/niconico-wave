import { SoundInfoType } from "../commonTypes/soundInfoType";

/** 再生中の音声管理情報 */
interface PlayingAudioInfo {
	/** 音声アセット */
	audioAsset: g.AudioAsset;
	/** 音声アセットが最後に再生開始した時間 */
	lastPlayStartTime: number;
}

/**
 * 音声関連のユーティリティ関数群
 */
export namespace audioUtil {
	/** 再生中の音声管理情報リスト */
	const playingAudioInfoList: PlayingAudioInfo[] = [];
	/** ミュートフラグ */
	let muted: boolean = false;

	/**
	 * SoundInfoTypeのマップからアセット名を配列に追加する
	 * @param _map      SoundInfoTypeのマップ
	 * @param _assetIds アセット名配列
	 */
	export function addAssetIdsFromSoundInfoMap(
		_map: Object, _assetIds: string[]): void {
		const checkServer: boolean = g.game.vars.hasOwnProperty("isServer");
		const isServer: boolean = checkServer ? g.game.vars.isServer : false;
		const isServerStr = isServer ? "true" : "false";
		Object.keys(_map).forEach((i: string) => {
			const info = <{ [key: string]: string }>(<{ [key: string]: SoundInfoType }>_map)[i];
			if (checkServer
				&& info.hasOwnProperty("isServer")
				&& (isServerStr !== info["isServer"])
			) {
				return;
			}
			Object.keys(info).forEach((j: string) => {
				if (j === "isServer") return;
				const assetId = (<{ [key: string]: string }>info)[j];
				if (!assetId) return;
				_assetIds[_assetIds.length] = assetId;
			});
		});
	}

	/**
	 * ミュートフラグを設定するメソッド
	 * @param _mute 設定する値
	 */
	export function setMute(_mute: boolean): void {
		muted = _mute;
	}
	/**
	 * ミュート状態を取得するメソッド
	 * @return ミュート中ならtrue
	 */
	export function isMuted(): boolean {
		return muted;
	}

	/**
	 * 指定した音声アセットの g.AudioAsset#inUse を呼ぶ
	 * @param _soundId   対象の音声アセット名
	 * @return           inUseの戻り値
	 */
	export function inUse(_soundId: string): boolean {
		if (!_soundId) {
			return false;
		}
		const asset: g.AudioAsset = g.game.scene().asset.getAudioById(_soundId);
		if (!asset) {
			console.error("AudioUtil.inUse: not found " + _soundId + " in assets.");
			return false;
		}
		return asset.inUse();
	}

	/**
	 * 指定した音声アセットの g.AudioAsset#play を呼ぶ
	 * @param _soundId   対象の音声アセット名
	 * @return            playの戻り値
	 */
	export function play(_soundId: string): g.AudioPlayer {
		if (muted) {
			return null;
		}
		if (!_soundId) {
			return null;
		}
		const asset: g.AudioAsset = g.game.scene().asset.getAudioById(_soundId);
		if (!asset) {
			console.error("AudioUtil.play: not found " + _soundId + " in assets.");
			return null;
		}
		const info = getPlayingAudioInfo(asset);
		if (info === null) {
			playingAudioInfoList.push({ audioAsset: asset, lastPlayStartTime: g.game.getCurrentTime() });
		} else {
			info.lastPlayStartTime = g.game.getCurrentTime();
		}
		return asset.play();
	}
	/**
	 * 指定した音声アセットの g.AudioAsset#stop を呼ぶ
	 * @param _soundId   対象の音声アセット名
	 */
	export function stop(_soundId: string): void {
		if (!_soundId) {
			return;
		}
		const asset: g.AudioAsset = g.game.scene().asset.getAudioById(_soundId);
		if (!asset) {
			console.error("AudioUtil.stop: not found " + _soundId + " in assets.");
			return;
		}
		const info = getPlayingAudioInfo(asset);
		if (info !== null) {
			info.lastPlayStartTime = g.game.getCurrentTime() - getDuration(_soundId) - 1; // 終了している時間に調整
		}
		asset.stop();
	}
	/**
	 * 指定した音声アセットの 再生時間を取得するメソッド
	 * @param _soundId   対象の音声アセット名
	 * @return           再生時間
	 */
	export function getDuration(_soundId: string): number {
		if (!_soundId) {
			return 0;
		}
		const asset: g.AudioAsset = g.game.scene().asset.getAudioById(_soundId);
		if (!asset) {
			console.error("AudioUtil.getDuration: not found " + _soundId + " in assets.");
			return 0;
		}
		return asset.duration;
	}

	/**
	 * 音声アセットが再生中かどうか判定する
	 * SEのようなループさせない音声に対しての使用を想定しており、
	 * BGMのようなループする音声に対する使用は非推奨
	 * @param _soundId   対象の音声アセット名
	 * @return           再生中ならtrue
	 */
	export function isPlaying(_soundId: string): boolean {
		if (!_soundId) {
			return false;
		}
		const asset: g.AudioAsset = g.game.scene().asset.getAudioById(_soundId);
		if (!asset) {
			console.error("AudioUtil.isPlaying: not found " + _soundId + " in assets.");
			return false;
		}
		const info = getPlayingAudioInfo(asset);
		if (info === null) {
			return false;
		} else {
			return (getDuration(_soundId) > (g.game.getCurrentTime() - info.lastPlayStartTime));
		}
	}

	/**
	 * 再生中の音声管理情報を取得
	 * @param  _asset 対象の音声アセット
	 * @return        リストにない場合はnullを返す
	 */
	function getPlayingAudioInfo(_asset: g.AudioAsset): PlayingAudioInfo {
		const list =
			playingAudioInfoList.filter((v) => { return v.audioAsset === _asset; });
		if (list.length > 0) {
			return list[0];
		}
		return null;
	}
}
