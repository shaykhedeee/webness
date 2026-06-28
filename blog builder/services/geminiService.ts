import { GoogleGenAI, Type } from "@google/genai";
import { Language, Tone } from '../types';

if (!process.env.API_KEY) {
    console.warn("API_KEY environment variable not set. Using a placeholder.");
    process.env.API_KEY = "YOUR_API_KEY"; 
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function generateOutline(topic: string, keywords: string, language: Language, research: string): Promise<string> {
    const prompt = `
    You are a world-class SEO content strategist. Your task is to create a comprehensive, bulletproof outline for a blog post.
    
    Topic: "${topic}"
    Language: ${language}
    Keywords: "${keywords}"
    Additional Research Material: "${research}"

    Based on the information, generate a detailed outline in ${language}. The outline should be structured to rank well on Google. Include:
    1.  An engaging H1 title.
    2.  A series of H2 and H3 headings that cover the topic thoroughly.
    3.  Under each heading, list key points, questions to answer, or data to include.
    4.  Incorporate the provided keywords naturally where they make sense.
    5.  Suggest where an inline image could be placed by adding a placeholder like [IMAGE_1]. Add only one such placeholder.

    Return ONLY the outline text, ready to be used by a writer.
    `;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
    });
    return response.text;
}


export async function draftBlog(outline: string, topic: string, keywords: string, tone: Tone, language: Language): Promise<string> {
    const prompt = `
    You are the first AI in a two-stage writing process: The "Creative Drafter". Your job is to create a comprehensive and engaging blog post based on a provided outline.
    
    Task: Write a complete blog post based on the provided outline.
    
    Topic: "${topic}"
    Keywords: "${keywords}"
    Tone: ${tone}
    Language: ${language}
    Outline:
    ---
    ${outline}
    ---

    Instructions:
    - Write a detailed, comprehensive blog post in ${language}.
    - Follow the structure of the outline precisely.
    - The writing style should be ${tone}, engaging, and easy to read.
    - Naturally integrate the keywords: ${keywords}.
    - Format the output in Markdown with proper headings (e.g., #, ##, ###).
    - Focus on getting all the core ideas down. Another AI will polish and fact-check your work.
    - Do NOT add any preamble or introductory text like "Here is the blog post". Just start writing the article directly from the H1 title.
    `;
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: prompt,
    });
    return response.text;
}


export async function polishBlog(draft: string, language: Language): Promise<string> {
    const prompt = `
    You are the second AI in a two-stage writing process: The "Meticulous Editor". Your task is to polish the following blog post draft written by another AI.
    
    Language: ${language}
    
    Draft:
    ---
    ${draft}
    ---
    
    Instructions:
    - Fact-check the content for accuracy. Correct any mistakes.
    - Improve clarity, flow, and readability. Make it sound more human.
    - Correct any grammar and spelling errors.
    - Enhance formatting for better web presentation (e.g., add bolding, italics, or bullet points where appropriate).
    - Ensure the final output is still in valid Markdown format.
    - Return ONLY the final, polished blog post. Do not add any extra commentary.
    `;
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
    });
    return response.text;
}

export async function translateText(text: string, targetLanguage: Language): Promise<string> {
    const prompt = `
    You are a professional translator. Translate the following text into ${targetLanguage}.
    Ensure the translation is accurate, natural-sounding, and maintains the original tone and formatting (Markdown).

    Text to translate:
    ---
    ${text}
    ---

    Return ONLY the translated text.
    `;
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
    });
    return response.text;
}

export async function generateImages(blogContent: string, topic: string): Promise<string[]> {
    const imagePromptGeneratorPrompt = `
    Based on the following blog post, create two distinct, visually compelling image generation prompts for a text-to-image AI.
    The first prompt should be for a main "feature" image that encapsulates the entire blog topic.
    The second prompt should be for an "inline" image that illustrates a specific concept within the blog.
    
    The images should be professional, high-quality, and suitable for a blog.
    
    Blog Topic: "${topic}"
    Blog Content:
    ---
    ${blogContent.substring(0, 2000)}...
    ---
    
    Return your response as a JSON object with two keys: "feature_prompt" and "inline_prompt".
    Example: {"feature_prompt": "A prompt for the main image", "inline_prompt": "A prompt for the inline image"}
    `;

    const promptResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: imagePromptGeneratorPrompt,
    });
    
    let prompts;
    try {
        prompts = JSON.parse(promptResponse.text);
    } catch {
        throw new Error("Failed to generate valid image prompts.");
    }

    const imagePrompts = [prompts.feature_prompt, prompts.inline_prompt].filter(Boolean);
    const generatedImages: string[] = [];

    for (const p of imagePrompts) {
        const response = await ai.models.generateImages({
            model: 'imagen-4.0-generate-001',
            prompt: `${p}, photorealistic, high detail, professional blog graphic`,
            config: {
                numberOfImages: 1,
                outputMimeType: 'image/jpeg',
                aspectRatio: '16:9',
            },
        });
        const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
        generatedImages.push(base64ImageBytes);
    }
    
    if(generatedImages.length === 0) {
        throw new Error("Image generation failed.");
    }
    
    return generatedImages;
}

export async function suggestTopics(niche: string): Promise<string[]> {
    const prompt = `
    You are a SEO and content strategy expert. Based on the following niche, generate 5 engaging and relevant blog post titles that are likely to trend or rank well.
    
    Niche: "${niche}"
    
    Return the response as a JSON array of strings.
    Example: ["10 Tips for...", "The Ultimate Guide to...", "Why X is Changing..."]
    `;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.ARRAY,
                items: {
                    type: Type.STRING
                }
            }
        }
    });

    try {
        return JSON.parse(response.text);
    } catch {
        throw new Error("Failed to parse topic suggestions.");
    }
}