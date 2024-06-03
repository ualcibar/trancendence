import { Component } from '@angular/core';
import { MatchMakingState, MatchmakingService } from '../../services/matchmaking.service';
import { AuthService, UserInfo } from '../../services/auth.service';
import { CommonModule } from '@angular/common';
import { MatchmakingState, StateService } from '../../services/stateService';
import { OnlineMatchInfo } from '../../services/gameManager.service';

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
  //team_a: (UserInfo| undefined)[] = [];
  //team_b: (UserInfo| undefined)[] = [];
  lobby! : OnlineMatchInfo;
  state: LobbyMatchState;

  LobbyMatchState = LobbyMatchState;
  MatchmakingState = MatchmakingState;
  constructor(private matchmaking: MatchmakingService, state : StateService) {
    this.state = LobbyMatchState.Waiting;
    state.matchmakingState$.subscribe(state => {
      switch (state) {
        case MatchmakingState.Disconnected:
          this.state = LobbyMatchState.Error
          console.error('lobby match: should never reach here with matchmaking state disconnected')
          break;
        case MatchmakingState.InGame:
          const info = this.matchmaking.getOnlineMatchInfo();
          if (!info) {
            this.state = LobbyMatchState.Waiting;
            return;
          }
          this.lobby = info;
          console.log('lobby', this.lobby)
          this.state = LobbyMatchState.Ok
          break;
        case MatchmakingState.StandBy:
          this.state = LobbyMatchState.Error
          console.error('lobby match: should never reach here with matchmaking state standby')
          break;
      }
    })
  }
}

