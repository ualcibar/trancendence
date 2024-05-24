import { AfterViewInit, Component, OnDestroy } from "@angular/core";
import { PongComponent } from "../pong/pong.component";
import { GameManagerService, GameManagerState, MatchManager, OnlineManager, OnlineMatchManager, RealManagerType, TournamentManager } from "../../services/gameManager.service";
import { Router } from "@angular/router";
import { MatchMakingState } from "../../services/matchmaking.service";

@Component({
  selector: 'app-play',
  standalone: true,
  templateUrl: './play.component.html',
  styleUrls: ['./play.component.css'],
  imports: [PongComponent]
})
export class PlayComponent implements AfterViewInit, OnDestroy {
    currentManagerType : RealManagerType;
    realManager : TournamentManager | OnlineMatchManager | MatchManager;
    constructor(public manager : GameManagerService, private router : Router){
        if (manager.getState() !== GameManagerState.InGame){
            router.navigate(['/'])
        }
        this.currentManagerType = manager.getRealManagerType();
        const realManager = manager.getRealManager();
        switch(this.currentManagerType){
            case RealManagerType.Match:
                if (!(realManager instanceof MatchManager)){
                    console.error('manager is not type match');
                    router.navigate(['/']);
                }
                break;
            case RealManagerType.Tournament:
                if (!(realManager instanceof TournamentManager)){
                    console.error('manager is not type match');
                    router.navigate(['/']);
                }
                break;
            case RealManagerType.Match:
                if (!(realManager instanceof MatchManager)){
                    console.error('manager is not type match');
                    router.navigate(['/']);
                }
                break;
        }
        this.realManager = realManager;

    }
    ngAfterViewInit(): void {

    }
    ngOnDestroy(): void {
        
    }
}
