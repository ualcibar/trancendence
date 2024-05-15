import { BehaviorSubject, Observable } from "rxjs";
export class State<T>{
    private subject : BehaviorSubject<T>;
    observable : Observable<T>;
    constructor (val : T){
        this.subject = new BehaviorSubject<T>(val);
        this.observable = this.subject.asObservable();
    }
    getCurrentValue(): T{
        return this.subject.value;
    }
    setValue(newValue : T){
        this.subject.next(newValue);
    }
}