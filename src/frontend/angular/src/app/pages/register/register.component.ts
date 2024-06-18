import { Component } from '@angular/core';
import { Router } from '@angular/router';

import { easeOut } from '../../../assets/animations/easeOut';
import {AuthService, PrivateUserInfo} from '../../services/auth.service';
import { ip } from '../../../main';

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
    usernameUsed: boolean = false;
    formSent: boolean = false;
    internalError: boolean = false;

    success: boolean = false;
    error: boolean = false;

    constructor(private authService : AuthService, private router: Router) {}

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
        window.location.href = `https://api.intra.42.fr/oauth/authorize?client_id=u-s4t2ud-8aae85ebafbe4fc02b48f3c831107662074a15fe99a907cac148d3e42db1cd87&redirect_uri=https%3A%2F%2F${ip}%3A1501&response_type=code&state=register`;
    }

    registerAcc() {
        this.formSent = true;
        this.authService.registerAcc(this.user.username, this.user.password, this.user.email).subscribe({
            next: () => {
                this.error = false;
                this.success = true;
                this.formSent = false;
                },
            error: (error) => {
                this.success = false;
                const errorMsg = error.error.message;
                if (errorMsg.includes("already exists")) { //El nombre de usuario ya está en uso
                    this.usernameUsed = true;
                } else if (errorMsg.includes("Internal Server Error")) { // Error interno
                    this.internalError = true;
                }
                this.error = true;
                this.formSent = false;
            }
        })
    }
}
