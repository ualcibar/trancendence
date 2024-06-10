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

  onNumberOfPlayersChange(event : Event){
    console.log('event', event)
    const input = event.target as HTMLInputElement;
    const newValue = parseInt(input.value, 10);
    console.log('number', newValue)

    // Perform any validation or logic here before updating the value
    if (isNaN(newValue)){
      input.value = this.settings.numberOfPlayers.toString(); 
      return;
    }
    if (newValue < 2 || newValue > 12){
      input.value = this.settings.numberOfPlayers.toString(); 
      return;
    }
    if (newValue > this.settings.numberOfPlayers)
      for (let i = this.settings.numberOfPlayers; i < newValue; i++)
        this.settings.teamNames.push(`Team${i + 1}`)
    else if (newValue < this.settings.numberOfPlayers)
      this.settings.teamNames = this.settings.teamNames.slice(0,newValue)
    this.settings.numberOfPlayers = newValue;
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
