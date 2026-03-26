import {Routes} from '@angular/router';
import {OrderComponent} from './order/order.component';
import {PreparationComponent} from './preparation-component/preparation-component';
import {EvaluationComponent} from './evaluation/evaluation.component';

export const routes: Routes = [
  { path: '', redirectTo: '/order', pathMatch: 'full' },
  { path: 'order', component: OrderComponent },
  { path: 'preparation', component: PreparationComponent },
  { path: 'evaluation', component: EvaluationComponent },
  // { path: '**', redirectTo: '/order' } // Fallback
];
