import { State } from "../utils/state";
import { Observable, Subject, Subscription } from "rxjs";
import { LogFilter, Logger } from "../utils/debug";
import { Injectable } from "@angular/core";
export enum HomeState {
  Home = 'Home',
  SearchingOnlineGame = 'SearchingOnlineGame',
  Community = 'Community',
  MatchTournament = 'MatchTournament',
  MatchGenerator = 'MatchGenerator',
  TournamentGenerator = 'Tournament',
  OnlineMatchGenerator = 'OnlineMatchGenerator',
  JoiningGame = 'JoiningGame'
  //TournamentTree,
}

export enum MatchmakingState{
    Disconnected,
    InGame,
    StandBy
}

export enum ChatState{
    Disconnected,
    Connected
}

const  chat: number = 0;
const  local : number = 1;
const  multiplayer: number = 2;
const  community: number = 3;
const  match_tournament: number = 4;
const  onlineMatchSearch: number = 5;
const  tournamentGenerator: number = 6;
const  matchGenerator: number = 7;
const  onlineMatchGenerator: number = 8;
const  joiningOnlineMatch: number = 9;
const  tournamentTree: number = 10;



export class HomeRenderState{
    private activity : State<boolean>[];
    private _render : Subject<void> = new Subject<void>();
    private _render$ : Observable<void> = this._render.asObservable();
    constructor(){
        this.activity = new Array();
        for (let i = 0; i < 11; i++){
            this.activity.push(new State<boolean>(false));
        }
        this.local = true;
    }

    get chat() : boolean{return this.activity[chat].getCurrentValue()}
    get local() : boolean{return this.activity[local].getCurrentValue()}
    get multiplayer() : boolean{return this.activity[multiplayer].getCurrentValue()}
    get community() : boolean{return this.activity[community].getCurrentValue()}
    get match_tournament() : boolean{return this.activity[match_tournament].getCurrentValue()}
    get onlineMatchSearch() : boolean{return this.activity[onlineMatchSearch].getCurrentValue()}
    get tournamentGenerator() : boolean{return this.activity[tournamentGenerator].getCurrentValue()}
    get matchGenerator() : boolean{return this.activity[matchGenerator].getCurrentValue()}
    get onlineMatchGenerator() : boolean{return this.activity[onlineMatchGenerator].getCurrentValue()}
    get joiningOnlineMatch() : boolean{return this.activity[joiningOnlineMatch].getCurrentValue()}
    get tournamentTree() : boolean{return this.activity[tournamentTree].getCurrentValue()}
    
    get render$() : Observable<void>{return this._render}
    get chat$() : Observable<boolean>{return this.activity[chat].observable}
    get local$() : Observable<boolean>{return this.activity[local].observable}
    get multiplayer$() : Observable<boolean>{return this.activity[multiplayer].observable}
    get community$() : Observable<boolean>{return this.activity[community].observable}
    get match_tournament$() : Observable<boolean>{return this.activity[match_tournament].observable}
    get onlineMatchSearch$() : Observable<boolean>{return this.activity[onlineMatchSearch].observable}
    get tournamentGenerator$() : Observable<boolean>{return this.activity[tournamentGenerator].observable}
    get matchGenerator$() : Observable<boolean>{return this.activity[matchGenerator].observable}
    get onlineMatchGenerator$() : Observable<boolean>{return this.activity[onlineMatchGenerator].observable}
    get joiningOnlineMatch$() : Observable<boolean>{return this.activity[joiningOnlineMatch].observable}
    get tournamentTree$() : Observable<boolean>{return this.activity[tournamentTree].observable}
    
    set chat(val : boolean){this.activity[chat].setValue(val);}
    set local(val : boolean){this.activity[local].setValue(val);}
    set multiplayer(val : boolean){this.activity[multiplayer].setValue(val);}
    set community(val : boolean){this.activity[community].setValue(val);}
    set match(val : boolean){this.activity[match_tournament].setValue(val);}
    set onlineMatchSearch(val : boolean){this.activity[onlineMatchSearch].setValue(val);}
    set tournamentGenerator(val : boolean){this.activity[tournamentGenerator].setValue(val);}
    set matchGenerator(val : boolean){this.activity[matchGenerator].setValue(val);}
    set onlineMatchGenerator(val : boolean){this.activity[onlineMatchGenerator].setValue(val);}
    set joiningOnlineMatch(val : boolean){this.activity[joiningOnlineMatch].setValue(val);}
    set tournamentTree(val : boolean){this.activity[tournamentTree].setValue(val);}


    getActivity() : boolean[]{
        return this.activity.map(activity => activity.getCurrentValue());
    }

    update(toRender : boolean[]){
        this.activity.forEach((value ,index) => {
            if (toRender[index] !== value.getCurrentValue())
                value.setValue(toRender[index])
        });
        this._render.next();
    }
}

class HomeRenderManager{//manages wether they are active or not
    private states : HomeRenderState = new HomeRenderState();
    private active : { matchmaking : boolean,
                       chat : boolean,
                       community : boolean};
    private renderingBlock : number | undefined = undefined;

    //chat always if active?
    //top level local multi community
    //individuals ...

    constructor(homeState$ : Observable<HomeState>,
                matchmakingState$ : Observable<MatchmakingState>,
                chatState$ : Observable<ChatState>)
    {
        this.active = {
            matchmaking: false,
            chat: false,
            community: false
        };
        homeState$.subscribe((state : HomeState) => {
            switch (state){
                case HomeState.Home: {
                    const wantRender = this.createActiveArray()
                    wantRender[local] = true;
                    wantRender[chat] = this.active.chat;
                    wantRender[community] = this.active.community;
                    wantRender[multiplayer] = this.active.matchmaking;
                    if (wantRender.length !== 11)
                        console.error('state service: home switch: map length error');
                    this.states.update(wantRender);
                    break;
                }
                case HomeState.MatchTournament: {
                    const wantRender = this.createActiveArray()
                    wantRender[match_tournament] = true;
                    wantRender[chat] = this.active.chat;
                    if (wantRender.length !== 11)
                        console.error('state service: home switch: map length error');
                    this.states.update(wantRender);
                    break;
                }
                case HomeState.MatchGenerator: {
                    const wantRender = this.createActiveArray()
                    wantRender[matchGenerator] = true;
                    wantRender[chat] = this.active.chat;
                    if (wantRender.length !== 11)
                        console.error('state service: home switch: map length error');
                    this.states.update(wantRender);
                    break;
                }
                case HomeState.TournamentGenerator: {
                    const wantRender = this.createActiveArray()
                    wantRender[tournamentGenerator] = true;
                    wantRender[chat] = this.active.chat;
                    if (wantRender.length !== 11)
                        console.error('state service: home switch: map length error');
                    this.states.update(wantRender);
                    break;
                }
                case HomeState.JoiningGame:{
                    const wantRender = this.createActiveArray()
                    wantRender[joiningOnlineMatch] = true;
                    wantRender[chat] = this.active.chat;
                    if (wantRender.length !== 11)
                        console.error('state service: home switch: map length error');
                    this.states.update(wantRender);
                    break;
                }
                /*case HomeState.TournamentTree: {
                    const wantRender = this.createActiveArray()
                    wantRender[tournamentTree] = true;
                    wantRender[chat] = this.active.chat;
                    if (wantRender.length !== 11)
                        console.error('state service: home switch: map length error');
                    this.states.update(wantRender);
                    break;
                }*/
                case HomeState.SearchingOnlineGame: {
                    const wantRender = this.createActiveArray()
                    wantRender[onlineMatchSearch] = true;
                    wantRender[chat] = this.active.chat;
                    if (wantRender.length !== 11)
                        console.error('state service: home switch: map length error');
                    this.states.update(wantRender);
                    break;
                }
                case HomeState.Community:{
                    const wantRender = this.createActiveArray()
                    wantRender[community] = true;
                    wantRender[chat] = this.active.chat;
                    if (wantRender.length !== 11)
                        console.error('state service: home switch: map length error');
                    this.states.update(wantRender);
                    break;
                }
                case HomeState.OnlineMatchGenerator:{
                    const wantRender = this.createActiveArray()
                    wantRender[onlineMatchGenerator] = true;
                    wantRender[chat] = this.active.chat;
                    if (wantRender.length !== 11)
                        console.error('state service: home switch: map length error');
                    this.states.update(wantRender);
                    break;

                }
                default:
                    console.error('!todo state switch', HomeState[state])
            }    
        })
        matchmakingState$.subscribe(state => {
            const wantRender = this.createActiveArray()
            switch (state){
                case MatchmakingState.StandBy:
                    this.active.matchmaking = true;
                    wantRender[multiplayer] = this.active.matchmaking;
                    wantRender[local] = true;
                    break;
                case MatchmakingState.InGame:
                    this.active.matchmaking = true;
                    wantRender[joiningOnlineMatch] = true;
                    break;
                case MatchmakingState.Disconnected:
                    this.active.matchmaking = false;
                    wantRender[multiplayer] = this.active.matchmaking;
                    wantRender[local] = true;
                    break;
            }
            //if (!this.renderingBlock){
                wantRender[chat] = this.active.chat;
                this.states.update(wantRender);
            //}
        })
        chatState$.subscribe(state => {
            switch (state){
                case ChatState.Connected:
                    this.active.chat = true;
                    break;
                case ChatState.Disconnected:
                    this.active.chat = false;

            }
            if (!this.renderingBlock){
                const wantRender = this.createActiveArray()
                wantRender[multiplayer] = this.active.matchmaking;
                wantRender[chat] = this.active.chat;
                wantRender[local] = true;
                this.states.update(wantRender);
            }else{
                const wantRender = this.createActiveArray()
                wantRender[chat] = this.active.chat;
                wantRender[this.renderingBlock] = true;
                this.states.update(wantRender);
            }
        })
    }
    createActiveArray(): boolean[] {
        return new Array<boolean>(11).fill(false);
    }
    getStates():HomeRenderState{
        return this.states;
    }
}

@Injectable({
  providedIn: 'root'
})
export class StateService {
    private _homeState : State<HomeState>;
    private _matchmakingState : State<MatchmakingState>;
    private _chatState : State<ChatState>;
    private homeRenderManager : HomeRenderManager;

    //logger
    private logger : Logger = new Logger(LogFilter.StateServiceLogger, 'state service:')

    constructor(){
        this._homeState = new State<HomeState>(HomeState.Home);
        this._matchmakingState = new State<MatchmakingState>(MatchmakingState.Disconnected);
        this._chatState = new State<ChatState>(ChatState.Disconnected);
        this.homeRenderManager = new HomeRenderManager(this.homeState$, this.matchmakingState$, this.chatState$)
    }

    changeHomeState(state : HomeState){
        this._homeState.setValue(state);
    }
    changeChatState(state : ChatState){
        this._chatState.setValue(state);
    }
    changeMultiplayerState(state : MatchmakingState){
       this._matchmakingState.setValue(state);
    }
    subscribeToHomeState(fn : any) : Subscription{
        return this._homeState.subscribe(fn);
    }
    subscribeToMatchmakingState(fn : any) : Subscription{
        return this._homeState.subscribe(fn);
    }
    subscribeToChatState(fn : any) : Subscription{
        return this._homeState.subscribe(fn);
    }

    get homeRenderState() : HomeRenderState{
        return this.homeRenderManager.getStates();
    }

    get homeState() : HomeState{
        return this._homeState.getCurrentValue();
    }
    get matchmakingState() : MatchmakingState{
        return this._matchmakingState.getCurrentValue();
    }
    get chatState() : ChatState{
        return this._chatState.getCurrentValue();
    }
    get homeState$() : Observable<HomeState>{
        return this._homeState.observable
    }
    get matchmakingState$() : Observable<MatchmakingState>{
        return this._matchmakingState.observable;
    }
    get chatState$() : Observable<ChatState>{
        return this._chatState.observable;
    }
}
