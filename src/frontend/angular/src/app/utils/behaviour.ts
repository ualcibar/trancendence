import { Vector2, Vector3 } from "three";

import { Manager, MatchState, MatchUpdate} from "../services/gameManager.service";
import { Ball, Block, GameObject, Paddle, PaddleState} from "../components/pong/pong.component";

import { MapSettings } from "../services/map.service";
import * as key from 'keymaster'; // Si estás utilizando TypeScript
import { Key } from "../services/gameManager.service";
/*export interface DefferedMonad<T> {
  bind(f : (delta : number, target : T) => void): this;
  run(delta : number, target : T) : void;
}*/

export interface Pos {
	pos: Vector2;
}

export interface Speed {
	speed: number;
}

export interface Dir {
	dir: Vector2;
}

export interface Angle {
	angle: number;
}

export interface Dimmensions {
	dimmensions: Vector3;
}

export interface PaddleI{
	state : PaddleState;
	updateAIprediction(delta: number): void;
}

export class TickBehaviour<T>  implements TickObject{
	private value: T;//a reference to the class we add the behaiviour to
	private functions: Array<(delta: number, target: T) => void>;//the transformations applied each tick

	constructor(value: T) {
		this.value = value;
		this.functions = new Array<(delta: number, target: T) => void>();
	}

	bindTick(f: (delta: number, target: T) => void): this {
		this.functions.push(f);
		return this;
	}

	runTick(delta: number): void {
		// console.log('running tick');
		// console.log('delta', delta);
		for(let i = 0; i < this.functions.length; i++)
			this.functions[i](delta, this.value)
//		this.functions.forEach(fn => fn(delta, this.value))
	}
}

export function tickBehaviourAccelerate(acceleration: number) { //example to give acceleration to an object
	return (delta: number, target: Speed) => {
		target.speed = acceleration * delta
	};
}

export enum PongEventType {
	MatchStart = 'match start',
	Pause = 'pause',
	Continue = 'continue',
	Reset = 'reset', //just to start another round, after use continue
	HardReset = 'hard reset', //this resets score and everything
	LocalHit = 'local hit',
	Colision = 'colision',
	Score = 'score',
	IAPrediction = 'ia prediction',
	Finish = 'Finish'
}

export class EventBehaviour<T extends GameObject> implements EventObject{
//	private id!: number;//we will set this id when we subscribeToManager, at the init values
	private parent: T;//parent now holds id
	private events: Array<(type: PongEventType, data : EventData, parent : T) => void>;
	private manager!: Manager;

	constructor(parent: T, manager : Manager) {
		this.parent = parent;
		this.events = new Array<() => void>;
		//this.manager = manager;
		//this.id = this.manager.subscribeEventObject(this);
	}

	bindEvent(f: (event: PongEventType, data : EventData) => void): this {
		this.events.push(f);
		return this;
	}
	runEvent(type: PongEventType,  data : EventData) {
		for (let i = 0; i < this.events.length; i++)
			this.events[i](type, data, this.parent)
		//this.events.forEach(eventF => eventF(type, data, this.parent));
	}
	subscribeToManager(manger : Manager): void {
		this.manager = manger;
		this.manager.subscribeEventObject(this, this.parent.getId());
	}
	getId(): number {
		return this.parent.getId();
	}
}

export interface EventObject {
	runEvent(type: PongEventType, data : EventData): void;
	subscribeToManager(manger : Manager) : void;
	getId() : number;
	bindEvent(fn : any) : EventObject;
}
export interface TickObject {
	runTick(delta : number): void;
	bindTick(fn : any) : TickObject;
}

export interface EventData{
	senderId? : number | undefined;
	targetIds? : number | number[] | undefined;
	broadcast? : boolean;
	custom? : {gameObjects? : any, others? : any};
}

export function createEventScoreColision(manager : Manager, scoreBlock : Block, team : number){
	return function eventScoreColision(type: PongEventType, data: EventData) {
		if (type !== PongEventType.Colision)
			return;	
		manager.broadcastEvent(PongEventType.Score, {senderId : scoreBlock.getId(), custom : {others : {team : team}}});
	}
}

export function eventEventWallColision(type: PongEventType, data: EventData) {
	if (type !== PongEventType.Colision)
		return;
	if (data.custom?.others.intersection === undefined && data.custom?.gameObjects.ball === undefined) {
		console.error('need intersection data for colision event');
		return;
	}
	console.log('colision event called to wall', data.custom.gameObjects.ball.getId(), data.custom.others.intersection, data.custom.gameObjects.ball.dir);
	const ball: Ball = data.custom.gameObjects.ball;
	const intersection: { pos: Vector2, normal: Vector2 } = data.custom.others.intersection;
	if (intersection.normal.x < 0 && ball.dir.x < 0)
		return;
	if (intersection.normal.x > 0 && ball.dir.x > 0)
		return;
	if (intersection.normal.y < 0 && ball.dir.y < 0)
		return;
	if (intersection.normal.y > 0 && ball.dir.y > 0)
		return;
	if (intersection.normal.x)
		ball.dir.x *= intersection.normal.x;
	if (intersection.normal.y)
		ball.dir.y *= -1;
}


export function createEventPaddleColision<T extends EventObject & Dimmensions & Pos>(map : MapSettings, paddle : T){
	return function eventPaddleColision(type: PongEventType, data: EventData) {	
		if (type !== PongEventType.Colision)
			return;
		if (data.custom?.others.objectintersection === undefined && data.custom?.gameObjects.ball === undefined) {
			console.error('need intersection data for colision event');
			return;
		}
		const ball: Ball = data.custom.gameObjects.ball;
		const intersection: { pos: Vector2, normal: Vector2 } = data.custom.others.intersection;

		if (intersection.normal.x < 0 && ball.dir.x < 0)// not reaally a colision then???
			return;
		if (intersection.normal.x > 0 && ball.dir.x > 0)
			return;
		if (intersection.normal.x) {
			//ball.dir.x *= -intersection[1][1].x;
			const angle = (intersection.pos.y - paddle.pos.y) / map.paddleHeight * 2 * intersection.normal.x;
			if (ball.dir.x > 0)
				ball.dir = new Vector2(-1, 0).rotateAround(new Vector2(0, 0), angle);
			else
				ball.dir = new Vector2(1, 0).rotateAround(new Vector2(0, 0), angle);
		}
	}
}

export interface updateAIprediction {
	updateAIprediction(delta: number): void;
}

export function createEventIAprediction<T extends updateAIprediction>(object : T){
	return function eventIAprediction(type: PongEventType, data: EventData) {
		if (type !== PongEventType.IAPrediction)
			return;
		console.log('updating prediction (event)');
		object.updateAIprediction(data.custom?.others?.prediction);
	}
}

export function createTickMove<T extends Pos & Speed & Dir>(object : T){
	return function move(delta: number) {
      object.pos.add(object.dir.clone().multiplyScalar(object.speed * delta));
	}
}

export function createTickMovePaddle<T extends Pos & Speed & Dir>(object : T){
	return function move(delta: number) {		
    	object.pos.add(object.dir.clone().multiplyScalar(object.speed * delta));
	}
}
// <<<<<<< HEAD
export function createPaddleUpdate(paddle: Paddle, manager : Manager) {
	let lastUpdateSec: number = 0;
	let prediction : number = 0;
	let update : MatchUpdate | undefined = undefined;
	return function paddleUpdate(delta: number) {
		// if (!update){
			update = manager.getMatchUpdate()
			//console.log('paddle satte paddle update', paddle.state)
		if (paddle.stateBinded) {
			//console.log('trying to move paddle')
			// console.log('paddle binded, handling keys', paddle);
			paddle.dir.y = 0;
			if (key.isPressed(paddle.upKey)) {
				console.log('paddle',paddle.id, 'moving up');
				paddle.dir.y = 1;
			}
			if (key.isPressed(paddle.downKey)) {
				paddle.dir.y = -1;
			}
		//	console.log('paddle', paddle.id, 'dir', paddle.dir.y);
		}else if(paddle.stateBot){
			console.log('BOT ACTIVE')
			lastUpdateSec += delta;
			if (lastUpdateSec >= 1){
				lastUpdateSec = 0;
				console.log('updating prediction', lastUpdateSec);
				console.log('padddle', paddle);
				console.log('paddle pos', paddle.pos);
				prediction = update.getAiPrediction(paddle);
			}
			paddle.handleIA(prediction);
// =======
// export function createTickKeyboardInputPaddle<T extends Pos & Speed & Dir & PaddleI>(paddle : T, keys : Key ){
// 	let lastAiUpdateSec : number = 0;
// 	return function keyboardInputPaddle(delta: number) {
// 		if (paddle.state === PaddleState.Binded) {
// 			paddle.dir.y = 0;
// 			if (key.isPressed(keys.up)) {
// 				paddle.dir.y = 1;
// 			}
// 			if (key.isPressed(keys.down)) {
// 				paddle.dir.y = -1;
// 			}

// 		}else if (paddle.state === PaddleState.Bot){
// 			if (lastAiUpdateSec >= 1){
// 				paddle.updateAIprediction(delta)
// 				lastAiUpdateSec = 0;
// 			}else
// 				lastAiUpdateSec += delta
// >>>>>>> origin/main
		}
	}
}

export interface HandleKeys {
	handleKeys(): void;
}

/*export function createTickKeyboardInputPaddle<T extends HandleKeys>(paddle : T, keys : Key ){
	return function keyboardInputPaddle(delta: number) {
		paddle.handleKeys();
	}
}*/

export interface update {
	update(delta: number): void;
}

export function createTickUpdate<T extends update>(object : T, getState: () => MatchState){
	return function update(delta: number) {
		if (getState() === MatchState.Paused)
			return;
		// console.log('updating object', object);
		// console.log('delta', delta);
		object.update(delta);
	}
}

export interface pause {
	pause(): void;
}

export function createTickPause<T extends pause>(object : T){
	return function pause() {
		object.pause();
	}
}