import { Component } from '@angular/core';
import { MatchmakingService } from '../../services/matchmaking.service';
import { AuthService, UserInfo } from '../../services/auth.service';
import { CommonModule } from '@angular/common';
import { MatchmakingState, StateService } from '../../services/stateService';
import { OnlineMatchInfo } from '../../services/gameManager.service';
import { TranslateModule } from '@ngx-translate/core';

enum LobbyMatchState {
  Error,
  Waiting,
  Ok
}

@Component({
  selector: 'app-lobby-match',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './lobby-match.component.html',
  styleUrl: './lobby-match.component.css'
})
export class LobbyMatchComponent {
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
          this.state = LobbyMatchState.Ok
          break;
        case MatchmakingState.StandBy:
          this.state = LobbyMatchState.Error
          console.error('lobby match: should never reach here with matchmaking state standby')
          break;
      }
    })
  }

  cancelGame() {
    this.matchmaking.sendCancelJoinMatch();
    console.log("a");
  }
}

