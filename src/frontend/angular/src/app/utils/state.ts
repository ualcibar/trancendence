import { BehaviorSubject, Observable, Subscription} from "rxjs";
export class State<T>{
    private subject : BehaviorSubject<T>;
    observable : Observable<T>;
    subscription: Subscription | undefined;
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
    subscribe(subscription : any) : Subscription{
        return this.observable.subscribe(subscription);
    }
}