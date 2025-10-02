# Local LLM Quick Start Guide

## 🚀 5-Minute Setup

### Step 1: Install Ollama
```bash
curl -fsSL https://ollama.com/install.sh | sh
```

### Step 2: Pull StarCoder Model
```bash
ollama pull starcoder2:3b
```

### Step 3: Start Server
```bash
ollama serve
```
Server runs on `http://localhost:11434`

### Step 4: Update Configuration
Edit `.env`:
```bash
LOCAL_LLM_URL=http://localhost:11434
```

### Step 5: Start Application
```bash
cd backend
npm install
node index.js
```

Done! Your application now uses local LLM instead of Gemini API.

---

## 📝 Usage Examples

### Generate Quiz Questions
```javascript
const { getLocalLLM } = require('./services/localLLM');
const llm = getLocalLLM();

const questions = await llm.generateJSON(
  'Generate 5 aptitude questions on logical reasoning as JSON array',
  { temperature: 0.5, max_tokens: 2000 }
);
```

### Evaluate Code
```javascript
const analysis = await llm.generateJSON(
  `Analyze this code: ${code}\nReturn JSON with evaluation and analysis fields`,
  { temperature: 0.3, max_tokens: 1500 }
);
```

### Generate Text
```javascript
const text = await llm.generateContent(
  'Explain binary search algorithm',
  { temperature: 0.7, max_tokens: 1000 }
);
```

---

## 🔧 Configuration Options

### Temperature
- `0.1-0.3`: Very focused, consistent (JSON generation)
- `0.4-0.6`: Balanced (quiz questions)
- `0.7-0.9`: Creative (explanations)

### Max Tokens
- Short answers: `500-1000`
- Quiz questions: `1500-2500`
- Code analysis: `1500-2000`
- Long explanations: `2500-4000`

---

## 🎯 Alternative Models

### Faster (Smaller)
```bash
ollama pull phi
LOCAL_LLM_URL=http://localhost:11434
```

### Better for Code
```bash
ollama pull codellama:7b
```

### Best General Performance
```bash
ollama pull mistral:7b
```

---

## 🐛 Common Issues

### Connection Error
```bash
# Check if server is running
curl http://localhost:11434/api/tags

# If not, start it
ollama serve
```

### Invalid JSON
```javascript
// Use lower temperature
await llm.generateJSON(prompt, { temperature: 0.3 });

// Add explicit JSON instruction
const prompt = `${yourPrompt}\n\nReturn ONLY valid JSON.`;
```

### Slow Performance
```bash
# Use smaller model
ollama pull phi

# Or use GPU acceleration (requires CUDA/ROCm)
ollama serve --gpu
```

---

## 📊 API Endpoints

### Local LLM Service

#### Generate JSON
```javascript
llm.generateJSON(prompt, options)
// Returns: Parsed JSON object/array
// Retries: 3 attempts
// Auto-cleans: Removes markdown, extracts JSON
```

#### Generate Text
```javascript
llm.generateContent(prompt, options)
// Returns: String
// Use for: Non-JSON responses
```

#### Health Check
```javascript
await llm.healthCheck()
// Returns: true/false
```

---

## 🔥 Pro Tips

1. **Include Examples**: Add example outputs in your prompts
   ```javascript
   const prompt = `Generate quiz questions.

   Example output:
   [{"id":"q1","que":"What is 2+2?","a":"3","b":"4","c":"5","d":"6","ans":"b"}]

   Now generate 5 questions on: ${topic}`;
   ```

2. **Be Explicit**: Specify exact format
   ```javascript
   "Return ONLY a valid JSON array. No markdown, no explanations."
   ```

3. **Use Lower Temperature**: For consistent JSON
   ```javascript
   { temperature: 0.3 }
   ```

4. **Validate Output**: Service auto-retries on invalid JSON

5. **Monitor Performance**: Log response times
   ```javascript
   const start = Date.now();
   const result = await llm.generateJSON(prompt);
   console.log(`Took ${Date.now() - start}ms`);
   ```

---

## 📦 What's Changed

| Before (Gemini) | After (Local LLM) |
|----------------|-------------------|
| `@google/generative-ai` | `axios` + local server |
| API key required | No API key needed |
| Internet required | Works offline |
| Rate limits | No limits |
| Cost per request | Free |
| `GoogleGenerativeAI` | `getLocalLLM()` |

---

## ✅ Checklist

- [ ] Ollama installed
- [ ] Model downloaded (`ollama pull starcoder2:3b`)
- [ ] Server running (`ollama serve`)
- [ ] `.env` updated with `LOCAL_LLM_URL`
- [ ] Backend started (`node index.js`)
- [ ] Test endpoint works

---

## 🆘 Get Help

**Test the LLM**:
```bash
curl http://localhost:11434/v1/completions \
  -H "Content-Type: application/json" \
  -d '{"model":"starcoder2:3b","prompt":"Say hello","max_tokens":50}'
```

**Check Ollama logs**:
```bash
journalctl -u ollama -f
```

**Test application endpoint**:
```bash
curl http://localhost:3000/generateQuiz?quizType=math
```

---

## 📚 Documentation

- Full migration guide: `MIGRATION_GUIDE.md`
- Fine-tuning guide: `backend/fine-tuning/README.md`
- Training examples: `backend/fine-tuning/training-examples.jsonl`

---

**Need to go back to Gemini?** See rollback instructions in `MIGRATION_GUIDE.md`
