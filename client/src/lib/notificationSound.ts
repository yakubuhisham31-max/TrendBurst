export class NotificationSound {
  private audioContext: AudioContext | null = null;
  private unlocked = false;
  private enabled = true;

  constructor() {
    this.loadEnabledState();
    this.init();
  }

  private loadEnabledState() {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('notification-sound-enabled');
      this.enabled = stored === null ? true : stored === 'true';
    }
  }

  private init() {
    if (typeof window === 'undefined') return;

    const unlock = () => {
      if (!this.audioContext) {
        this.audioContext = new AudioContext();
      }
      
      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume().then(() => {
          this.unlocked = true;
        });
      } else {
        this.unlocked = true;
      }
    };

    ['click', 'touchstart', 'keydown'].forEach(event => {
      document.addEventListener(event, unlock, { once: true });
    });
  }

  private playBeep(frequency = 880, duration = 200, volume = 0.3) {
    if (!this.audioContext || !this.unlocked || !this.enabled) {
      return;
    }

    try {
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      gainNode.gain.value = 0;
      gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(volume, this.audioContext.currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration / 1000);

      oscillator.frequency.value = frequency;
      oscillator.type = 'sine';

      oscillator.start(this.audioContext.currentTime);
      oscillator.stop(this.audioContext.currentTime + duration / 1000);
    } catch (error) {
      console.warn('Failed to play notification sound:', error);
    }
  }

  play() {
    this.playBeep(880, 150, 0.2);
    setTimeout(() => {
      this.playBeep(1046.5, 150, 0.15);
    }, 100);
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
    if (typeof window !== 'undefined') {
      localStorage.setItem('notification-sound-enabled', enabled.toString());
    }
  }

  isEnabled(): boolean {
    if (typeof window === 'undefined') return true;
    const stored = localStorage.getItem('notification-sound-enabled');
    return stored === null ? true : stored === 'true';
  }
}

export const notificationSound = new NotificationSound();
