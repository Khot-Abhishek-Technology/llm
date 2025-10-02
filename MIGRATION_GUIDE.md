# Migration from Gemini API to Local StarCoder 3B LLM

## Overview

This project has been successfully migrated from Google's Gemini API to a local StarCoder 3B LLM. All LLM functionalities now run on your local machine.

## What Changed

### 1. Dependencies
- **Removed**: `@google/generative-ai` (still in package.json but not used)
- **Added**: Local LLM service layer (`backend/services/localLLM.js`)
- **Using**: `axios` for HTTP communication with local LLM server

### 2. Files Modified

| File | Changes |
|------|---------|
| `backend/services/localLLM.js` | **NEW** - Centralized LLM service |
| `backend/routes/generateQuiz.js` | Replaced Gemini with local LLM |
| `backend/routes/generateTech.js` | Replaced Gemini with local LLM |
| `backend/routes/checkTechSolution.js` | Replaced Gemini with local LLM |
| `backend/routes/studentDashboard.js` | Replaced Gemini with local LLM |
| `.env` | Added `LOCAL_LLM_URL` configuration |

### 3. API Changes

**Before (Gemini)**:
```javascript
const { GoogleGenerativeAI } = require("@google/generative-ai");
const genAI = new GoogleGenerativeAI(process.env.GEN_AI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
const result = await model.generateContent(prompt);
const response = await result.response.text();
```

**After (Local LLM)**:
```javascript
const { getLocalLLM } = require("../services/localLLM");
const llm = getLocalLLM();
const response = await llm.generateJSON(prompt, {
  temperature: 0.5,
  max_tokens: 2048
});
```

## Setup Instructions

### Quick Start (Recommended - Using Ollama)

1. **Run the setup script**:
   ```bash
   cd backend
   chmod +x setup-local-llm.sh
   ./setup-local-llm.sh
   ```

2. **Start Ollama server**:
   ```bash
   ollama serve
   ```

3. **Start your backend**:
   ```bash
   cd backend
   npm install
   node index.js
   ```

### Manual Setup

#### Option 1: Ollama (Easiest)

1. **Install Ollama**:
   ```bash
   curl -fsSL https://ollama.com/install.sh | sh
   ```

2. **Pull StarCoder model**:
   ```bash
   ollama pull starcoder2:3b
   ```

3. **Start server** (runs on port 11434 by default):
   ```bash
   ollama serve
   ```

4. **Update .env**:
   ```bash
   LOCAL_LLM_URL=http://localhost:11434
   ```

#### Option 2: llama.cpp

1. **Build llama.cpp**:
   ```bash
   git clone https://github.com/ggerganov/llama.cpp
   cd llama.cpp
   make
   ```

2. **Download model** (GGUF format):
   ```bash
   wget https://huggingface.co/TheBloke/starcoder-3B-GGUF/resolve/main/starcoder-3b.Q4_K_M.gguf
   ```

3. **Start server**:
   ```bash
   ./server -m starcoder-3b.Q4_K_M.gguf \
     --host 0.0.0.0 \
     --port 8080 \
     --ctx-size 4096
   ```

4. **Update .env**:
   ```bash
   LOCAL_LLM_URL=http://localhost:8080
   ```

#### Option 3: Text-generation-webui

1. **Install**:
   ```bash
   git clone https://github.com/oobabooga/text-generation-webui
   cd text-generation-webui
   pip install -r requirements.txt
   ```

2. **Download StarCoder 3B** through the web interface

3. **Start with API**:
   ```bash
   python server.py --api --model starcoder-3b
   ```

4. **Update .env**:
   ```bash
   LOCAL_LLM_URL=http://localhost:5000
   ```

## Configuration

### Environment Variables

Add to your `.env` file:

```bash
# Local LLM Configuration (StarCoder 3B)
LOCAL_LLM_URL=http://localhost:8080

# Optional: Specify model name
LOCAL_LLM_MODEL=starcoder-3b
```

### Supported Endpoints

The local LLM service tries these endpoints in order:
1. `/v1/completions` (OpenAI-compatible)
2. `/api/generate` (Ollama-style)
3. `/completion` (Generic)

## Features

### 1. JSON Generation (`generateJSON`)

Automatically:
- Cleans markdown code blocks
- Extracts JSON from text
- Validates JSON structure
- Retries up to 3 times on failure

```javascript
const data = await llm.generateJSON(prompt, {
  temperature: 0.3,  // Lower for consistent JSON
  max_tokens: 2048
});
```

### 2. Text Generation (`generateContent`)

For general text responses:

```javascript
const text = await llm.generateContent(prompt, {
  temperature: 0.7,
  max_tokens: 1024
});
```

### 3. Health Check

Check if LLM server is running:

```javascript
const isHealthy = await llm.healthCheck();
```

## Fine-tuning (Optional)

For better performance on your specific use cases:

1. **Review training examples**:
   ```bash
   cat backend/fine-tuning/training-examples.jsonl
   ```

2. **Follow the guide**:
   ```bash
   cat backend/fine-tuning/README.md
   ```

3. **Use few-shot prompting** (no fine-tuning needed):
   - The prompts already include examples
   - StarCoder will learn from the examples in the prompt

## Testing

### Test Local LLM Server

```bash
curl http://localhost:8080/v1/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "starcoder-3b",
    "prompt": "Generate a JSON array with 2 quiz questions about programming:",
    "max_tokens": 500,
    "temperature": 0.5
  }'
```

### Test Application Endpoints

1. **Quiz Generation**:
   ```bash
   curl http://localhost:3000/generateQuiz?quizType=logical%20reasoning
   ```

2. **Tech Problems**:
   ```bash
   curl http://localhost:3000/generateTech?techType=arrays
   ```

3. **Code Evaluation**:
   ```bash
   curl -X POST http://localhost:3000/checkTechSolution \
     -H "Content-Type: application/json" \
     -d '{"title":"Two Sum","desc":"Find two numbers","code":"function twoSum(){}","language":"javascript"}'
   ```

## Performance Optimization

### 1. Temperature Settings
- **JSON Generation**: 0.3-0.5 (more deterministic)
- **Creative Content**: 0.7-0.9 (more varied)
- **Code Evaluation**: 0.3-0.4 (consistent)

### 2. Hardware Requirements

| Model | RAM | VRAM | Speed |
|-------|-----|------|-------|
| StarCoder 3B | 8GB | 4GB | Fast |
| CodeLlama 7B | 16GB | 8GB | Medium |
| Mistral 7B | 16GB | 8GB | Medium |
| Phi-2 2.7B | 6GB | 3GB | Very Fast |

### 3. Context Window
- Minimum: 2048 tokens
- Recommended: 4096 tokens
- For long problems: 8192 tokens

## Troubleshooting

### Issue: "Connection refused"
**Solution**: Make sure local LLM server is running
```bash
ollama serve
# or
./llama.cpp/server -m model.gguf
```

### Issue: "Invalid JSON response"
**Solution**:
- Lower temperature to 0.3
- Check model is loaded correctly
- Review prompt engineering (add more examples)

### Issue: Slow responses
**Solution**:
- Use GPU if available
- Switch to smaller model (Phi-2)
- Reduce max_tokens
- Enable quantization (Q4 or Q8)

### Issue: Out of memory
**Solution**:
- Use quantized model (Q4_K_M instead of F16)
- Reduce context window
- Close other applications

## Alternative Models

Replace StarCoder 3B with other models:

### For Better Code Understanding
```bash
ollama pull codellama:7b
```

### For Better General Performance
```bash
ollama pull mistral:7b
```

### For Faster Inference
```bash
ollama pull phi
```

### For Best Results (Requires more RAM)
```bash
ollama pull codellama:13b
```

Update `LOCAL_LLM_MODEL` in `.env` if needed.

## Rollback to Gemini API

If you need to rollback:

1. **Restore old code from git**:
   ```bash
   git checkout HEAD~1 backend/routes/
   ```

2. **Or manually update imports**:
   ```javascript
   // Change this:
   const { getLocalLLM } = require("../services/localLLM");
   const llm = getLocalLLM();

   // Back to this:
   const { GoogleGenerativeAI } = require("@google/generative-ai");
   const genAI = new GoogleGenerativeAI(process.env.GEN_AI_API_KEY);
   ```

3. **Remove LOCAL_LLM_URL from .env**

## Benefits of Local LLM

✅ **No API Costs**: Run unlimited requests for free
✅ **Privacy**: All data stays on your machine
✅ **No Rate Limits**: Generate as many questions as needed
✅ **Offline**: Works without internet
✅ **Customizable**: Fine-tune for your specific use case
✅ **Fast**: Local inference with GPU support

## Known Limitations

⚠️ **Quality**: May not match GPT-4 or Gemini Pro quality
⚠️ **Hardware**: Requires decent CPU/GPU
⚠️ **Setup**: Initial setup more complex than API key
⚠️ **Maintenance**: Need to manage local server

## Support

For issues:
1. Check Ollama logs: `ollama logs`
2. Review backend logs for errors
3. Test LLM server with curl commands above
4. Verify .env configuration

## Next Steps

1. ✅ Local LLM setup complete
2. 📝 Test all endpoints
3. 🎯 Fine-tune model (optional)
4. 🚀 Deploy to production

For fine-tuning guidance, see `backend/fine-tuning/README.md`
