import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})

export class HomeComponent implements OnInit{
    constructor(private route: ActivatedRoute) { }
    ngOnInit(): void {
        // Your initialization code here
        this.route.queryParams.subscribe(params => {
            const code = params['code']; // Extract authorization code from query parameters
            // Now you can use the authorization code to obtain an access token
            if (code) {
                // Handle the authorization code
                console.log('Authorization code:', code);
                
                // Proceed with token exchange or authentication process
            } else {
                // Handle the absence of authorization code
                console.log('Authorization code not found');
                // Handle error or redirect to an error page
            }
        });
    }
}

