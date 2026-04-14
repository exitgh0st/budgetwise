import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-privacy-policy',
  standalone: true,
  imports: [MatCardModule],
  templateUrl: './privacy-policy.component.html',
  styleUrls: ['../legal.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PrivacyPolicyComponent {}
