// Import necessary modules, set up dotenv for environment variables.


import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { ChatOpenAI } from 'langchain/chat_models/openai'
import { PromptTemplate } from 'langchain/prompts'
import { StringOutputParser } from 'langchain/schema/output_parser'
import { retriever } from './public/utils/retriever.js'
import { combineDocuments } from './public/utils/combineDocuments.js'
import { RunnablePassthrough, RunnableSequence } from "langchain/schema/runnable"
import dotenv from 'dotenv';
import bodyParser from 'body-parser';
import { formatConvHistory } from './public/utils/formatConvHistory.js';
dotenv.config();
// Determine the directory of the current module, initialize the Express app and body parser for JSON.


const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
app.use(bodyParser.json());
const openAIApiKey = process.env.OPENAI_API_KEY

// Create instances for ChatOpenAI, prompt templates, and output parser.

const llm = new ChatOpenAI({ openAIApiKey })
const standaloneQuestionTemplate = `Given some conversation history (if any) and a question, convert the question to a standalone question. 
conversation history: {conv_history}
question: {question} 
standalone question:`

const standaloneQuestionPrompt = PromptTemplate.fromTemplate(standaloneQuestionTemplate)

const answerTemplate = `You are a helpful and enthusiastic support bot who can answer a given question about Sayed Sohail. Sayed Sohail could be reffered as sohail or sayed. Based on the context provided and the conversation history. Try to find the answer in the context. If the answer is not given in the context, find the answer in the conversation history if possible.  If you really don't know the answer, say "I'm sorry, I don't know the answer to that." And direct the questioner to email peerzadesayedsohail@gmail.com. Don't try to make up an answer. Always speak as if you were chatting to a friend.
context: {context}
conversation history: {conv_history}
question: {question}
answer: `
const answerPrompt = PromptTemplate.fromTemplate(answerTemplate)

// Define the processing chains for transforming the question, retrieving context, and generating the answer.


const standaloneQuestionChain = standaloneQuestionPrompt
    .pipe(llm)
    .pipe(new StringOutputParser())
    
const retrieverChain = RunnableSequence.from([
    prevResult => prevResult.standalone_question,
    retriever,
    combineDocuments
])
const answerChain = answerPrompt
    .pipe(llm)
    .pipe(new StringOutputParser())

const chain = RunnableSequence.from([
    {
        standalone_question: standaloneQuestionChain,
        original_input: new RunnablePassthrough()
    },
    {
        context: retrieverChain,
        question: ({ original_input }) => original_input.question,
        conv_history: ({ original_input }) => original_input.conv_history
    },
    answerChain
])

const convHistory = []




// Set a static folder for assets like CSS and JavaScript files
app.use(express.static(path.join(__dirname, 'public')));

// Send the HTML file on a GET request to the root
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});


// Endpoint to process the question
app.post('/process-question', async (req, res) => {
    const { question } = req.body;

    try {
        const result = await chain.invoke({ question: question,
            conv_history: formatConvHistory(convHistory)
         
        });
        convHistory.push(question)
        convHistory.push(result)
        res.json({ answer: result });

    } catch (error) {
        console.error('Error processing question:', error);
        res.status(500).send('Error processing question');
    }
});

// Set the port
const PORT = process.env.PORT || 3000;

// Start the server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
