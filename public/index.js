
document.addEventListener('submit', (e) => {
    e.preventDefault()
    progressConversation()
})

// Listen for 'submit' events on the document, prevent the default form submission behavior, and trigger the chat progression function.

// Select the loader element from the DOM and initially set it to be hidden.


const loader = document.getElementById('loader');
loader.style.display = 'none';
async function progressConversation() {
        // Function to manage the sending of user input to the server and displaying responses.
        // Define an asynchronous function to handle the progression of the conversation in the chat interface.
    const userInput = document.getElementById('user-input');
    const chatbotConversation = document.getElementById('chatbot-conversation-container');
    const question = userInput.value;
    userInput.value = '';
    // Add the user's message to the chat.

    // Add human message to the chat
    const newHumanSpeechBubble = document.createElement('div');
    newHumanSpeechBubble.classList.add('speech', 'speech-human');
    newHumanSpeechBubble.textContent = question;
    chatbotConversation.appendChild(newHumanSpeechBubble);
    chatbotConversation.scrollTop = chatbotConversation.scrollHeight;

    try {
        loader.style.display = 'block';
        // Send the question to the server
        const response = await fetch('/process-question', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ question })
        });

        // Check if the response is OK
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        // Add AI response to the chat
        const newAiSpeechBubble = document.createElement('div');
        newAiSpeechBubble.classList.add('speech', 'speech-ai');
        newAiSpeechBubble.textContent = data.answer;
        chatbotConversation.appendChild(newAiSpeechBubble);
        chatbotConversation.scrollTop = chatbotConversation.scrollHeight;

    } catch (error) {
        console.error('Error fetching response:', error);
        // Handle the error (show error message, etc.)
    } finally {
        // Hide the loader when the response is received or when there's an error
        loader.style.display = 'none';
    }
}
