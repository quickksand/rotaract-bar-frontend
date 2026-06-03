import {Component, inject, signal} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {Router} from '@angular/router';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {MatButton} from '@angular/material/button';
import {AdminAuthService} from '../../services/admin-auth.service';

@Component({
  selector: 'app-admin-login',
  imports: [FormsModule, MatFormFieldModule, MatInputModule, MatButton],
  templateUrl: './admin-login.component.html',
})
export class AdminLoginComponent {
  private readonly auth = inject(AdminAuthService);
  private readonly router = inject(Router);

  pin = '';
  error = signal(false);
  submitting = signal(false);

  submit(): void {
    this.submitting.set(true);
    this.error.set(false);

    this.auth.unlock(this.pin).subscribe(success => {
      this.submitting.set(false);
      if (success) {
        this.router.navigate(['/admin']);
      } else {
        this.error.set(true);
        this.pin = '';
      }
    });
  }
}
