import React from "react";
import ReactDOM from "react-dom";
// import UserService from '../../user.service';
import Helpers from '../../helper';
import SocketService from '../../socket.service';

class MessageBox extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
        opened: false
    };
  }
  componentDidMount() {
    //subscribe
  }

  render(data) {

    const listItems = this.props.messages.map((item, i) =>{
      let time = Helpers.getDateByFormat('hh:mm:ss');
      return (
        <li key={i} className="new-message"><p>{item.name}<span className="date">{time}</span></p> <span>{item.msg}</span></li>
      )
    });

    return (
      <ul id="messages" className="messages">    
         {listItems}
      </ul>
    ) 
  }
}


class Chat extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
        opened: false,
        messages: [],
        message: ''
    };
    this.myRef = React.createRef();

    this.toggle = this.toggle.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.keyUp = this.keyUp.bind(this);
  }

  handleChange(e) {
     this.setState({message: e.target.value.trim()});
  }

  keyUp(event) {
     event.preventDefault();
    if (event.key == 'Enter' &&  this.state.message){
        // SocketService.socket.emit('chat message', { msg: this.state.message, name: UserService.user.value ? UserService.user.value.playerName : 'new user' });
        this.setState({message: ''});
   
        return false;
    }
  }

  componentDidMount() {
    var self = this;

    SocketService.socket.on('chat message', function(data) {
        let a = self.state.messages.slice();
        a.push(data);
        self.setState({
          messages: a
        });

        self.myRef.current.scrollTop = self.myRef.current.scrollHeight;
    });

  }
  
  toggle() {
    this.setState({
      opened: !this.state.opened
    });
  }

  render() {
    var classes = this.state.opened ? ['chatRoom'] : ['chatRoom', 'closed'] 

    return (
      <div className={classes.join(' ')}>
        <span className="close-chat" onClick={this.toggle}></span>
        <div className="chat-menu" ref={this.myRef}>
          <MessageBox messages={this.state.messages}/>
        </div>
        <textarea value={this.state.message} onChange={this.handleChange}  onKeyUp={this.keyUp}></textarea>
      </div> 
    );
  }
}

export default Chat;