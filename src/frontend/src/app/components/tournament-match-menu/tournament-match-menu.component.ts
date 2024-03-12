import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatchmakingService, GameSettings } from '../../services/matchmaking.service';

@Component({
  selector: 'app-tournament-match-menu',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './tournament-match-menu.component.html',
  styleUrl: './tournament-match-menu.component.css'
})
export class TournamentMatchMenuComponent {
  @Output() escapeKeyPressed: EventEmitter<void> = new EventEmitter<void>();

  gameSettings : GameSettings;
  @Output() new_match_tournament: EventEmitter<GameSettings> = new EventEmitter<GameSettings>();

  constructor(private matchmakingService : MatchmakingService){
    this.gameSettings = new GameSettings('Match','','','Public');
  }
  togglePublicPrivate(){
    if (this.gameSettings.publicPrivate === "Public")
      this.gameSettings.publicPrivate = "Private";
    else
      this.gameSettings.publicPrivate = "Public";
  }
  toggleMatchTournament(){
    if (this.gameSettings.gameType === "Match")
      this.gameSettings.gameType = "Tournament";
    else
      this.gameSettings.gameType = "Match";
  }
  createMatchTournament(){
    this.new_match_tournament.emit(this.gameSettings);
    this.escapeKeyPressed.emit();
  }

  onBlur() {
    // Emit the outOfFocus event when the input field loses focus
    this.escapeKeyPressed.emit();
  }

  onKeyPress(event : any) {
    if (event.key === "Escape") {
      this.escapeKeyPressed.emit();
    }
  }
}
