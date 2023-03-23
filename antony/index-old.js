var SUPABASE_URL = 'https://fcjythdravzmdxoajrwe.supabase.co'
var SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZjanl0aGRyYXZ6bWR4b2FqcndlIiwicm9sZSI6ImFub24iLCJpYXQiOjE2Nzg5MTMyMTMsImV4cCI6MTk5NDQ4OTIxM30.xwAQZdI-s6Ha4ce5Qky8BRDAB-ItneU6Xfw9Ci6s2jA'
var supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

var OPENAI_API_KEY = "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";

let discution = [];

class Message {
    constructor(id, sender, date, content) {
        this.id = id;
        this.sender = sender;
        this.date = date;
        this.content = content;
    }
}

class GPT_CHAT {
    constructor(prompt) {
        this.method = 'POST';
        this.headers = {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + OPENAI_API_KEY
        };
        this.body = JSON.stringify({
            model: 'gpt-3.5-turbo',
            messages: [{ role: 'user', content: prompt }]
        });
    }
}


function showMessage(message) {

    const chatbox = document.querySelector('.chatbox');

    const span = document.createElement('span');

    span.classList.add('message');

    span.id = message.id;

    const senderDiv = document.createElement('div');

    let senderNameDiv;

    span.classList.add(message.sender + '_message');
    senderNameDiv = document.createTextNode(message.sender + ' : ');

    const bold = document.createElement('b');
    bold.appendChild(senderNameDiv);

    const timestamp = document.createElement('span');
    timestamp.classList.add('timestamp');
    timestamp.textContent = message.date;

    senderDiv.appendChild(bold);
    senderDiv.appendChild(timestamp);

    const contentDiv = document.createElement('div');

    const theContent = document.createTextNode(message.content);
    contentDiv.classList.add('message_content');
    contentDiv.appendChild(theContent);

    span.appendChild(senderDiv);
    span.appendChild(contentDiv);

    chatbox.appendChild(span);

    chatbox.scrollTop = chatbox.scrollHeight;
}

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

function showDiscution(discution) {

    discution.forEach(message => {
        showMessage(message)
    });
}

function cleanDiscution() {

    discution = [];

    const chatbox = document.querySelector('.chatbox');

    while (chatbox.firstChild) {
        chatbox.removeChild(chatbox.firstChild);
    }
}

async function getLastMessage() {
    const { data, error } = await supabase.from('messages').select();

    if (data[data.length - 1].is_user_msg) {
        return new Message(data[data.length - 1].id, "human", data[data.length - 1].created_at, data[data.length - 1].content);
    }
    else {
        return new Message(data[data.length - 1].id, "bot", data[data.length - 1].created_at, data[data.length - 1].content);
    }
}

async function showLastMessage() {

    let message = await getLastMessage();
    await showMessage(message);
}

async function sendUserMessage() {

    const prompt = document.querySelector(".prompt");

    const { error } = await supabase.from('messages').insert({ chatroom_id: 1, content: prompt.value, is_user_msg: true });

    showLastMessage();

    askChatGPT(prompt.value);

    let i = 0
    var t = setInterval(async () => {

        showLoader();

        let message = await getLastMessage();

        if (i >= 50) {
            showMessage(new Message(0, "error", new Date(), "Pas de réponse de ChatGPT"));
            hideLoader();
            clearInterval(t);
        }

        if (message.sender == 'bot') {
            showMessage(message);
            hideLoader();
            clearInterval(t);
        }

        i++;
    }, 500);

}

async function sendChatGPTMessage(prompt){
    console.log(prompt);
    const { error } = await supabase.from('messages').insert({ chatroom_id: 1, content: prompt, is_user_msg: false });
}

function showLoader() {
    const chatbox = document.querySelector('.chatbox');
    chatbox.style.backgroundColor = "yellow";
}

function hideLoader() {
    const chatbox = document.querySelector('.chatbox');
    chatbox.style.backgroundColor = "white";
}

async function getDiscution() {

    const { data, error } = await supabase.from('messages').select();

    for (let index = 0; index < data.length; index++) {
        if (data[index].is_user_msg) {
            discution.push(new Message(data[index].id, "human", data[index].created_at, data[index].content));
        }
        else {
            discution.push(new Message(data[index].id, "bot", data[index].created_at, data[index].content));
        }
    }

    showDiscution(discution);

}

getDiscution();

function askChatGPT(prompt){

    var response;

    fetch('https://api.openai.com/v1/chat/completions', new GPT_CHAT(prompt))
    .then(response => response.json())
    .then(data => {
        sendChatGPTMessage(data.choices[0].message.content)
    })
    .catch(error => console.error(error));
}
