import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-terms-of-service',
  standalone: true,
  imports: [MatCardModule],
  templateUrl: './terms-of-service.component.html',
  styleUrls: ['../legal.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TermsOfServiceComponent {}
