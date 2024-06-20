import { AfterViewInit, Component, OnDestroy } from "@angular/core";
import { PaddleState, PongComponent } from "../../components/pong/pong.component";
import { GameManagerService, GameManagerState, Manager, MatchConfig, MatchManager, MatchSettings, MatchState, MatchUpdate, OnlineManager, OnlineMatchManager, RealManagerType, TournamentManager, TournamentState } from "../../services/gameManager.service";
import { Router } from "@angular/router";
import { State } from "../../utils/state";
import { Observable } from "rxjs";
import { TournamentTreeComponent } from "../../components/tournament-tree/tournament-tree.component";
import { CommonModule } from "@angular/common";
import { MapsName, MapsService } from "../../services/map.service";
import { OnlineMatchState, OnlinePlayer, OnlinePlayerState } from "../../services/matchmaking.service";
import { TranslateModule } from '@ngx-translate/core';

class PlayRender{
    renderTree : State<boolean> = new State<boolean>(false);
    renderGame : State<boolean> = new State<boolean>(false); 
    renderMatchEnd : State<boolean> = new State<boolean>(false);
    renderOnlineMatchEnd : State<boolean> = new State<boolean>(false);
    renderTournamentEnd : State<boolean> = new State<boolean>(false);

    get tree$() : Observable<boolean> {return this.renderTree.observable};
    get game$() : Observable<boolean> {return this.renderGame.observable};
}

enum Point{
    Lost,
    Won,
    NotPlayed,
    Playing
}

@Component({
  selector: 'app-play',
  standalone: true,
  templateUrl: './play.component.html',
  styleUrls: ['./play.component.css'],
  imports: [
    CommonModule,
    PongComponent,
    TournamentTreeComponent, TranslateModule
  ]
})
export class PlayComponent implements AfterViewInit, OnDestroy {
    Point = Point;
    OnlinePlayerState = OnlinePlayerState;
    points! : Point[];
    debug = true;
    showSettings = true;
    renderState : PlayRender = new PlayRender();
    currentManagerType : RealManagerType;
    tournamentManager? : TournamentManager  | undefined;
    matchManager? : MatchManager  | undefined;
    onlineMatchManager? : OnlineMatchManager  | undefined;
    players? : (OnlinePlayer | undefined)[]
    matchUpdate! : MatchUpdate;

    isMenuOpen = false;
    openMenuKey = 'Escape';

    flipMenu(){
        console.log('flip menu')
        this.isMenuOpen = !this.isMenuOpen;
    }

    isPaused = false;
    pauseKey = 'p';

    flipPause(){
        this.isPaused = !this.isPaused;
    }

    constructor(public manager : GameManagerService, private router : Router, private maps : MapsService) {
        //menu keyhook
        document.addEventListener('keydown', (e) => {
            if (e.key === this.openMenuKey){
                this.flipMenu();
            }
            if (e.key === this.pauseKey){
                this.flipPause();
            }
        })
        this.currentManagerType = manager.getRealManagerType();
        if (manager.getState() !== GameManagerState.InGame){
            if (this.debug) {
                console.log('creating match');
                const matchSettings = new MatchSettings(60,3,2,1, MapsName.Default, [PaddleState.Binded,PaddleState.Binded]);               
                const mapSettings = this.maps.getMapSettings(matchSettings.mapName);
                if (!mapSettings){
                    console.error('map not found');
                    return
                }

                if (!this.manager.createMatch(new MatchConfig(matchSettings, mapSettings))){
                    console.error('failed to create match');
                    return
                }
                console.log('starting match');
                this.matchUpdate = this.manager.getMatchUpdate()
                this.manager.start();
                //this.router.navigate(['/play']);
            }else
                router.navigate(['/'])
        }
        this.matchUpdate = this.manager.getMatchUpdate()
        this.points = new Array<Point>(this.manager.getMatchSettings().maxRounds).fill(Point.NotPlayed)
        this.currentManagerType = manager.getRealManagerType();
        const realManager = manager.getRealManager();
        switch(this.currentManagerType){
            case RealManagerType.Match:
                if (!(realManager instanceof MatchManager)){
                    console.error('manager is not type match');
                    router.navigate(['/']);
                }
                this.renderState.renderGame.setValue(true);
                if (realManager instanceof MatchManager) {
                    this.matchManager = realManager;
                    realManager.matchState.subscribe((state : MatchState) => {
                        switch(state){
                            case MatchState.FinishedSuccess:
                                this.renderState.renderGame.setValue(false);
                                this.renderState.renderMatchEnd.setValue(true);
                                window.location.href = '/'
                                break;
                            case MatchState.FinishedError:
                                this.renderState.renderGame.setValue(false);
                                this.renderState.renderMatchEnd.setValue(true);
                                window.location.href = '/'
                                break;
                        }
                    })
                }
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
                                this.renderState.renderTree.setValue(false);
                                this.renderState.renderGame.setValue(true);
                                break;
                            case TournamentState.InTree:
                                this.renderState.renderGame.setValue(false);
                                this.renderState.renderTree.setValue(true);
                                break;
                            case TournamentState.FinishedSuccess:
                                window.location.href = '/'
                                break;
                        }
                    })
                    realManager.currentMatchState.subscribe((state : MatchState) => {
                        const now = Date.now()
                        console.log('STATE', state, 'score', realManager.update.currentMatchUpdate.score, 'now', now)
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
                this.players = this.onlineMatchManager!.getPlayers(); 
                this.renderState.renderGame.setValue(true);
                this.onlineMatchManager!.matchState.subscribe((state : MatchState)=>{ 
                    switch (state){
                        case MatchState.FinishedError:
                            console.log('there was an error during the match')
                            this.renderState.renderGame.setValue(false)
                            //setTimeout(() => window.location.href = '/', 500)
                            break;
                        case MatchState.FinishedSuccess:
                            console.log('match finish success')
                            this.renderState.renderGame.setValue(false)
                            //setTimeout(() => window.location.href = '/', 500)
                            break;
                    }
                })
                break;
        } 
    }
    ngAfterViewInit(): void {
        
    }
    
    isBot(id : number) : boolean{
        const index = this.onlineMatchManager?.info.getPlayerIndex(id)
        if (index== undefined)
            return false;
        return this.matchUpdate.paddles[index].stateBot
    }

    ngOnDestroy(): void {
        if (this.manager.getState() === GameManagerState.InGame){
            if (this.currentManagerType == RealManagerType.OnlineMatch){
                const state = this.onlineMatchManager!.getOnlineState()
                if (state !== OnlineMatchState.FinishedError && state !== OnlineMatchState.FinishedSuccess){
                    //host disconnected
                    this.onlineMatchManager!.matchSync.syncOnlineMatchState(OnlineMatchState.HostDisconected)
                }
            }
            /*else
                this.manager.setMatchState(MatchState.FinishedSuccess)*/
        }
    }
    printScore(){ 
        console.log(this.tournamentManager!.update.currentMatchUpdate.score)
    }
    startNextTournamentround(){
        console.log(this.tournamentManager!.update.currentMatchUpdate.score)
        console.log('PLAY HIT')
        console.log('score', this.tournamentManager!.update.currentMatchUpdate.score)
        this.tournamentManager!.nextRound();
        //this.tournamentManager!.tournamentState.setValue(TournamentState.InGame)
        //setTimeout(()=>this.tournamentManager?.start(), 1000);
        
        //this.renderState.renderGame.setValue(true);
    }
}
