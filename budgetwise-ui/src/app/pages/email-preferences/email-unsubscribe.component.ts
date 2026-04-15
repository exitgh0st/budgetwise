import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { firstValueFrom } from 'rxjs';
import { UserService } from '../../core/services/user.service';

@Component({
  selector: 'app-email-unsubscribe',
  standalone: true,
  imports: [
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatProgressSpinnerModule,
    RouterLink,
  ],
  templateUrl: './email-unsubscribe.component.html',
  styleUrl: './email-unsubscribe.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmailUnsubscribeComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly userService = inject(UserService);

  readonly status = signal<'loading' | 'success' | 'error'>('loading');
  readonly message = signal('Turning off reminder emails...');

  constructor() {
    void this.unsubscribe();
  }

  private async unsubscribe(): Promise<void> {
    const token = this.route.snapshot.queryParamMap.get('token');

    if (!token) {
      this.status.set('error');
      this.message.set('This unsubscribe link is missing the required token.');
      return;
    }

    try {
      await firstValueFrom(this.userService.unsubscribeEmail(token));
      this.status.set('success');
      this.message.set(
        'Email reminders are now turned off. You can change this again anytime in Settings.',
      );
    } catch (error: any) {
      this.status.set('error');
      this.message.set(
        error?.error?.message ||
          error?.message ||
          'We could not process this unsubscribe request.',
      );
    }
  }
}
