import {Injectable} from '@angular/core';
import {
  catchError,
  combineLatest,
  distinctUntilChanged,
  filter,
  fromEvent,
  map,
  merge,
  Observable,
  of,
  shareReplay,
  startWith,
  switchMap,
  timer,
  withLatestFrom
} from "rxjs";
import {HttpClient} from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class ConnectionStatusService {

  private isOnline$: Observable<boolean> = new Observable<boolean>();

  constructor(private http: HttpClient) {
    const online$ = fromEvent(window, 'online').pipe(map((_) => true));
    const offline$ = fromEvent(window, 'offline').pipe(map((_) => false));
    const browserStatus$ = merge(online$, offline$).pipe(
      startWith(navigator.onLine)
    );


    const serverStatus$ = timer(0, 10000).pipe(
      withLatestFrom(browserStatus$),
      filter(([timer, status]) => status === true),
      switchMap(() => this.http.get('/api/products').pipe(
        map(() => true),
        catchError(() => of(false)))
      )
    );

    /* Warning Edge Case: An extensive wait
      If Server is offline (false) and then Browser
      => serverStatus emits nothing
      => Browser back online => browserStatus true
      => combineLatest(true, false)
      => wait an extra 10s for new serverStatus emit
    */
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
