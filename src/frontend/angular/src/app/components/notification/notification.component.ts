import { Component} from '@angular/core';
import { AfterViewInit } from '@angular/core';
import { slideInFromRight } from '../../../assets/animations/slideInFromRight';
import { Notification, NotificationService } from '../../services/notificationService';


function min(a : number, b : number) : number{
  if (a < b)
    return a
  else 
    return b
}

@Component({
  selector: 'app-notification-component',
  templateUrl: './notification.component.html',
  styleUrl: './notification.component.css',
  animations: [slideInFromRight]
})
export class NotificationComponent{
  renderingNotifications : Notification[] = [];
  maxConcurrentNotifications : number = 3;
  constructor(private noticationService : NotificationService){
    noticationService.newNotifications.subscribe((numberNotifications : number) => {
      if (this.renderingNotifications.length < this.maxConcurrentNotifications){
        const count = min(this.maxConcurrentNotifications - this.renderingNotifications.length, numberNotifications)
        if (count > 0){
          const newNotifications = noticationService.getNotifications(count)
          newNotifications.forEach(notification => this.renderNotification(notification));
        }
      }
    })
  }

  fetchNewNotifications() {
    if (this.renderingNotifications.length < this.maxConcurrentNotifications) {
      const count = min(this.maxConcurrentNotifications - this.renderingNotifications.length,
        this.noticationService.newNotifications.getCurrentValue())
      if (count > 0) {
        const newNotifications = this.noticationService.getNotifications(count)
        newNotifications.forEach(notification => this.renderNotification(notification));
      }
    }
  }

  renderNotification(notification : Notification){
    this.renderingNotifications.push(notification);
    const timeout =  setTimeout(() => {
      this.renderingNotifications = this.renderingNotifications.filter(notification => notification.id != notification.id)
      this.fetchNewNotifications()
    }, notification.timeoutMs)
    notification.setDismiss(() => {
      clearTimeout(timeout)
      this.renderingNotifications = this.renderingNotifications.filter(notification => notification.id != notification.id)
      this.fetchNewNotifications()
    })
  }
}
