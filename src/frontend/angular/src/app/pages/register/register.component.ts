import { Component } from '@angular/core';
import { Router } from '@angular/router';

import { easeOut } from '../../../assets/animations/easeOut';
import {AuthService, PrivateUserInfo} from '../../services/auth.service';
import { ip, id42 } from '../../../main';
import { NotificationService, Notification } from '../../services/notificationService';

@Component({
    selector: 'app-register',
    animations: [easeOut],
    templateUrl: './register.component.html',
    styleUrl: './register.component.css'
})
export class RegisterComponent {
    user = {
        username: '',
        password: '',
        email: ''
    };
    privacyText: boolean = false;
    privacyAccepted: boolean = false;

    usernameUsed: boolean = false;
    formSent: boolean = false;
    internalError: boolean = false;

    success: boolean = false;
    error: boolean = false;

    constructor(private authService : AuthService, private router: Router, private notificaction : NotificationService) {}

    ngOnInit() {
        this.authService.subscribe({
            next: (userInfo : PrivateUserInfo) => {
                if (userInfo) {
                    this.router.navigate(['/']);
                }
            }
        })
    }

    register42Api() {
        window.location.href = `https://api.intra.42.fr/oauth/authorize?client_id=${id42}&redirect_uri=https%3A%2F%2F${ip}%3A1501&response_type=code&state=register`;
    }

    registerAcc() {
        this.error = false;
        this.formSent = true;
        this.authService.registerAcc(this.user.username, this.user.password, this.user.email).subscribe({
            next: () => {
                this.error = false;
                this.success = true;
                this.formSent = false;
            },
            error: (error) => {
                this.error = true;
                this.success = false;
                this.formSent = false;
                const errorMsg = error.error.message;
                if (errorMsg.includes("already exists")) { //El nombre de usuario ya está en uso
                    this.usernameUsed = true;
                } else if (errorMsg.includes("invalid form")) { // Error interno
                    this.internalError = true;
                } else { // Error interno
                    this.internalError = true;
                }
            }
        })
    }

    togglePrivacy(event: Event) {
        this.privacyAccepted = (event.target as HTMLInputElement).checked;
    }

    closePrivacy() {
        setTimeout(() => {
            this.privacyText = false;
        }, 700);
    }
}
