import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';

import { fadeInOut } from '../../../assets/animations/fadeInOut';
import { AuthService } from '../../services/auth.service';

@Component({
    selector: 'app-register',
    animations: [fadeInOut],
    templateUrl: './register.component.html',
    styleUrl: './register.component.css'
})
export class RegisterComponent {
    user = {
        username: '',
        password: '',
        email: ''
    };
    errorMessage: string = '';
    successMessage: string = '';

    constructor(private authService : AuthService) {}

    ngOnInit(): void {
    }

    register42Api() {
        window.location.href = 'https://api.intra.42.fr/oauth/authorize?client_id=u-s4t2ud-8aae85ebafbe4fc02b48f3c831107662074a15fe99a907cac148d3e42db1cd87&redirect_uri=http%3A%2F%2Flocalhost%3A4200&response_type=code&state=register';
    }

    registerAcc() {
        this.authService.registerAcc(this.user.username, this.user.password, this.user.email).subscribe(
            {
                next: (response) => {
                    this.successMessage = response.message;
                },
                error: (error) => {
                    console.error('An error ocurred registering this account component:', error.status);
                    this.errorMessage = error.error.reason;
                }
            })
    }
}
