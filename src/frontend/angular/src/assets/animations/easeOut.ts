import { trigger, style, transition, animate } from '@angular/animations';

export const easeOut = trigger (
    'easeOut', [
        transition(':enter', [
            style({transform: 'cubic-bezier(0, 0, 0.2, 1)', opacity: 0}),
            animate('200ms', style({transform: 'translateX(0)', opacity: 1}))
        ]),
        transition(':leave', [
            style({transform: 'cubic-bezier(0, 0, 0.2, 1)', opacity: 1}),
            animate('200ms', style({transform: 'cubic-bezier(0, 0, 0.2, 1)', opacity: 0}))
        ])
    ]
);