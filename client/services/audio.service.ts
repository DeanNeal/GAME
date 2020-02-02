import GlobalService from "./global.service";
import { IAudio } from "../interfaces/interfaces";

class AudioService {
  public collection = {};

  constructor() {
    this.collection["menuMusic"] = this.createSound("fine.mp3", 0, true);
    this.collection["menuSelect"] = this.createSound("menu.mp3", 0.2);
    this.collection["damage"] = this.createSound("damage.mp3", 0.3);
    this.collection["rune"] = this.createSound("rune.mp3", 0.3);
    this.collection["blaster"] = this.createSound("blaster-1.mp3", 0.1);
    this.collection["explosion"] = this.createSound("explosion.mp3", 0.1);
  }

  createSound(name: string, volume: number, isMusic = false): IAudio {
    var audio = new Audio("sounds/" + name);
    audio.currentTime = 0;
    audio.volume = volume;

    return {audio, isMusic};
  }

  playAudio(name: string, volume?: number, start?: boolean, smooth?: boolean): void {
    const a = this.collection[name];
    if(!a.isMusic && GlobalService.soundsEnabled.getValue() === false) return;
    if(a.isMusic && GlobalService.musicEnabled.getValue() === false) return;

    if (volume !== null && volume !== undefined) {
      if (smooth) {
        adjustVolume(a.audio, volume);
      } else {
        a.audio.volume = volume;
      }
    }
    if (start) {
      a.audio.currentTime = 0;
    }
    a.audio.play();
  }
  stopAudio(name: string, smooth?: boolean): void {
    const a = this.collection[name];
    if (smooth) {
      adjustVolume(a.audio, 0);
    } else {
      a.audio.volume = 0;
    }
  }
}

export async function adjustVolume(
  element: HTMLMediaElement,
  newVolume: number,
  {
    duration = 1000,
    easing = swing,
    interval = 13
  }: {
    duration?: number;
    easing?: typeof swing;
    interval?: number;
  } = {}
) {
  const originalVolume = element.volume;
  const delta = newVolume - originalVolume;
  if (!delta || !duration || !easing || !interval) {
    element.volume = newVolume;
    return Promise.resolve();
  }
  const ticks = Math.floor(duration / interval);
  let tick = 1;
  return new Promise<void>(resolve => {
    const timer = setInterval(() => {
      element.volume = originalVolume + easing(tick / ticks) * delta;
      if (++tick === ticks) {
        clearInterval(timer);
        resolve();
      }
    }, interval);
  });
}

function swing(p: number) {
  return 0.5 - Math.cos(p * Math.PI) / 2;
}

export default new AudioService();
