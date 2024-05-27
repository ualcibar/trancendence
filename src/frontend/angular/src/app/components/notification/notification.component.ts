import { Component} from '@angular/core';
import { AfterViewInit } from '@angular/core';
import { slideInFromRight } from '../../../assets/animations/slideInFromRight';
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

@Component({
  selector: 'app-notification-component',
  templateUrl: './notification.component.html',
  styleUrl: './notification.component.css',
  animations: [slideInFromRight]
})
export class NotificationComponent implements AfterViewInit{
  notificationQueue : Notification[] = [];
  private id : number = 0;
  trial : boolean = false;
  constructor(){
  }
  ngAfterViewInit(): void {
    if (this.trial) {
      const notification = new Notification('Friend Request', 'Patata wants to be your friend',
        {text : 'accept', callBack : ()=>console.log('adding friend')},
        {text : 'decline', callBack : ()=>console.log('request denied')});
      this.addNotification(notification)
      setInterval(() => this.addNotification(notification), 5000);
    }
  }
  addNotification(notification : Notification){
    const id = this.genId();
    notification.id = id;
    notification.setDismiss(() => {
      console.log('should stop rendering');
      this.notificationQueue = this.notificationQueue.filter(notification => notification.id != id)
      console.log(this.notificationQueue)
    })
    this.notificationQueue.push(notification);
    setTimeout(() => {
      console.log('should stop rendering');
      this.notificationQueue = this.notificationQueue.filter(notification => notification.id != id)
      console.log(this.notificationQueue)
    }, notification.timeoutMs)
  }
  genId(){
    const id = this.id;
    this.id +=1;
    return id;
  }
}
