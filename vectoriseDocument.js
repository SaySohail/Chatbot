// Load environment variables from a .env file for API keys and other configurations.
// Import file system promises for asynchronous file operations.
import dotenv from 'dotenv';
dotenv.config();
import { promises as fs } from 'fs';
// Import classes for text splitting, Supabase client creation, vector storage, and OpenAI embeddings.

import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter'
import { createClient } from '@supabase/supabase-js'
import { SupabaseVectorStore } from 'langchain/vectorstores/supabase'
import { OpenAIEmbeddings } from 'langchain/embeddings/openai'

// @supabase/supabase-js
async function main() {
    // Read a text file asynchronously and split it into chunks.
    // Initialize clients and APIs using environment variables.
    // Store processed data in Supabase using OpenAI embeddings.
    try {
        // Read the local text file
        const text = await fs.readFile('sohail-info.txt', 'utf8');
        const splitter = new RecursiveCharacterTextSplitter({
            chunkSize: 500,
            chunkOverlap: 20,
            separators: ['\n\n', '\n', ' ', ''] // default setting
        });

        const output = await splitter.createDocuments([text]);

        const sbApiKey = process.env.SUPABASE_ANON_KEY;
        const sbUrl = process.env.SUPABASE_URL;
        const openAIApiKey = process.env.OPENAI_API_KEY;

        const client = createClient(sbUrl, sbApiKey);

        // Assuming SupabaseVectorStore.fromDocuments is a static async method
        await SupabaseVectorStore.fromDocuments(
            output,
            new OpenAIEmbeddings({ apiKey: openAIApiKey }),
            {
                client,
                tableName: 'documents',
            }
        );

    } catch (err) {
        // Catch and log any errors that occur during execution.
        console.error(err);
    }
}

main();



const openAIApiKey = process.env.OPENAI_API_KEY
