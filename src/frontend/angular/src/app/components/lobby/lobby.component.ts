import { Component } from '@angular/core';

@Component({
  selector: 'app-lobby',
  standalone: true,
  imports: [],
  templateUrl: './lobby.component.html',
  styleUrl: './lobby.component.css'
})
export class LobbyComponent {
  users : string[] = [];
  socket: WebSocket | undefined;
  peerConnection : RTCPeerConnection;
  pc_config : RTCConfiguration;
  constructor(){
    this.pc_config = {
      iceServers : [
        {
          urls : "stun:stun.l.google.com:19302",
        }
      ],
    };
    this.peerConnection = new RTCPeerConnection(this.pc_config);
  }
  // Function to set up WebSocket connection
  setupWebSocket(url: string): void {
    this.socket = new WebSocket(url);

    this.socket.onopen = () => {
      console.log('WebSocket connected');
    };

    this.socket.onmessage = (event) => {
      console.log('Message received:', event.data);
    };

    this.socket.onclose = () => {
      console.log('WebSocket disconnected');
    };
  }

  // Function to set up RTCPeerConnection
  setupPeerConnection(): void {
    // Add event listeners and configure RTCPeerConnection as needed
  }
}
