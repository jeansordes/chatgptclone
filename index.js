// Messages types
var [USER, ASSISTANT, SYSTEM] = ['user', 'assistant', 'system'];
var userTypes = [USER, ASSISTANT, SYSTEM];
var messageClasses = {
	[USER]: "user-msg",
	[ASSISTANT]: "assistant-msg",
	[SYSTEM]: "system-msg",
};
var domTemplateQuerySelector = {
	[USER]: "#user-msg-template",
	[ASSISTANT]: "#assistant-msg-template",
	[SYSTEM]: "#system-msg-template",
}

// Variables
var OPENAI_API_KEY;
var messagesDOM = document.querySelector("#messages");
var userInputDOM = document.querySelector("#user-input");
var appSettingsFormDOM = document.querySelector('#app-settings-form');
var userInputFormDOM = document.querySelector("#user-input-form");
var openAIKeyInputDOM = document.querySelector("#openai_key");
var messages = [];

// functions
var LStorage = {
	saveMsgs: (msgs) => {
		localStorage.setItem("discussion", JSON.stringify(msgs));
	},
	retrieveMsgs: () => {
		const tmp = JSON.parse(localStorage.getItem("discussion"));
		return tmp ? tmp : [];
	},
	clearMsgs: () => {
		localStorage.removeItem("discussion");
	},
}

const loader = {
	show: () => document.querySelector('#loader').classList.remove('d-none'),
	hide: () => document.querySelector('#loader').classList.add('d-none'),
}

async function userInputSubmit(e) {
	console.log("User input submit");
	if (e) e.preventDefault();
	let userInput = userInputDOM.value;
	userInputDOM.value = '';
	setTimeout(() => userInputDOM.value = '', 200);

	// register user input
	addMsgToLStorageAndDOM(USER, userInput);

	// send the message
	loader.show();
	let { error, response } = await sendDiscussionToOpenAI(userInput);

	if (error) {
		addMsgToLStorageAndDOM(SYSTEM, error);
	} else {
		addMsgToLStorageAndDOM(ASSISTANT, response);
	}

	loader.hide();
}

function addMsgToLStorageAndDOM(role, content) {
	if (userTypes.includes(role)) {
		// LStorage
		messages.push({ role, content });
		LStorage.saveMsgs(messages);

		// DOM
		addMsgToDOM(role, content)
	} else {
		alert("Unknown role provided");
	}
}

function addMsgToDOM(role, content) {
	if (userTypes.includes(role)) {
		let msgRender = document.querySelector(domTemplateQuerySelector[role]).cloneNode(true);
		msgRender.querySelector('.content').innerHTML = content;
		messagesDOM.appendChild(msgRender);
		messagesDOM.scrollTop = messagesDOM.scrollHeight;
	} else {
		alert("Unknown role provided");
	}
}

async function sendDiscussionToOpenAI() {
	if (!OPENAI_API_KEY) {
		return {
			error: new Error("La clé d'API pour OpenAI n'a pas été renseignée"),
			response: null,
		};
	} else {
		try {
			const data1 = await fetch('https://api.openai.com/v1/chat/completions', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': 'Bearer ' + OPENAI_API_KEY
				},
				body: JSON.stringify({
					model: 'gpt-3.5-turbo',
					messages: messages.filter((msg) => msg.role != SYSTEM),
				})
			});
			const data2 = await data1.json();
			const response = data2.choices[0].message.content.trimStart();
			return {
				error: null,
				response,
			};
		} catch (error) {
			return {
				error,
				response: null,
			};
		}
	}
}

// listeners
userInputFormDOM.addEventListener("submit", userInputSubmit);
userInputFormDOM.addEventListener('input', (e) => {
	if (!window.mobileAndTabletCheck() && !e.shiftKey && e.key == 'Enter') {
		userInputSubmit();
	}
})

appSettingsFormDOM.addEventListener("submit", (e) => {
	e.preventDefault()
	if (!appSettingsFormDOM.checkValidity()) {
		e.stopPropagation()
	}
	appSettingsFormDOM.classList.add('was-validated')

	if (openAIKeyInputDOM.value) {
		OPENAI_API_KEY = openAIKeyInputDOM.value;
		document.querySelector('#discussion').classList.remove('d-none');
	}
});

// init
const tmpAPIKey = localStorage.getItem("openaikey");
OPENAI_API_KEY = tmpAPIKey ? tmpAPIKey : null;

localStorage.setItem("discussion", JSON.stringify(msgs));

messages = LStorage.retrieveMsgs();
messages.forEach(m => { addMsgToDOM(m.role, m.content) })

userInputDOM.focus();

// TODO : réviser le code pour qu'on arrête de stocker en localstorage
// TODO : héberger le code sur internet pour l'utiliser depuis mon téléphone
// TODO : finir de coder le truc pour que la clé d'API soit stocké dans localstorage
// TODO : utiliser Supabase à la place de localstorage
// TODO : utiliser Supabase pour les edges fonctions
// TODO : utiliser Supabase pour l'authentification
// TODO : faire une appli iOS
// TODO : avoir plusieurs discussions possibles en parallèle
// TODO : ajuster pour que le contexte ne devienne pas trop long
// TODO : faire un truc qui relance l'utilsiateur en se basant sur un calendrier avec notre serveur pour avoir un programme de coaching qui sollicite l'utilisateur spontanément
