
import { Score } from "../services/matchmaking.service";

class TournamentNode{
    groups : [string, string];
    score : Score;
    constructor(groups : [string, string], score : Score){
        this.groups = groups;
        this.score = score;
    }
}

function log2(N: number): number {
    return Math.log(N) / Math.log(2);
}

class Range{
    start : number;
    end : number;
    constructor(start : number, end : number){
        this.start = start;
        this.end = end;
    }
    range():number{
        return this.end - this.start;
    }
}

export class TournamentTree{
    data : TournamentNode[] = new Array();
    numberOfInitGroups : number;
    layersWindow : Range[] = new Array();
    currentLayer : number = 0;
    currentIndex : number = 0; 
    
    constructor(groups : string[]){
        this.numberOfInitGroups = groups.length;
        for (let i = 0; i < groups.length; i+=2){
            this.data.push(new TournamentNode([groups[i], groups[i + 1]], new Score([0,0])));
        }
        this.layersWindow[0] = new Range(0, this.data.length);
    }
    getNumberOfLayers() : number{
        return Math.ceil(log2(this.numberOfInitGroups));
    }
    getCurrentGroups():[string,string] | string{
        if (this.data.length <= this.currentIndex && this.currentIndex != 0){
            const score = this.data[this.currentIndex - 1].score.score;
            if (score[0] >= score[1])
                return this.data[this.currentIndex - 1].groups[0]
            else 
                return this.data[this.currentIndex - 1].groups[1]
        }
        return this.data[this.currentIndex].groups;
    }
    next(score : Score) : boolean{
        console.log('NEXT data', this.data, 'current index', this.currentIndex)
        if (this.currentIndex >= this.data.length){
            return false
        }
        this.data[this.currentIndex].score = score;
        if (this.currentIndex % 2 === 1){
            const prev = this.data[this.currentIndex - 1];
            const current = this.data[this.currentIndex];
            let a;
            if (prev.score.score[0] > prev.score.score[1])
                a = prev.groups[0];
            else
                a = prev.groups[1];
            let b;
            if (score.score[0] > score.score[1])
                b = current.groups[0];
            else 
                b = current.groups[1];
            this.data.push(new TournamentNode([a,b], new Score([0,0])))
            if (this.currentIndex === this.layersWindow[this.currentLayer].end){
                const newRange = new Range(this.currentIndex + 1,
                    this.currentIndex + 1 + this.layersWindow[this.currentLayer].range() / 2);
                this.layersWindow.push(newRange);      
            }
        }
        this.currentIndex += 1;
        return true;
    }
}