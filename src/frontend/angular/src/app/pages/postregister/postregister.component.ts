import { Component } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-postregister',
  standalone: true,
  imports: [TranslateModule],
  templateUrl: './postregister.component.html',
  styleUrl: './postregister.component.css'
})
export class PostregisterComponent {

  constructor(private router: Router) { }

  async to_login(){
    this.router.navigate(['/login']);
  }

}
