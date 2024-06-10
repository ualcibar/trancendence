import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';

import { easeOut } from '../../../assets/animations/easeOut';
import { AuthService } from '../../services/auth.service';

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

    constructor(private authService : AuthService) {}

    register42Api() {
        window.location.href = 'https://api.intra.42.fr/oauth/authorize?client_id=u-s4t2ud-8aae85ebafbe4fc02b48f3c831107662074a15fe99a907cac148d3e42db1cd87&redirect_uri=http%3A%2F%2Flocalhost%3A4200&response_type=code&state=register';
    }

    registerAcc() {
<<<<<<< HEAD
        this.formSent = true;
        const backendURL = '/api/polls/register/';
            const jsonToSend = {
            username: this.user.username,
            password: this.user.password,
            email: this.user.email
        };

        const httpOptions = {
            headers: new HttpHeaders({
                'Content-Type' : 'application/json'
            }),
        };

        this.http.post<any>(backendURL, jsonToSend, httpOptions).subscribe({
            next: () => {
                this.error = false;
                this.success = true;
                this.formSent = false;
                setTimeout(() => {
                    this.router.navigate(['/login']);
                }, 3000);
            },
            error: (error) => {
                this.success = false;
                console.error('An error ocurred registering this account:', error.message);
                const errorMsg = error.error.message;
                if (errorMsg.includes("already exists")) { //El nombre de usuario ya está en uso
                    this.usernameUsed = true;
                } else if (errorMsg.includes("internal server error")) { //Error interno
                    this.internalError = true;
                }
                this.error = true;
                this.formSent = false;
            }
        })
=======
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
>>>>>>> origin/main
    }
}
