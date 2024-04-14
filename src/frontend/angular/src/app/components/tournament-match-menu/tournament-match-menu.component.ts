import { Component, Output, Input, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatchmakingService, GameSettings, GameType, Maps} from '../../services/matchmaking.service';

@Component({
  selector: 'app-tournament-match-menu',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
  ],
  templateUrl: './tournament-match-menu.component.html',
  styleUrl: './tournament-match-menu.component.css'
})
export class TournamentMatchMenuComponent {
  default : boolean = true;
  @Input() multiplayer! : boolean;
  @Output() escapeKeyPressed: EventEmitter<void> = new EventEmitter<void>();
  gameSettings : GameSettings;
  @Output() new_match_tournament: EventEmitter<GameSettings> = new EventEmitter<GameSettings>();

  constructor(private matchmakingService : MatchmakingService){
    this.gameSettings = new GameSettings(GameType.Match,'','',true);
  }
  togglePublicPrivate(){
    this.gameSettings.publicGame = !this.gameSettings.publicGame;
  }
  toggleDefault(){
    this.default = !this.default;
  }
  toggleMap(){
    switch(this.gameSettings.map){
      case Maps.Default:
        this.gameSettings.map = Maps.Fancy;
        break;
      case Maps.Fancy:
        this.gameSettings.map = Maps.Default;
        break;
    }
  }
  toggleMatchTournament(){
    if (this.gameSettings.gameType == GameType.Match)
      this.gameSettings.gameType = GameType.Tournament;
    else
      this.gameSettings.gameType = GameType.Match;
  }
  createMatchTournament(){
    console.log(`match name = ${this.gameSettings.name}`);
    this.matchmakingService.newGame(this.gameSettings);
    //this.new_match_tournament.emit(this.gameSettings);
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
