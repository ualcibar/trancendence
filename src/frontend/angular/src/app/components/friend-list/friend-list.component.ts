import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { AuthService, PrivateUserInfo, UserInfo } from '../../services/auth.service';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { easeOut } from '../../../assets/animations/easeOut';
import {ScrollingModule} from '@angular/cdk/scrolling';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  standalone: true,
  animations: [easeOut],
  selector: 'app-friend-list',
  templateUrl: './friend-list.component.html',
  styleUrls: ['./friend-list.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ScrollingModule, TranslateModule]
})

export class FriendListComponent implements OnInit {
  friend_list: UserInfo[] | undefined;
  info? : UserInfo | undefined;
  userId : number = -1;

  constructor(private http: HttpClient, private route: ActivatedRoute, private authService: AuthService, private router: Router) { }

  ngOnInit(): void {
    this.authService.subscribe({
      next: (userInfo : PrivateUserInfo) => {
        if (userInfo) {
          this.route.params.subscribe(params => { // Esto hay que mirarlo, porquqe si lo del getUserInfo() falla por no estar con la sesión
            // iniciada, entonces se queda "cargando" infinitamente
            this.userId = params['userId'];
            //this.authService.updateUserInfo();
            this.friend_list = this.authService.userInfo?.friends;
          });
        }
      }
    })
    console.log("------------->", this.friend_list);
  }

  onNavigate(id : number) {
    this.router.navigate(['/profile', id]);
  }
}
