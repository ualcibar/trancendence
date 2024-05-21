import {PongEventType, EventObject } from "./behaviour";

export class EventMap {
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

}
