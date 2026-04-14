import { Component, computed, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [MatButtonModule, MatCardModule, MatIconModule, RouterLink],
  templateUrl: './not-found.component.html',
  styleUrl: './not-found.component.scss',
})
export class NotFoundComponent {
  private readonly auth = inject(AuthService);

  protected readonly primaryAction = computed(() => {
    if (this.auth.hasSession() && !this.auth.isAuthenticated()) {
      return {
        label: 'Verify Email',
        link: '/verify-email',
      };
    }

    return this.auth.isAuthenticated()
      ? {
          label: 'Go to Dashboard',
          link: '/dashboard',
        }
      : {
          label: 'Go to Login',
          link: '/login',
        };
  });
}
