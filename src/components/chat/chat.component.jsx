import React from "react";
import ReactDOM from "react-dom";

class MessageBox extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
        opened: false
    };

    // this.toggle = this.toggle.bind(this);
    // this.handleChange = this.handleChange.bind(this);
  }

  // createList () {
  //   var list = [];
  //   this.props.messages.forEach(message =>{
  //      list.push(<tr>123</tr>)
  //   });
  //   return list;
  // }
  // <li className="new-message">
  //     <p>{this.props.name}<span className="date">12.05.2015</span></p>
  //     <span>{this.props.msg}</span>
  // </li>



  render(data) {

    const listItems = this.props.messages.map((item, i) =>
      <li key={i} className="new-message"><p>{item.name}<span className="date">12.05.2015</span></p> <span>{item.msg}</span></li>
    );
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
        messages: []
    };

    this.toggle = this.toggle.bind(this);
    this.handleChange = this.handleChange.bind(this);
  }

  handleChange(e) {
    var key = e.which,
        message = $(e.currentTarget),
        messageValue = message.val();

        if (key == 13){
            if (messageValue) {
                socket.emit('chat message', { msg: messageValue, name: currentPlayer.playerName });
                message.val('');
            }
            return false;
        }
  }

  componentDidMount() {
    var self = this;
    // setInterval(()=>{
    //   socket.emit('chat message', { msg: 'Hello', name: 'Dean' });
    // }, 1000);

    socket.on('chat message', function(data) {
        let a = self.state.messages.slice();
        a.push(data);
        self.setState({
          messages: a
        });
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
        <div className="chat-menu">
          <MessageBox messages={this.state.messages}/>
        </div>
        <textarea onChange={this.handleChange}></textarea>
      </div> 
    );
  }
}

export default Chat;