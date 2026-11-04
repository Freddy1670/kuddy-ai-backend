import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';

const app = express();
app.use(cors());
app.use(express.json());

const GROQ_API_KEY = process.env.GROQ_API_KEY;

async function fetchLiveKuddyCatalog(userQuery = '') {
  try {
    const searchQuery = userQuery.trim().length > 1 ? userQuery : 'skincare';
    const searchUrl = `https://www.kuddycosmetics.com/search/suggest.json?q=${encodeURIComponent(searchQuery)}&resources[type]=product&resources[limit]=15`;

    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json'
      }
    });

    if (!response.ok) return [];

    const data = await response.json();
    const products = data.resources?.results?.products || [];

    return products.map(product => {
      const priceVal = product.price ? Number(product.price) : 0;
      const formattedPrice = priceVal > 0 ? `₦${priceVal.toLocaleString()}` : 'Price on store';

      let rawUrl = product.url || '';
      let cleanPath = rawUrl.split('?')[0];
      let absoluteUrl = cleanPath.startsWith('http') 
        ? cleanPath 
        : `https://www.kuddycosmetics.com${cleanPath.startsWith('/') ? '' : '/'}${cleanPath}`;

      return {
        title: product.title,
        vendor: product.vendor || 'Kuddy Cosmetics',
        price: formattedPrice,
        url: absoluteUrl
      };
    });

  } catch (error) {
    console.error('Error fetching live Kuddy catalog:', error);
    return [];
  }
}

app.post('/api/chat', async (req, res) => {
  try {
    // 1. Receive full conversation history array from React frontend
    const { history = [], message = '' } = req.body;

    // Detect if this is a follow-up/conversational reply (e.g. "really", "why", "tell me more", "how much")
    const isShortFollowUp = message.trim().split(/\s+/).length <= 3;
    
    // Determine search query: Use last user topic if current message is just a short follow-up
    let searchQuery = message;
    if (isShortFollowUp && history.length > 0) {
      const lastUserMsg = [...history].reverse().find(m => m.role === 'user');
      if (lastUserMsg) searchQuery = lastUserMsg.content;
    }

    let liveCatalog = await fetchLiveKuddyCatalog(searchQuery);

    const systemPrompt = `
You are the Official AI Beauty Advisor for Kuddy Cosmetics (kuddycosmetics.com).

CONVERSATIONAL RULES:
1. CONTINUITY: Pay close attention to previous messages in the conversation history. If the user gives a short response like "really", "why?", or "tell me more", respond naturally in context to what was previously discussed.
2. DO NOT RE-GREET: If you are already mid-conversation, DO NOT say "Hi there, Gorgeous!" or re-introduce yourself every turn. Continue the conversation fluidly like a real human consultant.
3. RECOMMENDATIONS: Only introduce new product cards if requested or necessary. Use exact URLs provided in the catalog.

Live Kuddy Catalog Context:
${JSON.stringify(liveCatalog, null, 2)}
`;

    // Format conversation history for OpenAI/Groq messages payload
    const formattedHistory = history.map(msg => ({
      role: msg.sender === 'user' ? 'user' : 'assistant',
      content: msg.text || msg.content
    }));

    // Build complete messages thread
    const fullMessages = [
      { role: 'system', content: systemPrompt },
      ...formattedHistory,
      { role: 'user', content: message }
    ];

    const aiResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: 'openai/gpt-oss-120b',
        messages: fullMessages,
        temperature: 0.5
      })
    });

    const aiData = await aiResponse.json();

    if (aiData.error) {
      return res.status(500).json({ reply: `API Error: ${aiData.error.message}` });
    }

    const reply = aiData.choices[0]?.message?.content || "I'm sorry, I couldn't process your request right now.";
    res.json({ reply });

  } catch (error) {
    console.error('Server execution error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Beauty AI Live Server running on http://localhost:${PORT}`));