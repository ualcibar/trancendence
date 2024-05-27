STRUCTURE
    Match, OnlineMatch and Tournament use composition (these are not classes, at least for now)

          ┌ MatchSettings
    Match ├ MapSettings
          └ MatchUpdate
                                        
                ┌ OnlineMatchSettings ─ MatchSettings 
    OnlineMatch ├ MapSettings 
                └ MatchUpdate   
    
               ┌ TourenamentSettings ─ MatchSettings
    Tournament ├ MapSettings
               └ MatchUpdate

    
    these are the main components each need to work, by making a generator for each component they can be reused

GAME
    to create a functional game there are some steps that must be taken
        - First, fill a match settings and choose a map
        - Second, get the map settings related to that map
        - Third, usings both match settings and mapsettings create the initial state of matchupdate
    with these three compoenents pong can start a game. Each manager however will require aditional information


COMPONENTS
    Match Settings:
        Describes the settings that can be applied to every match, regardless of map:
            - match duration
            - max score
            - score to win
            - team sizes
            - ...
    
    Map Settings:
        Describes the map with everything that it entails:
            - ball
            - paddles
            - blocks
            - ...
        you can change their properties and functionality, add behaviour etc
    
    MatchUpdate:
        The current 'state' of the match, not the MatchState. This describes current properties
        of all the gameObjects, the score, the id of the update etc:
            - balls
            - paddles
            - blocks
            - score
            - id
    
    OnlineMatchSettings
        Describes the settings both for the underlaying match, as well as some online specific settings:
            - match settings
            - name
            - tags
            - public
        this are set at creation, and is the class most components will deal with when interacting with online matches
    
    OnlineMatchInfo
        Describes an online match that is currently happening, it contains settings andinformation that is match execution sensitive:
            - online match settings
            - host
            - players
    
    TournamentSettings
        Describes the settings for both the matches that will be played as well as the tournament in general:
            - match settings
            - number of players
            - //name for each player or group?
            - //modifiers to the match settings? random map?




