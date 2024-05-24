import { trigger, state, style, transition, animate } from '@angular/animations';

export const fadeInOuttimeout : number = 0;
// Define a reusable fadeInOut animation
export const fadeInOut = trigger('fadeInOut', [
  state('void', style({ opacity: 0, transform: 'scale(0.9)' })), // Initial state for enter transition
  state('*', style({ opacity: 1, transform: 'scale(1)' })), // Final state for enter transition
  transition(':enter, :leave', animate(`${fadeInOuttimeout}s ease`)), // Animation for enter and leave transitions
]);