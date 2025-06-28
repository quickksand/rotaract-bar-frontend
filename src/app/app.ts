import {Component, OnInit} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {AsyncPipe} from '@angular/common';

@Component({
  selector: 'app-root',
  imports: [
    AsyncPipe
  ],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  protected title = 'rotaract-bar-frontend';
  protected hello$ = new Observable<String>();

  constructor(private http: HttpClient) {
  }

  ngOnInit(){
    this.hello$ = this.http.get('/api/orders', {responseType: 'text'});
  }

  onTestPost(){
    const testOrder = {
      // "items": [
      // {
      //   "drink": {
      //     "id": 1,
      //     "name": "Cola",
      //     "price": 2.5
      //   },
      //   "quantity": 2
      // },
      // {
      //   "drink": {
      //     "id": 2,
      //     "name": "Bier",
      //     "price": 3.0
      //   },
      //   "quantity": 3
      // }
      // ]
    }

    this.http.post<void>('/api/orders', testOrder)
      .subscribe((res) => console.log('POST RESPONSE', res));
  }

}
