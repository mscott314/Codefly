let form = document.getElementById('form');
form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // document.getElementById('count').textContent = 200;
    let formData = new FormData(form);  // create object with form data to send to server
    let chat = document.getElementById('chat'); // inner div that holds the chat bubbles

    let userChat = document.createElement('div');   // Create the userchat div after form submission.
    userChat.setAttribute('class', 'userChat');
    let userChatText = document.createTextNode(String(formData.get('send')));    // get the text value from input form and create bubble

    userChat.appendChild(userChatText); // add the text node to the userChat div
    chat.appendChild(userChat); // add the userchat div (chat bubble) to the chat div

    chat.scrollTop = chat.scrollHeight;
    // userChat.scrollIntoView(true);  // make the chat window scroll to this new div

    await fetch('/send/', {
        method: 'post',
        body: formData
    })
        .then(response => response.text())    // take the response from fetch, and convert it to .json() or .text()
        .then(text => {
            let robotChat = document.createElement('div');  // create the bots chat bubble (div)
            robotChat.classList.add('robotChat');   // add the css to it

            // let robotChatText = document.createTextNode(text);// add the text to the chat from the json response
            let robotChatText = document.createTextNode(robotChat.innerHTML = text)
            // robotChat.appendChild(robotChatText);   // add the text to the robot chat bubble
            chat.appendChild(robotChat);    // add the robots chat bubble to the chat window

            chat.scrollTop = chat.scrollHeight;
            // robotChat.scrollIntoView({behavior: 'smooth'}); // move the chat window to the new div
        });
    form.reset();
});