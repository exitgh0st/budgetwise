import { Component, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

import { NetworkStatusService } from '../../../core/services/network-status.service';

@Component({
  selector: 'app-offline-banner',
  standalone: true,
  imports: [MatIconModule],
  templateUrl: './offline-banner.component.html',
  styleUrl: './offline-banner.component.scss',
})
export class OfflineBannerComponent {
  private readonly networkStatus = inject(NetworkStatusService);

  protected readonly isOffline = this.networkStatus.isOffline;
}
