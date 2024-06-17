import { Component } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-unauthorized',
  standalone: true,
  imports: [TranslateModule],
  templateUrl: './unauthorized.component.html',
  styleUrl: '../not-found/not-found.component.css'
})
export class UnauthorizedComponent {

}
