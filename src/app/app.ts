import {Component} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {OrderComponent} from './order/order.component';


@Component({
  selector: 'app-root',
  imports: [
    FormsModule,
    OrderComponent
  ],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {

}
