import {inject, Injectable} from '@angular/core';
import {
  catchError,
  combineLatest,
  distinctUntilChanged,
  fromEvent,
  map,
  merge,
  Observable,
  of,
  shareReplay,
  startWith,
  switchMap,
  timer,
} from "rxjs";
import {HttpClient} from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class ConnectionStatusService {

  private readonly http = inject(HttpClient);

  readonly isOnline$: Observable<boolean>;

  constructor() {
    const browserStatus$ = merge(
      fromEvent(window, 'online').pipe(map(() => true)),
      fromEvent(window, 'offline').pipe(map(() => false))
    ).pipe(startWith(navigator.onLine));

    const serverStatus$ = merge(
      timer(0, 30000),
      fromEvent(window, 'online')
    ).pipe(
      switchMap(() =>
        this.http.get('/actuator/health').pipe(
          map(() => true),
          catchError(() => of(false))
        )
      ),
      startWith(navigator.onLine)
    );

    this.isOnline$ = combineLatest([browserStatus$, serverStatus$]).pipe(
      map(([browser, server]) => browser && server),
      distinctUntilChanged(),
      shareReplay({ bufferSize: 1, refCount: true })
    );
  }

  get isOnline() {
    return this.isOnline$;
  }
}
