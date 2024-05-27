import { AfterViewInit, Component, OnDestroy } from "@angular/core";
import { PongComponent } from "../../components/pong/pong.component";
import { GameManagerService, GameManagerState, MatchManager, MatchState, OnlineManager, OnlineMatchManager, RealManagerType, TournamentManager, TournamentState } from "../../services/gameManager.service";
import { Router } from "@angular/router";
import { State } from "../../utils/state";
import { Observable } from "rxjs";
import { TournamentTreeComponent } from "../../components/tournament-tree/tournament-tree.component";
import { CommonModule } from "@angular/common";

class PlayRender{
    renderTree : State<boolean> = new State<boolean>(false);
    renderGame : State<boolean> = new State<boolean>(false);

    get tree$() : Observable<boolean> {return this.renderTree.observable};
    get game$() : Observable<boolean> {return this.renderGame.observable};
}

@Component({
  selector: 'app-play',
  standalone: true,
  templateUrl: './play.component.html',
  styleUrls: ['./play.component.css'],
  imports: [
    CommonModule,
    PongComponent,
    TournamentTreeComponent
  ]
})
export class PlayComponent implements AfterViewInit, OnDestroy {
    renderState : PlayRender = new PlayRender();
    currentManagerType : RealManagerType;
    tournamentManager? : TournamentManager  | undefined;
    matchManager? : MatchManager  | undefined;
    onlineMatchManager? : OnlineMatchManager  | undefined;
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
                this.renderState.renderGame.setValue(true);
                if (realManager instanceof MatchManager)
                    this.matchManager = realManager;
                break;
            case RealManagerType.Tournament:
                if (!(realManager instanceof TournamentManager)){
                    console.error('manager is not type match');
                    router.navigate(['/']);
                }
                if (realManager instanceof TournamentManager){
                    this.tournamentManager = realManager;
                    realManager.tournamentState.subscribe((state : TournamentState) => {
                        switch(state) {
                            case TournamentState.InGame:
                                this.renderState.renderGame.setValue(true);
                                this.renderState.renderTree.setValue(false);
                                break;
                            case TournamentState.InTree:
                                this.renderState.renderGame.setValue(false);
                                this.renderState.renderTree.setValue(true);
                                break;
                            case TournamentState.FinishedSuccess:
                                this.router.navigate(['/'])    
                                break;
                        }
                    })
                }
                this.renderState.renderTree.setValue(true);
                break;
            case RealManagerType.OnlineMatch:
                if (!(realManager instanceof OnlineMatchManager)){
                    console.error('manager is not type match');
                    router.navigate(['/']);
                }
                if (realManager instanceof OnlineMatchManager)
                    this.onlineMatchManager = realManager;
                this.renderState.renderGame.setValue(true);
                break;
        } 
    }
    ngAfterViewInit(): void {
    }
    ngOnDestroy(): void {
        this.manager.setMatchState(MatchState.FinishedSuccess)
    }
    startNextTournamentround(){

        console.log('PLAY HIT')
        console.log('score', this.tournamentManager!.update.currentMatchUpdate.score)
        this.tournamentManager!.nextRound();
        //this.renderState.renderGame.setValue(true);
        setTimeout(()=>this.tournamentManager!.start(), 1000);
    }
}
