let recognition;
let audioContext = new (window.AudioContext || window.webkitAudioContext)();
let isPostWakeWordTranscription = false;

function unlockAudioContext() {
    if (audioContext.state === 'suspended') {
        audioContext.resume();
    }
}

if (window.SpeechRecognition || window.webkitSpeechRecognition) {
    recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
} else {
    console.error('SpeechRecognition API not supported in this browser.');
}

function updateLiveTranscription(text) {
    const chatWindow = document.getElementById('chat-window');
    const lastMessage = chatWindow.lastElementChild;

    if (isPostWakeWordTranscription) return;

    if (!lastMessage || !lastMessage.classList.contains('user-message')) {
        updateChatWindow('User', text);
        return;
    }

    const bubbleDiv = lastMessage.querySelector('.bubble.user');
    if (bubbleDiv) {
        bubbleDiv.innerText = text;
    }
}

function removeLastUserMessage() {
    const chatWindow = document.getElementById('chat-window');
    const lastMessage = chatWindow.lastElementChild;

    if (lastMessage && lastMessage.classList.contains('user-message')) {
        chatWindow.removeChild(lastMessage);
    }
}

function updateChatWindow(role, text) {
    const chatWindow = document.getElementById('chat-window');
    const messageContainer = document.createElement('div');
    messageContainer.className = `${role.toLowerCase()}-message message`;

    const labelDiv = document.createElement('div');
    labelDiv.className = 'label';
    labelDiv.innerText = role;
    messageContainer.appendChild(labelDiv);

    const messageDiv = document.createElement('div');
    messageDiv.className = `bubble ${role.toLowerCase()}`;
    messageDiv.innerText = text;
    messageContainer.appendChild(messageDiv);

    chatWindow.appendChild(messageContainer);
    chatWindow.scrollTop = chatWindow.scrollHeight;
}

function startListening() {
    userStoppedListening = false;
    let userPausedListening = false;
    speakWithWebSpeech(' ')
    if (!recognition) {
        console.error('SpeechRecognition not initialized.');
        return;
    }

    unlockAudioContext();
    recognition.onresult = function(event) {
        let interimTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcriptChunk = event.results[i][0].transcript;
            
            
            if (transcriptChunk.toLowerCase().includes('clear chat')) {
                clearChatWindow();
                return; 
            }
    
            if (transcriptChunk.toLowerCase().includes('pause listening')) {
                userPausedListening = true;
                return; 
            }
    
            // Check if the system is paused and the transcript contains 'jarvis start listening'
            if (userPausedListening && transcriptChunk.toLowerCase().includes('jarvis listen')) {
                userPausedListening = false;
                return; 
            }
    
            // If the system is paused, do not process the wake word
            if (userPausedListening) {
                continue;
            }
    
            if (!event.results[i].isFinal) {
                interimTranscript += transcriptChunk;
                updateLiveTranscription(interimTranscript);
            } else if (
                transcriptChunk.toLowerCase().includes('jarvis') && 
                !transcriptChunk.toLowerCase().includes('jarvis listen')){
                    sendTranscriptToBackend(transcriptChunk);
            }

            // Check if the transcript contains 'stop listening'
            if (transcriptChunk.toLowerCase().includes('stop listening')) {
                stopListening();
                return; // Stop further processing of this chunk
            }
            
            if (transcriptChunk.toLowerCase().includes('stop speaking')) {
                stopSpeaking();
                return; 
            }
        }
    };

    recognition.onend = function() {
        if (!userStoppedListening) {
            recognition.start();
        }
    };

    recognition.onerror = function(event) {
        console.error('Error occurred in recognition: ' + event.error);
    };

    recognition.start();
}

function getCookie(name) {
    let value = '; ' + document.cookie;
    let parts = value.split('; ' + name + '=');
    if (parts.length === 2) return parts.pop().split(';').shift();
}

let messages = [];

function sendTranscriptToBackend(transcript) {
    shouldSpeak = true;
    const startIndex = transcript.toLowerCase().indexOf('jarvis') + 'jarvis'.length;
    transcript = transcript.substring(startIndex).trim();
    transcript = transcript.charAt(0).toUpperCase() + transcript.slice(1);
    removeLastUserMessage();
    updateChatWindow('User', transcript);
    showLoadingSpinner();
    speakWithWebSpeech(getRandomResponse());
    // Add user's message to the conversation history
    messages.push({'role': 'user', 'content': transcript});
    
    // Truncate messages to only keep the last user and assistant message, plus the current message.
    if (messages.length > 3) {
        messages = messages.slice(-3);
    }

    // Setting the flag to prevent overwriting
    isPostWakeWordTranscription = true;

    // Check length of the transcript
    if (transcript.length <= 5) {
        const errorResponse = "I could not understand that. Please speak again.";
        updateChatWindow('Assistant', errorResponse);
        speakWithWebSpeech(errorResponse);
        isPostWakeWordTranscription = false;
        return;
    }

    const csrfToken = getCookie('csrftoken');
    fetch('/generate_response/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrfToken
        },
        body: JSON.stringify({ messages: messages })
    })
    .then(response => response.json())
    .then(data => {
        removeSpinnerMessage();  // This will remove the spinner
        updateChatWindow('Assistant', data.response);
        messages.push({'role': 'assistant', 'content': data.response});  // Add assistant's message to the conversation history
        
        // Use WebSpeech API for TTS
        speakWithWebSpeech(data.response);
        
        unlockAudioContext();
        isPostWakeWordTranscription = false;  // Resetting the flag after the assistant responds
    })
    .catch(console.error);
}

function clearChatWindow() {
    const chatWindow = document.getElementById('chat-window');
    while (chatWindow.firstChild) {
        chatWindow.removeChild(chatWindow.firstChild);
    }
    messages = [];
}

function stopSpeaking() {
    synth.cancel(); // This will stop the current speech synthesis
}

function stopListening() {
    if (recognition) {
        userStoppedListening = true;
        recognition.stop();
    }
}

let shouldSpeak = true;

function speakWithWebSpeech(text) {
    if (!shouldSpeak) return; // If flag is false, don't proceed with speaking

    const synth = window.speechSynthesis;
    synth.cancel(); // Clear any previous utterances in the queue
    const utterance = new SpeechSynthesisUtterance(text);
    synth.speak(utterance);
}

function stopSpeaking() {
    shouldSpeak = false;  // Set the flag to false
    const synth = window.speechSynthesis;
    if (synth && synth.speaking) {
        synth.cancel(); // Stop the current speech synthesis
    }
}

function showLoadingSpinner() {
    const chatWindow = document.getElementById('chat-window');
    const messageContainer = document.createElement('div');
    messageContainer.className = `assistant-message message`;

    const labelDiv = document.createElement('div');
    labelDiv.className = 'label';
    labelDiv.innerText = 'Assistant';
    messageContainer.appendChild(labelDiv);

    const bubbleDiv = document.createElement('div');
    bubbleDiv.className = `bubble assistant`;
    
    const spinnerDiv = document.createElement('div');
    spinnerDiv.className = `spinner`;

    bubbleDiv.appendChild(spinnerDiv);
    messageContainer.appendChild(bubbleDiv);

    chatWindow.appendChild(messageContainer);
    chatWindow.scrollTop = chatWindow.scrollHeight;
}

function removeSpinnerMessage() {
    const chatWindow = document.getElementById('chat-window');
    const lastMessage = chatWindow.lastElementChild;

    if (lastMessage) {
        chatWindow.removeChild(lastMessage);
    }
}

const responses = [
    'Absolutely.',
    'Of course.',
    'Sure thing.',
    'Certainly.',
    'Alright.',
    'Okay.',
    'No problem.',
    'Affirmative.',
    'Very well.',
    'You bet.'
];

function getRandomResponse() {
    const randomIndex = Math.floor(Math.random() * responses.length);
    return responses[randomIndex];
}