import { Component, Output, Input, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { TournamentSettings } from '../../services/gameManager.service';
import { MatchGeneratorComponent } from '../match-generator/match-generator-component';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-tournament-generator-component',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatchGeneratorComponent, TranslateModule
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

  changeTeamSize(size : number){
    console.log('new team size', size)
    if (this.settings.teamNames.length === size)
      return;
    else if (this.settings.teamNames.length >= size)
      this.settings.teamNames = this.settings.teamNames.splice(0,size)
    else{
      for (let i = this.settings.teamNames.length; i < size; i += 1)
        this.settings.teamNames.push(`team${i + 1}`)
    }
  } 
  onBlur() { 
    this.escapeKeyPressed.emit();
  }

  onKeyPress(event : any) {
    if (event.key === "Escape") {
      this.escapeKeyPressed.emit();
    }
  }

  /* onNumberOfPlayersChange(event: Event) {
    const selectElement = event.target as HTMLSelectElement;
    const newNumberOfPlayers = parseInt(selectElement.value, 10);
    console.log('new number of players', newNumberOfPlayers);
    this.settings.numberOfPlayers = newNumberOfPlayers;
    this.changeTeamSize(newNumberOfPlayers);
  } */

  onNumberOfPlayersChange(numPlayers: number) {
    console.log('new number of players', numPlayers);
    this.settings.numberOfPlayers = numPlayers;
    this.changeTeamSize(numPlayers);
  }

  trackByFn(index: number, item: string) {
    return index;
  }
}
