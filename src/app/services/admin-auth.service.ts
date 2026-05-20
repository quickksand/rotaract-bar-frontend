import {Injectable, signal} from '@angular/core';
import {environment} from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AdminAuthService {
  private readonly unlocked = signal(false);

  isUnlocked(): boolean {
    return this.unlocked();
  }

  unlock(pin: string): boolean {
    if (pin === environment.adminPin) {
      this.unlocked.set(true);
      return true;
    }
    return false;
  }

  lock(): void {
    this.unlocked.set(false);
  }
}
