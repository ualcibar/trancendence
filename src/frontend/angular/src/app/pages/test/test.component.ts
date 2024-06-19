import { Component, OnInit } from '@angular/core';

import { ChatComponent } from '../../components/chat/chat.component';
import {LobbySearchComponent} from '../../components/lobby-search/lobby-search.component';
import { LobbyMatchComponent } from '../../components/lobby-match/lobby-match.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-test',
  standalone: true,
  imports: [ChatComponent, LobbySearchComponent, CommonModule, LobbyMatchComponent],
  templateUrl: './test.component.html',
  styleUrl: './test.component.css'
})
export class TestComponent {
    active : string = "lobby-match";
    constructor() { }
    ngOnInit(): void {
    }
    toggleActive(){
        if (this.active == 'lobby-search')
            this.active = 'lobby-match';
        else if (this.active == 'lobby-match')
            this.active = 'chat';
        else
            this.active = 'lobby-search';
    }
}
