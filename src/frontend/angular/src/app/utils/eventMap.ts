import { GameObject } from "../components/pong/pong.component";
import {PongEventType, EventObject } from "./behaviour";

/*export class EventMap {
    private idToObject: Map<number, EventObject>;
    private typeToObjects: Map<PongEventType, number[]>;
    private nextId = 0;
    constructor() {
        this.idToObject = new Map<number, EventObject>();
        this.typeToObjects = new Map<PongEventType, number[]>();
    }

    bind(eventObject: EventObject): number { 
        const id = this.nextId
        this.idToObject.set(id, eventObject);
        this.nextId += 1;
        return id;
    }

    subscribe(id : number, type : PongEventType): boolean{
        if (this.idToObject.get(id) === undefined)
            return false;
        const events = this.typeToObjects.get(type);
        if (events)
            events.push(id);
        else
            this.typeToObjects.set(type, [id]);
        return true;
    }

    getByType(type : PongEventType) : EventObject[]{
       const ids = this.typeToObjects.get(type);
       if (!ids)
        return [];
       const eventObjects : EventObject[] = [];
       for (const id of ids.values()){
        const object = this.idToObject.get(id);
        if (object)
            eventObjects.push(object);
       }
       return eventObjects;
    }
    getById(id : number) : EventObject | undefined{
        return this.idToObject.get(id);
    }

}*/

export class GameObjectMap {
    private idToGameObject: Map<number, GameObject>;
    private idToEventObject: Map<number, EventObject>;
    private typeToEventObjects: Map<PongEventType, number[]>;
    private nextId = 0;
    constructor() {
        this.idToEventObject = new Map<number, EventObject>();
        this.idToGameObject = new Map<number, GameObject>();
        this.typeToEventObjects = new Map<PongEventType, number[]>();
    }
   
    subscribeGameObject(object : GameObject) : number{
        const id = this.nextId
        this.idToGameObject.set(id, object);
        this.nextId += 1;
        return id;
    }
    
    subscribeEventObject(eventObject: EventObject, id : number){ 
        this.idToEventObject.set(id, eventObject);
    }

    bind(type : PongEventType, id : number) : boolean{
        if (this.idToEventObject.get(id) === undefined){
            return false;
        }
        const events = this.typeToEventObjects.get(type);
        if (events)
            events.push(id);
        else
            this.typeToEventObjects.set(type, [id]);
        return true;
    }

    getEventObjectsByType(type : PongEventType) : EventObject[]{
       const ids = this.typeToEventObjects.get(type);
       if (!ids)
        return [];
       const eventObjects : EventObject[] = [];
       for (const id of ids.values()){
        const object = this.idToEventObject.get(id);
        if (object)
            eventObjects.push(object);
       }
       return eventObjects;
    }

    getGameObjectById(id : number) : GameObject | undefined{
        return this.idToGameObject.get(id);
    }

    getEventObjectById(id : number) : EventObject | undefined{
        return this.idToEventObject.get(id);
    }

}
