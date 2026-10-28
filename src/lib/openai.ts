import OpenAI from "openai";

interface GenerateIcebreakerParams {
  hostName: string;
  learnerName: string;
  hostHobbies: string[];
  learnerHobbies: string[];
}

/**
 * Calls OpenAI (gpt-4o-mini) upon booking to create a single, friendly
 * 1-sentence icebreaker question for the Learner to ask the Host.
 */
export async function generateMeetingIcebreaker({
  hostName,
  learnerName,
  hostHobbies,
  learnerHobbies,
}: GenerateIcebreakerParams): Promise<string> {
  const hostHobbyList =
    hostHobbies.length > 0 ? hostHobbies.join(", ") : "sharing life stories";
  const learnerHobbyList =
    learnerHobbies.length > 0 ? learnerHobbies.join(", ") : "learning English";

  const apiKey = process.env.OPENAI_API_KEY;

  // Fallback for local testing before OPENAI_API_KEY is configured
  if (!apiKey || apiKey === "sk-...") {
    const sharedHobby =
      hostHobbies.find((h) => learnerHobbies.includes(h)) || hostHobbies[0] || "favorite hobbies";
    return `${learnerName}, ask ${hostName} what first sparked their love for ${sharedHobby}!`;
  }

  const openai = new OpenAI({ apiKey });

  const prompt = `Host (${hostName}) likes ${hostHobbyList}. Learner (${learnerName}) likes ${learnerHobbyList}. Write a single, short 1-sentence icebreaker question addressed to ${learnerName} to ask ${hostName} (for example: "${learnerName}, ask ${hostName} about his favorite Marvel movie!"). Return ONLY the single sentence with no quotes.`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content:
          "You are a warm intergenerational conversation coach helping a teenage English learner start a friendly 30-minute video call with an elderly native English speaker.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
    max_tokens: 80,
    temperature: 0.7,
  });

  return (
    completion.choices[0]?.message?.content?.trim() ||
    `${learnerName}, ask ${hostName} about their favorite memory connected to ${hostHobbyList}!`
  );
}
