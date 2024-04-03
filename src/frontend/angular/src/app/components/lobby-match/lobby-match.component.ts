import { Component } from '@angular/core';
import { MatchmakingService } from '../../services/matchmaking.service';
import { AuthService, UserInfo } from '../../services/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-lobby-match',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './lobby-match.component.html',
  styleUrl: './lobby-match.component.css'
})
export class LobbyMatchComponent {
  team_a: UserInfo[] = [{username: "Test", online: true}, {username: "Lol", online: true}];
  team_b: UserInfo[] = [{username: "Test2", online: true}];

  constructor(private matchmaking: MatchmakingService) {

  }

  //Testing
  isOnline() : boolean {
    return false;
  }
}

