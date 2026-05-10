import {inject, Injectable} from '@angular/core';
import {firstValueFrom, fromEvent, map, merge, Observable, of, shareReplay, startWith} from "rxjs";
import {getProducts} from '../api/generated-api/fn/product-controller/get-products';
import {HttpClient} from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class ConnectionStatusService {

  private isOnline$: Observable<boolean> = new Observable<boolean>();
  private browserStatus$: Observable<boolean> = of(true);
  private serverStatus$: Observable<boolean>;

  private http = inject(HttpClient);

  constructor() {
    const online$ = fromEvent(window, 'online').pipe(map((_) => true));
    const offline$ = fromEvent(window, 'offline').pipe(map((_) => false));
    const clientIsOnline$ = merge(online$, offline$).pipe(
      shareReplay(),
      startWith(navigator.onLine)
    );

    // TODO polling every 10s for serverstatus
    firstValueFrom(getProducts(this.http, '/api/products'))
      .then(res => console.log(res.status));


    clientIsOnline$.subscribe(val => console.log(val));

    // this.isOnline$ = combineLatest(this.browserStatus$, this.serverStatus$).pipe(
    //   map(([browser, server]) => browser && server),
    //   distinctUntilChanged()
    // );
  }

  get isOnline() {
    return this.isOnline$;
  }
}
