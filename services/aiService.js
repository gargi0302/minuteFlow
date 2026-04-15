const Groq = require('groq-sdk');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const generateMoM = async ({ meeting, workspace }) => {
  const prompt = `You are a professional meeting secretary. Analyze the meeting transcript below and return a structured JSON object.

MEETING DETAILS:
- Title: ${meeting.title}
- Organization: ${workspace.name}
- Date: ${new Date(meeting.date).toDateString()}
- Venue: ${meeting.venue || 'Online / Not specified'}
- Attendees: ${meeting.attendees?.join(', ') || 'Refer to transcript'}

MEETING TRANSCRIPT:
${meeting.transcript}

Return ONLY a valid JSON object (no markdown, no code blocks, no extra text) with this exact structure:
{
  "meetingDetails": {
    "title": "string",
    "organization": "string",
    "date": "string",
    "venue": "string",
    "duration": "string or null"
  },
  "attendees": ["name1", "name2"],
  "summary": "2-3 sentence executive summary of the meeting",
  "agendaItems": [
    { "item": "string", "discussion": "string" }
  ],
  "decisions": [
    { "decision": "string", "decidedBy": "string or null", "impact": "high|medium|low" }
  ],
  "actionItems": [
    {
      "task": "string",
      "assignedTo": "string",
      "deadline": "string or null",
      "priority": "high|medium|low",
      "status": "pending"
    }
  ],
  "closingNote": "string"
}

Rules:
- Only include information present in the transcript
- For priority: high = urgent/critical, medium = important, low = nice to have
- For impact: high = major decision, medium = moderate, low = minor
- Extract deadlines as mentioned (e.g. "by Friday", "end of month")
- If a field is unknown, use null`;

  const completion = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.1,
  });

  return completion.choices[0].message.content;
};

module.exports = { generateMoM };
