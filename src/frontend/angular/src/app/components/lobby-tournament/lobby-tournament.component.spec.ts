import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LobbyTournamentComponent } from './lobby-tournament.component';

describe('LobbyTournamentComponent', () => {
  let component: LobbyTournamentComponent;
  let fixture: ComponentFixture<LobbyTournamentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LobbyTournamentComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(LobbyTournamentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
