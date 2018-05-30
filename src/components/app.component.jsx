import React from "react";
import Chat from './chat/chat.component.jsx';

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      username: '',
      getReady: false
    };

    this.startClick = this.startClick.bind(this);
    this.handleChange = this.handleChange.bind(this);
  }

  startClick() {
    var playerOptions = {};

    if (!this.state.username.length) {
        alert('Please enter your name');
        return;
    }

    this.setState({
      getReady: true
    });

    playerOptions.name = this.state.username;

    socketIoInit(playerOptions);
    socket.emit('add new player', playerOptions);
  }

  handleChange(event) {
    this.setState({username: event.target.value});
  }
 
  render() {
    return (
      <div>      
        { !this.state.getReady ? (
          <div className="start-page">
            <div className="overlay"></div>
            <div className="popup">
              <div className="popup__content">
                 <label> Username</label>
                 <input type="text" value={this.state.username} onChange={this.handleChange}/>
                 <button onClick={this.startClick} className="btn">START</button>
              </div>
            </div> 
          </div>
          ) : <Chat/>
        }

        <div className="sidebar dark">
          <div id="users">
            <span className="title"> Online:</span>
            <ul></ul>
          </div>
        </div>
          
        <div className="version dark">alpha 0.03</div>

        <div id="info">Controls - > WASD/RF/QE + mouse </div>
        <div id="position"></div>
        <div id="rotation"></div>
      </div>
    );
  }
}

export default App;