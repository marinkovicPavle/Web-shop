if(window.location.pathname == '/chat'){

// Make connection
var socket = io.connect('http://localhost:3000');

// Query DOM
var message = document.getElementById('message'),
      handle = document.getElementById('handle'),
      btn = document.getElementById('send'),
      output = document.getElementById('output'),
      feedback = document.getElementById('feedback'),
      clearBtn = document.getElementById('clear');

// Handle Output
socket.on('outputt', function(data){
    //console.log(data);
    if(data.length){
        for(var x = 0;x < data.length;x++){
            // Build out message div
            var message = document.createElement('div');
            message.setAttribute('class', 'chat-message');
            message.textContent = data[x].handle+": "+data[x].message;
            messages.appendChild(message);
            messages.insertBefore(message, output.firstChild);
        }
    }
});

// Emit events
btn.addEventListener('click', function(){
    socket.emit('chat', {
        message: message.value,
        handle: handle.value
    });
    message.value = "";
});


message.addEventListener('keypress', function(){
    socket.emit('typing', handle.value);
})

message.addEventListener('focusout', function(){
    socket.emit('styping', handle.value);
})

// Listen for events
socket.on('chat', function(data){
    feedback.innerHTML = '';
    output.innerHTML += '<p><strong>' + data.handle + ': </strong>' + data.message + '</p>';
});

socket.on('typing', function(data){
    feedback.innerHTML = '<p><em>' + data + ' kuca poruku...</em></p>';
});

socket.on('styping', function(data){
    feedback.innerHTML = '<p></p>';
});

 // Handle Chat Clear
 clearBtn.addEventListener('click', function(){
    var result = confirm("Da li ste sigurni da zelite da obrisete prozor caskanja?");
    if (result) {
        socket.emit('clear');
    }
});
// Clear Message
socket.on('cleared', function(){
    output.innerHTML = '';
});
}