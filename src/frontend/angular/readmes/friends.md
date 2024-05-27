updateFriendList(){
    if (!this.user_info){
      this.logger.error('update user info: userinfo is undefined')
      return
    }
    const backendURL = `api/polls/friends/${this.user_info.user_id}/`;
    this.http.get<any>(backendURL, { withCredentials: true }).subscribe({
      next: (response) => {
        this.logger.info('response friend list', response);
      },
      error: () => {
        this.user_info = undefined;
        this.logger.error('update friend list: error fetching data')
      }
    });
  }
  addFriend(){
    if (!this.user_info){
      this.logger.error('update user info: userinfo is undefined')
      return
    }
    const backendURL = `api/polls/friends/${this.user_info.user_id}/`;
    const jsonToSend = {
      usernames : ['tomate']
    };
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json'
      })
    };
    this.http.post<any>(backendURL, jsonToSend).subscribe({
      next: (response) => {
        this.logger.info('response friend list', response);
      },
      error: () => {
        this.user_info = undefined;
        this.logger.error('update friend list: error fetching data')
      }
    });
  }

