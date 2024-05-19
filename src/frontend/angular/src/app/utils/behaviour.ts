import { Vector2 } from "three";
import { GameManager, MapSettings } from "../services/game-config.service";
import { Ball, Block} from "../pages/pong/pong.component";

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

export interface Dimmensions {
	dimmensions: Vector2;
}

export class TickBehaviour<T> {
	private value: T;//a reference to the class we add the behaiviour to
	private functions: Array<(delta: number, target: T) => void>;//the transformations applied each tick

	constructor(value: T) {
		this.value = value;
		this.functions = new Array<(delta: number, target: T) => void>();
	}

	bind(f: (delta: number, target: T) => void): this {
		this.functions.push(f);
		return this;
	}

	run(delta: number): void {
		this.functions.forEach(func => func(delta, this.value))
	}
}

export function tickBehaviourAccelerate(acceleration: number) { //example to give acceleration to an object
	return (delta: number, target: Speed) => {
		target.speed = acceleration * delta
	};
}

export enum PongEventType {
	MatchStart,
	Pause,
	Continue,
	LocalHit,
	Colision,
	Score,
}

export class EventBehaviour<T> implements EventObject{
	private id: number;
	private parent: T;
	private events: Array<(type: PongEventType, data : EventData, parent : T) => void>;
	private manager : GameManager;

	constructor(parent: T, manager : GameManager) {
		this.parent = parent;
		this.events = new Array<() => void>;
		this.manager = manager;
		this.id = this.manager.subscribeEventObject(this);
	}

	bind(f: (event: PongEventType, data : EventData) => void): this {
		this.events.push(f);
		return this;
	}
	runEvent(type: PongEventType,  data : EventData) {
		this.events.forEach(eventF => eventF(type, data, this.parent));
	}
	getId() : number{
		return this.id;
	}
}

export interface EventObject {
	runEvent(type: PongEventType, data : EventData): void;
	getId() : number;
}

export interface EventData{
	senderId? : number | undefined;
	targetIds? : number | number[] | undefined;
	broadcast? : boolean;
	custom? : any;
}

function createEventScoreColision(manager : GameManager, scoreBlock : Block){
	function eventScoreColision(type: PongEventType, data: EventData) {
		if (type !== PongEventType.Colision)
			return;
		
		manager.broadcastEvent(PongEventType.Score, {senderId : scoreBlock.getId()});
	}
}

function eventWallColision(type: PongEventType, data: EventData) {
	if (type !== PongEventType.Colision)
		return;
	if (data.custom?.intersection === undefined && data.custom?.ball === undefined) {
		console.error('need intersection data for colision event');
		return;
	}
	const ball: Ball = data.custom.ball;
	const intersection: { pos: Vector2, normal: Vector2 } = data.custom.intersection;
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


function createPaddleColision<T extends EventObject & Dimmensions & Pos>(map : MapSettings, paddle : T){
	return function eventPaddleColision(type: PongEventType, data: EventData) {
		if (type !== PongEventType.Colision)
			return;
		if (data.custom?.intersection === undefined && data.custom?.ball === undefined) {
			console.error('need intersection data for colision event');
			return;
		}
		const ball: Ball = data.custom.ball;
		const intersection: { pos: Vector2, normal: Vector2 } = data.custom.intersection;

		if (intersection.normal.x < 0 && ball.dir.x < 0)
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