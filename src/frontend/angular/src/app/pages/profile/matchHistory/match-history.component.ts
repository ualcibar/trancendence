import { Component, Input, OnInit} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { AuthService, PrivateUserInfo, UserInfo, UserInfoI } from '../../../services/auth.service';

import { easeOut } from "../../../../assets/animations/easeOut";
import { UnauthorizedComponent } from '../../../components/errors/unauthorized/unauthorized.component';
import { NotFoundComponent } from '../../../components/errors/not-found/not-found.component';
import { CommonModule } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { HttpClient } from '@angular/common/http';
import { Score } from '../../../services/matchmaking.service';

interface MatchI{
  teamA : UserInfoI[];
  teamB : UserInfoI[];
  score_a : number;
  score_b : number;
  date : number;
  teamSize : number;
}

class Match{
  teamA : UserInfo[];
  teamB : UserInfo[];
  score : Score;
  date : number;
  teamSize : number;
  constructor(team_a : UserInfo[], team_b : UserInfo[], score : Score, date : number, teamSize : number){
    this.teamA = team_a;
    this.teamB = team_b;
    this.score = score;
    this.date = date;
    this.teamSize = teamSize;
  }
  static fromI(values : MatchI) : Match | undefined{
    const team_a : UserInfo[] = [];
    const team_b : UserInfo[] = [];
    for (const player of values.teamA){
      const hold =  UserInfo.fromI(player);
      if (!hold)
        return undefined;
      team_a.push(hold)
    }
    for (const player of values.teamB){
      const hold =  UserInfo.fromI(player);
      if (!hold)
        return undefined;
      team_b.push(hold)
    }
    const score = new Score([values.score_a, values.score_b]);
    return new Match(team_a, team_b, score, values.date, values.teamSize)
  }
  win(userId : number){
    if (this.score.score[0] > this.score.score[1]){
      for (const player of this.teamA){
        if (player.id === userId)
          return true
      }
    }else{
      for (const player of this.teamB){
        if (player.id === userId)
          return true
      }

    }
    return false
  }
}

@Component({
  selector: 'app-match-history',
  standalone: true,
  animations: [easeOut],
  templateUrl: './match-history.component.html',
  styleUrl: './match-history.component.css',
  imports: [UnauthorizedComponent, NotFoundComponent, CommonModule, TranslateModule]
})
export class MatchHistoryComponent implements OnInit{
  @Input() inputMatches! : number[];
  matches : Match[] | undefined;
  expanded : boolean[] | undefined;
  @Input() userId : number | undefined;
  
  constructor(private http : HttpClient, private router : Router) {
  }

  ngOnInit(): void {
    console.log('history!!!', this.inputMatches)
    this.getMatches()
  }


  getMatches(): void {
    const ids = this.inputMatches.join(',')
    const backendURL = `api/polls/matches/?ids=${ids}`;
    this.http.get<any>(backendURL, { withCredentials: true }).subscribe({
      next: (response) => {
        console.log(response)
        this.matches = response.map((match : MatchI) => {
          const hold = Match.fromI(match)
          if (!hold){
            console.error('failed to parse match from backend')
            return
          }
          return hold
        })
        if (this.matches)
          this.expanded = Array<boolean>(this.matches.length).fill(false)
      },
      error: (error) => {
        console.error('failed to fetch matches', error)
      }
    })
  }
  toggleExpand(index : number){
    this.expanded![index] = !this.expanded![index];
  }
  goToProfile(userId : number){
    this.router.navigate([`/profile/${userId}`])
    //!todo
  }
}
