GAMEMANAGER
    The game manager will run all the logic backend, handle event behaviour,
    etc. It holds the original game update and settings and is the ground truth
    of what the game should be rendering.

    There are four game managers, gameManager, OnlineMatchManager, TournamentManager.
    The first is the service and the one other components can call to start matches
    and tournaments. Each one implements Manager, which are the entrie points needed for
    the pong game, however each one may handle store the data however they need. Their event
    loops can be customized to add custom logic, online or tournaments

PONG
    The game works with three main objects. Ball, Paddle, Block.
    The ball array is just that.
    The paddle array is an array containing all the paddles, in this will be their State
    this tells the game which logic to use on them. Binded(local), unbinded, BOT(AI).
    The Block is everything else that you want your ball and paddles to interact with. There
    are three mayor types: Colision, Score, Death. Colision is for phisics, Score for points,
    death for point reduction. This however is abstracted out of the pong game, and is to be used
    be the behaviour binded functions, so more may be added. They may also shift from one another,
    they are not static.

BEHAVIOUR
    This encompases the logic of the game, there are two types: tick and event.
        Tick:
            behaviour are attached to objects that implement TickObject, you can bind functions to be
            executed every tick. The entrypoint runTick will run all the tickBehaviours
        Event:
            you can bind functions to objects that implement EventObject, this functions are binded to a
            event type(enum). The entrypoint runEvent will run all event behaviours, even if their eventType
            is different. This must be check in each behaviour individually.

            You can broadcast an event at anymoment so long as the game is running and you have a manager
            instance. call broadcastEvent(eventType, eventData) and the manager run the event behaviour
            of everyobject that has been Subscribed to itself and that has at least one event of the same type.

            You can send a event to another gameObject that implements EventObject, by asking for their id (getId)
            and settings it in the eventData.targetIds. targetsIds can be a single id or an array of Id, if you wish
            to send the event to more than one object but not broadcast it.

            EventData
                whenever you want to trigger an event you must pass fill a EventData interface that has three values
                    senderId : number => the id of whoever started the event,
                    targetIds : number | number[] => the id/ids of whoever u want to send the event to
                    broadcast => boolean => if this event was broadcasted. You must manually set it.
                    custom : any, you can attach any data that you may need for the event here
                
                all the fields are optional Ex:
                {
                    senderId : 0,
                    targetsIds : 1,
                }
                {
                    custom : {
                        ball : this.ball,
                    }
                }
                {}//empty no data
                its flexible to allow most cases

            all tick objects are subscribed to the manager at the begging to the match automatically


BEHAVIOURS
    this are functions that can be called for both event and tick

    Event
        All event functions start with event. if you have a function that builds a function then it starts with
        createEvent...
        You receive two values the type and the data, it returns void
        Ex
        function eventName(PongTypeEvent, EventData) : void{...}
        function createEventName(custom){
            return function eventName(PongTypeEvent, EventData) : void{...}
        }
        By wrapping the function with parameters, you can have the 'same' behaviour for many objects but each with
        some differences
        //example at tick
        to bind to the EventObject just use .bind(eventName) and it will be binded you may concadenate
        object.bind(eventName1)
              .bind(eventName2)
              .bind(eventName3);
        they will be executed in that order
    
    Tick
        All tick functions start with tick. if you have a function that builds a function then it starts with
        createTick...
        You recieve one value delta, this is the time elapsed in seconds
        Ex
        function tickName(delta : number) : void{...}
        function createTickName(custom){
            return function eventName(delta : number) : void{...}
        }
        By wrapping the function with parameters, you can have the 'same' behaviour for many objects but each with
        some differences
        function createTickMove<T extends Pos & Dir & Speed>(object : T){
            return tickMove(delta : number) : number{
                object.pos.add(object.dir.clone().multiplyScalar(object.speed * delta));
            }
        }
        This is the simplest but you should be able to figure out the power of encapsulating behaviour functions
        with this.
        <T extends Pos & Dir & Speed>
        in behaviour there are some interfaces that may be used by more objects than one objects, and it allows to
        abstract those object reducing the number of repeated functions. in this case for speed you only need
        to implement Pos {pos : Vector2}, Dir{dir : Vector2}, Speed {speed : number}. Meaning that you can pass
        this behaviour creation function any object that implements those fields, ball, paddle and block all have it.
