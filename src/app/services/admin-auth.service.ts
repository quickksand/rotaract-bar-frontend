import {inject, Injectable} from '@angular/core';
import {catchError, map, Observable, of} from 'rxjs';
import {AuthControllerService} from '../api/generated-api/services';

const TOKEN_KEY = 'admin_token';

@Injectable({providedIn: 'root'})
export class AdminAuthService {
  private readonly authApi = inject(AuthControllerService);

  /**
   * Sends PIN to backend. On success stores JWT in sessionStorage.
   * Returns Observable<true> on success, Observable<false> on wrong PIN.
   */
  unlock(pin: string): Observable<boolean> {
    return this.authApi.login({body: {pin}}).pipe(
      map(response => {
        sessionStorage.setItem(TOKEN_KEY, response.token);
        return true;
      }),
      catchError(() => of(false)),
    );
  }

  /**
   * UX-only check: token present and not expired.
   * The backend remains the real authority.
   */
  isUnlocked(): boolean {
    const token = this.getToken();
    if (!token) return false;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp > Date.now() / 1000;
    } catch {
      return false;
    }
  }

  getToken(): string | null {
    return sessionStorage.getItem(TOKEN_KEY);
  }

  logout(): void {
    sessionStorage.removeItem(TOKEN_KEY);
  }
}
