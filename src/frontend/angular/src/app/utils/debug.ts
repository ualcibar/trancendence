export enum LogLevel{
    Info,
    Warning,
    Error,
    None
}

export enum LogFilter{
    managerOnlineLogger,
    managerMatchLogger,
    managerTournamentLogger,
    pongLogger,
    chatServiceLogger,
    matchmakingServiceLogger,
    homeLogger,
}

export class Logger{
    filter : LogFilter;
    start? : string | undefined;

    constructor(filter : LogFilter, start? : string | undefined){
        this.filter = filter;
        this.start = start;
    }

    error(...args : any[]){
        if (debugConfig[this.filter] <= LogLevel.Error){
            if (this.start)
                console.error(this.start, ...args);
            else
                console.error(args);
        }
    }
    info(...args : any[]){
        if (debugConfig[this.filter] <= LogLevel.Info){
            if (this.start)
                console.log(this.start, ...args);
            else
                console.log(args);
        }
    }
    warning(...args : any[]){
        if (debugConfig[this.filter] <= LogLevel.Warning){
            if (this.start)
                console.log(this.start, ...args);
            else
                console.log(args);
        }
    }
    check(level : LogLevel) : boolean{
        return debugConfig[level] <= LogLevel.Warning
    }
}


const debugConfig : Record<LogFilter, LogLevel> = {
    [LogFilter.managerOnlineLogger]: LogLevel.Info,
    [LogFilter.managerMatchLogger]: LogLevel.Error,
    [LogFilter.managerTournamentLogger]: LogLevel.Error,
    [LogFilter.pongLogger]: LogLevel.Info,
    [LogFilter.chatServiceLogger]: LogLevel.None,
    [LogFilter.matchmakingServiceLogger]: LogLevel.Info,
    [LogFilter.homeLogger]: LogLevel.Error
}