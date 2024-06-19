export enum LogLevel{
    Info,
    Warning,
    Error,
    None
}

export enum LogFilter{
    ManagerOnlineLogger,
    ManagerMatchLogger,
    ManagerTournamentLogger,
    PongLogger,
    ChatServiceLogger,
    MatchmakingServiceLogger,
    HomeLogger,
    AuthServiceLogger,
    LobbySearchLogger,
    StateServiceLogger,
    SettingsLogger,
    Others,
}

export class Logger{
    filter : LogFilter;
    start? : string | undefined;

    constructor(filter : LogFilter, start? : string | undefined){
        this.filter = filter;
        this.start = start;
    }

    error(...args : any[]){
        if (globalLooger <= LogLevel.Error && debugConfig[this.filter] <= LogLevel.Error){
            if (this.start)
                console.error(this.start, ...args);
            else
                console.error(args);
        }
    }
    info(...args : any[]){
        if (globalLooger <= LogLevel.Info && debugConfig[this.filter] <= LogLevel.Info){
            if (this.start)
                console.log(this.start, ...args);
            else
                console.log(args);
        }
    }
    warning(...args : any[]){
        if (globalLooger <= LogLevel.Warning && debugConfig[this.filter] <= LogLevel.Warning){
            if (this.start)
                console.log(this.start, ...args);
            else
                console.log(args);
        }
    }
    check(level : LogLevel) : boolean{
        return globalLooger <= LogLevel.Warning && debugConfig[level] <= LogLevel.Warning
    }

    static error( filter : LogFilter, ...args : any[]){
        if (globalLooger <= LogLevel.Error && debugConfig[filter] <= LogLevel.Error)
            console.error(...args);
    }
    static info( filter : LogFilter, ...args : any[]){
        if (globalLooger <= LogLevel.Info && debugConfig[filter] <= LogLevel.Error)
            console.log(...args);
    }
    static warning( filter : LogFilter, ...args : any[]){
        if (globalLooger <= LogLevel.Warning && debugConfig[filter] <= LogLevel.Error)
            console.log(...args);
    }
}

const globalLooger : LogLevel = LogLevel.Info;//overwrites all loggers

const debugConfig : Record<LogFilter, LogLevel> = {
    [LogFilter.ManagerOnlineLogger]: LogLevel.Error,
    [LogFilter.ManagerMatchLogger]: LogLevel.Error,
    [LogFilter.ManagerTournamentLogger]: LogLevel.Error,
    [LogFilter.PongLogger]: LogLevel.Info,
    [LogFilter.ChatServiceLogger]: LogLevel.Error,
    [LogFilter.MatchmakingServiceLogger]: LogLevel.Error,
    [LogFilter.HomeLogger]: LogLevel.Error,
    [LogFilter.AuthServiceLogger]: LogLevel.Error,
    [LogFilter.LobbySearchLogger] : LogLevel.Error,
    [LogFilter.StateServiceLogger] : LogLevel.Error,
    [LogFilter.SettingsLogger] : LogLevel.Error,
    [LogFilter.Others] : LogLevel.Info,
}