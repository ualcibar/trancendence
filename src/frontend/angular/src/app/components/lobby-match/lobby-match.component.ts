import { Component } from '@angular/core';
import { MatchMakingState, MatchmakingService } from '../../services/matchmaking.service';
import { AuthService, UserInfo } from '../../services/auth.service';
import { CommonModule } from '@angular/common';

enum LobbyMatchState {
  Error,
  Waiting,
  Ok
}

@Component({
  selector: 'app-lobby-match',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './lobby-match.component.html',
  styleUrl: './lobby-match.component.css'
})
export class LobbyMatchComponent {
  team_a: (UserInfo| undefined)[] = [];
  team_b: (UserInfo| undefined)[] = [];
  state: LobbyMatchState;
  LobbyMatchState = LobbyMatchState;
  MatchMakingState = MatchMakingState;
  constructor(private matchmaking: MatchmakingService) {
    if (matchmaking.state.getCurrentValue() !== MatchMakingState.OnGame){
      this.state = LobbyMatchState.Error;
      console.error('matchmaking state is not connecting')
    }
    else{
      this.state = LobbyMatchState.Ok
      const info = this.matchmaking.getOnlineMatchSettings();
      if (!info){
        this.state = LobbyMatchState.Waiting;
        return;
      }
      this.team_a = new Array(info.settings.teamSize).fill(undefined);
      this.team_b = new Array(info.settings.teamSize).fill(undefined);
      this.team_a[0] = info.host;
      let player_index = 0;
      for (let i = 1; i < info.settings.teamSize; i++) {
        this.team_a[i] = info.players[player_index].info;
        player_index++;
      }
      for (let i = 0; i < info.settings.teamSize; i++) {
        if (info.players.length < i)
          this.team_b[i] = info.players[player_index].info;
        else
          this.team_b[i] = undefined;
        player_index++;
      }
    }
  }

}

