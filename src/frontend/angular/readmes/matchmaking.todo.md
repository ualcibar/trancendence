host leave match 
failed to join match
player failed to join
once match finishes store the match in history/ update stats

finish online match, currently it doesn't end. Easy
    -signal match end
    -save match in history
if a player disconnects wait for 5 secs for reconnection, if not and
    the team has still players connected turn player to bot.
    If not give win to the other team
    Only one chance to reconnect, if they leave again a bot takes their place inmediately
    really hard
        -pause system
        -set paddle to bot
        -recconection system with host
        -countdown

if a player leaves during match joining
    the place must be emptied so another player can take it. hard
        - update host and clients state
        - update database match preview model correctly