import { Component, Output, Input, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { TournamentSettings } from '../../services/gameManager.service';
import { MatchGeneratorComponent } from '../match-generator/match-generator-component';

@Component({
  selector: 'app-tournament-generator-component',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatchGeneratorComponent
  ],
  templateUrl: './tournament-generator-component.html',
  styleUrl: './tournament-generator-component.css'
})
export class TournamentGeneratorComponent {
  default : boolean = true;
  @Input() settings! : TournamentSettings;
  @Output() escapeKeyPressed: EventEmitter<void> = new EventEmitter<void>();  

  constructor(){ 
  } 
  toggleDefault(){
    this.default = !this.default;
  }
   
  onBlur() { 
    this.escapeKeyPressed.emit();
  }

  onKeyPress(event : any) {
    if (event.key === "Escape") {
      this.escapeKeyPressed.emit();
    }
  }
}
