import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ScheduledTransactionsComponent } from './scheduled-transactions.component';

describe('ScheduledTransactionsComponent', () => {
  let component: ScheduledTransactionsComponent;
  let fixture: ComponentFixture<ScheduledTransactionsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ScheduledTransactionsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ScheduledTransactionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
