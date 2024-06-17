import { Injectable } from "@angular/core";
import { State } from "../utils/state";

export enum NotificationType{
  PopUp,
  Error
}

export class Notification{
  title : string;
  body? : string;
  action1? : {text : string, callBack : any};//function callback
  action2? : {text : string, callBack : any};//function callback
  timeToRenderMs : number = 1000;
  timeoutMs? : number = 3000;
  dismissCallBack : any;
  type : NotificationType = NotificationType.PopUp;
  id! : number;

  constructor(title : string,  body? : string | undefined,
      action1? : {text :string, callBack : any} | undefined,
      action2? : {text :string, callBack : any} | undefined){
    this.title = title;
    this.body = body;
    this.action1 = action1;
    this.action2 = action2;
  }
  callAction1(){
    if (this.action1){
      setTimeout(() => this.dismissCallBack(),0);
      this.action1.callBack()
    }
  }
  callAction2(){
    if (this.action2){
      setTimeout(() => this.dismissCallBack(),0);
      this.action2.callBack()
    }
  }
  setDismiss(dissmissCallBack : any){
    this.dismissCallBack = dissmissCallBack;
  }
}
@Injectable({
  providedIn: 'root'
})
export class NotificationService {
    newNotifications : State<number> = new State<number>(0)
    notificationQueue: Notification[] = []
    private id: number = 0;
    trial: boolean = false;
    constructor() {
        if (this.trial) {
            const notification = new Notification('Friend Request', 'Patata wants to be your friend',
                { text: 'accept', callBack: () => console.log('adding friend') },
                { text: 'decline', callBack: () => console.log('request denied') });
            this.addNotification(notification)
            setInterval(() => this.addNotification(notification), 5000);
        }
    }

    addNotification(notification: Notification) {
        const id = this.genId();
        notification.id = id;
        notification.setDismiss(() => {
            console.log('should stop rendering');
            this.notificationQueue = this.notificationQueue.filter(notification => notification.id != id)
            console.log(this.notificationQueue)
        })
        this.notificationQueue.push(notification);
        this.newNotifications.setValue(this.newNotifications.getCurrentValue() + 1)
    }
    genId() {
        const id = this.id;
        this.id += 1;
        return id;
    }

    getNotifications(num : number) : Notification[]{
        const toReturn = this.notificationQueue.splice(0,num)
        this.newNotifications.setValue(this.notificationQueue.length)
        return toReturn;
    }
}