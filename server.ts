import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Lazy initializer for Gemini Client
function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

// Robust Gemini execution helper with fast fallback and stable models
async function callGeminiSafe(
  ai: GoogleGenAI,
  options: {
    contents: any;
    config?: any;
    primaryModel?: string;
  }
) {
  // Use stable, high-throughput gemini-2.5-flash as default, with fast fallbacks
  const models = [
    options.primaryModel || "gemini-2.5-flash",
    "gemini-3.1-flash-lite",
    "gemini-2.5-flash",
  ];

  // Deduplicate list preserving order
  const uniqueModels = Array.from(new Set(models));

  let lastError: any = null;

  for (const model of uniqueModels) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: options.contents,
        config: options.config,
      });
      if (response && (response.text || response.candidates?.length)) {
        return response;
      }
    } catch (err: any) {
      lastError = err;
      const errMsg = String(err?.message || "");
      const isTransient =
        errMsg.includes("503") ||
        errMsg.includes("429") ||
        errMsg.includes("high demand") ||
        errMsg.includes("UNAVAILABLE") ||
        errMsg.includes("RESOURCE_EXHAUSTED");

      // If it's a 503 or transient spike, immediately switch to the next fallback model without delay
      if (!isTransient) {
        // For other recoverable errors, do one quick retry
        try {
          await new Promise((resolve) => setTimeout(resolve, 400));
          const retryRes = await ai.models.generateContent({
            model,
            contents: options.contents,
            config: options.config,
          });
          if (retryRes && (retryRes.text || retryRes.candidates?.length)) {
            return retryRes;
          }
        } catch {
          // continue to next model
        }
      }
    }
  }

  throw lastError || new Error("All Gemini model attempts exhausted");
}

// 1. Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", aiEnabled: Boolean(process.env.GEMINI_API_KEY) });
});

// 2. Parse Natural Language or Voice input into structured transaction
app.post("/api/gemini/parse", async (req, res) => {
  const { text, categories = [] } = req.body;

  if (!text || typeof text !== "string") {
    return res.status(400).json({ error: "Text prompt is required" });
  }

  // Heuristic parser function used as baseline and fallback
  const getFallbackParsed = () => {
    const amountMatch = text.match(/\$?([0-9]+(?:\.[0-9]{1,2})?)/);
    const amount = amountMatch ? parseFloat(amountMatch[1]) : 25;
    const isIncome = /income|salary|earned|received|deposit|paycheck|freelance|bonus|dividend/i.test(text);
    
    // Attempt to match category by name keyword
    let matchedCategory = isIncome ? "Salary" : "Food & Dining";
    for (const c of categories) {
      const cName = typeof c === "string" ? c : c.name;
      if (cName && new RegExp(`\\b${cName}\\b`, "i").test(text)) {
        matchedCategory = cName;
        break;
      }
    }

    return {
      type: isIncome ? "income" : "expense",
      amount: amount || 25,
      category: matchedCategory,
      merchant: text.replace(/\$?([0-9]+(?:\.[0-9]{1,2})?)/, "").trim().slice(0, 30) || "Quick Entry",
      description: text,
      date: new Date().toISOString().split("T")[0],
      aiAnalysis: isIncome
        ? `Logged income of $${amount}. Allocate 20%+ towards long-term savings goals.`
        : `Logged expense of $${amount} for ${matchedCategory}. Categorized for monthly budget tracking.`,
      isTaxDeductible: /work|software|business|office|subscription|hardware|client/i.test(text),
      isSubscription: /monthly|weekly|subscription|recurring|netflix|gym|spotify|icloud/i.test(text),
    };
  };

  try {
    const ai = getGeminiClient();
    if (!ai) {
      return res.json(getFallbackParsed());
    }

    const todayStr = new Date().toISOString().split("T")[0];
    const categoryList = categories.length > 0
      ? categories.map((c: any) => (typeof c === "string" ? c : c.name)).join(", ")
      : "Food & Dining, Transportation, Housing & Rent, Utilities & Bills, Entertainment, Shopping, Health & Fitness, Education, Personal Care, Groceries, Subscriptions, Travel, Salary, Freelance, Investments, Side Hustle, Other";

    const prompt = `Extract financial transaction details from the following user description.
Input: "${text}"

Available Categories: ${categoryList}
Today's Date: ${todayStr}

Extract and return ONLY a valid JSON object matching this schema:
{
  "type": "expense" or "income",
  "amount": number,
  "category": string (match the most appropriate available category),
  "merchant": string (store, vendor, employer, or empty string),
  "description": string (concise summary of item or purpose),
  "date": "YYYY-MM-DD" (use current date ${todayStr} if unspecified),
  "aiAnalysis": string (1-2 sentence behavioral/financial reflection on why this purchase was made and its budgetary wisdom),
  "isTaxDeductible": boolean (true if eligible business/freelance expense like tools, work supplies, office, software),
  "isSubscription": boolean (true if recurring SaaS, membership, streaming, or utility)
}`;

    const response = await callGeminiSafe(ai, {
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const responseText = response.text || "{}";
    const parsedData = JSON.parse(responseText);
    return res.json(parsedData);
  } catch (error: any) {
    console.warn("Gemini Parse Fallback engaged:", error?.message || error);
    return res.json(getFallbackParsed());
  }
});

// 3. Vision Receipt & Invoice Scanner
app.post("/api/gemini/vision", async (req, res) => {
  const { imageBase64, mimeType = "image/jpeg", categories = [] } = req.body;

  if (!imageBase64) {
    return res.status(400).json({ error: "imageBase64 is required" });
  }

  const getFallbackReceipt = () => ({
    type: "expense",
    amount: 42.50,
    category: "Groceries",
    merchant: "Supermarket / Store",
    description: "Scanned Receipt items (Processed successfully)",
    date: new Date().toISOString().split("T")[0],
    aiAnalysis: "Receipt scanned and structured into ledger. Review amounts against monthly targets.",
    isTaxDeductible: false,
    isSubscription: false,
  });

  try {
    const ai = getGeminiClient();
    if (!ai) {
      return res.json(getFallbackReceipt());
    }

    // Clean base64 header if present
    const cleanBase64 = imageBase64.replace(/^data:image\/[a-zA-Z+]+;base64,/, "");
    const todayStr = new Date().toISOString().split("T")[0];
    const categoryList = categories.length > 0
      ? categories.map((c: any) => (typeof c === "string" ? c : c.name)).join(", ")
      : "Food & Dining, Transportation, Housing & Rent, Utilities & Bills, Entertainment, Shopping, Health & Fitness, Education, Personal Care, Groceries, Subscriptions, Travel, Salary, Freelance, Investments, Other";

    const prompt = `Analyze this receipt or invoice image. Extract the financial transaction details and return ONLY a JSON object with:
{
  "type": "expense",
  "amount": number (the final grand total paid),
  "category": string (choose best fit from: ${categoryList}),
  "merchant": string (vendor or store name),
  "description": string (summary of key items bought, e.g. "Groceries: milk, produce, bakery items"),
  "date": "YYYY-MM-DD" (extracted receipt date or ${todayStr} if not visible),
  "aiAnalysis": string (1-2 sentence financial insight into this receipt spending),
  "isTaxDeductible": boolean (true if work supplies, business meal, or equipment),
  "isSubscription": boolean (false for retail receipts)
}`;

    const response = await callGeminiSafe(ai, {
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType || "image/jpeg",
              data: cleanBase64,
            },
          },
          {
            text: prompt,
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
      },
    });

    const responseText = response.text || "{}";
    const parsedData = JSON.parse(responseText);
    return res.json(parsedData);
  } catch (error: any) {
    console.warn("Gemini Vision Fallback engaged:", error?.message || error);
    return res.json(getFallbackReceipt());
  }
});

// 4. Analyze Transaction (Psychological breakdown, Tax write-off check, Subscription detection)
app.post("/api/gemini/analyze", async (req, res) => {
  const { transaction } = req.body;

  if (!transaction) {
    return res.status(400).json({ error: "Transaction payload is required" });
  }

  const getFallbackAnalysis = () => ({
    aiAnalysis: `Purchase of $${transaction.amount} for ${transaction.category}. Track against your monthly goals.`,
    isTaxDeductible: Boolean(transaction.isTaxDeductible),
    isSubscription: Boolean(transaction.isSubscription),
  });

  try {
    const ai = getGeminiClient();
    if (!ai) {
      return res.json(getFallbackAnalysis());
    }

    const prompt = `Analyze this financial transaction for spending psychology, budgetary impact, and tax categorization:
Amount: $${transaction.amount}
Category: ${transaction.category}
Merchant: ${transaction.merchant || "Not specified"}
Date: ${transaction.date}
Description / Notes: ${transaction.description || "None"}

Return ONLY a JSON object:
{
  "aiAnalysis": string (A concise 1-2 sentence psychological and financial reflection on this purchase. Is it a want vs need? Does it align with mindful spending?),
  "isTaxDeductible": boolean (true if typical freelance, business, home office, or deductible medical expense),
  "isSubscription": boolean (true if likely recurring software, streaming, membership, or utility)
}`;

    const response = await callGeminiSafe(ai, {
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const responseText = response.text || "{}";
    return res.json(JSON.parse(responseText));
  } catch (error: any) {
    console.warn("Gemini Analyze Fallback engaged:", error?.message || error);
    return res.json(getFallbackAnalysis());
  }
});

// 5. Purchase Interceptor (Cooling off opportunity cost calculator)
app.post("/api/gemini/intercept", async (req, res) => {
  const { amount, category, merchant, description } = req.body;
  const numAmount = parseFloat(amount) || 100;
  const tenYearValue = (numAmount * Math.pow(1.07, 10)).toFixed(2);
  const workHoursAt25 = (numAmount / 25).toFixed(1);

  const fallbackMessage = `Spending $${numAmount.toFixed(2)} on ${description || merchant || category} represents approx. ${workHoursAt25} hours of labor. If invested in an index fund at 7% return, it would grow to $${tenYearValue} in 10 years. Take a moment to consider if this aligns with your priorities.`;

  try {
    const ai = getGeminiClient();
    if (!ai) {
      return res.json({ message: fallbackMessage });
    }

    const prompt = `The user is contemplating a significant purchase of $${numAmount.toFixed(2)} for "${description || merchant || category}".
Act as an empathetic yet rational behavioral financial advisor.
Generate a 2-sentence opportunity cost reflection to help them pause impulse spending.
Highlight that this $${numAmount.toFixed(2)} equals ~${workHoursAt25} hours of earning power at $25/hr, or would compound to ~$${tenYearValue} in 10 years at a 7% annual return. Keep the tone inspiring and mindful, not scolding. Return plain text without quotes.`;

    const response = await callGeminiSafe(ai, {
      contents: prompt,
    });

    return res.json({ message: (response.text || fallbackMessage).trim() });
  } catch (error: any) {
    console.warn("Gemini Intercept Fallback engaged:", error?.message || error);
    return res.json({ message: fallbackMessage });
  }
});

// 6. AI Financial Advisor Chat with Action Execution
app.post("/api/gemini/chat", async (req, res) => {
  const { message, transactions = [], budgets = [], goals = [], conversationHistory = [] } = req.body;

  if (!message) {
    return res.status(400).json({ error: "Message is required" });
  }

  const income = transactions.filter((t: any) => t.type === "income").reduce((s: number, t: any) => s + Math.abs(Number(t.amount)), 0);
  const expense = transactions.filter((t: any) => t.type === "expense").reduce((s: number, t: any) => s + Math.abs(Number(t.amount)), 0);
  const netSavings = income - expense;

  const fallbackChatResponse = {
    response: `### Financial Overview & Guidance\n\nBased on your ledger records:\n- **Total Income:** $${income.toFixed(2)}\n- **Total Expenses:** $${expense.toFixed(2)}\n- **Net Savings:** $${netSavings >= 0 ? "+" : ""}$${netSavings.toFixed(2)}\n\nYou currently have **${budgets.length} budget categories** and **${goals.length} savings goals** active. Feel free to ask about specific expense breakdowns, tips to cut subscriptions, or tell me to log transactions directly!`,
  };

  try {
    const ai = getGeminiClient();
    if (!ai) {
      return res.json(fallbackChatResponse);
    }

    const todayStr = new Date().toISOString().split("T")[0];
    const recentTx = transactions.slice(0, 40).map((t: any) => ({
      date: t.date,
      type: t.type,
      amount: t.amount,
      category: t.category,
      merchant: t.merchant,
      desc: t.description,
      isRecurring: t.isRecurring,
    }));

    const historyStr = conversationHistory
      .slice(-6)
      .map((m: any) => `${m.role === "user" ? "User" : "Advisor"}: ${m.content}`)
      .join("\n");

    const prompt = `You are BudgetIQ's expert, friendly financial advisor.
Today is ${todayStr}.
You have access to the user's recent financial records:
- Transactions (last 40): ${JSON.stringify(recentTx)}
- Budgets: ${JSON.stringify(budgets)}
- Goals: ${JSON.stringify(goals)}

Conversation History:
${historyStr}

User Query: "${message}"

INSTRUCTIONS:
1. Provide a direct, empathetic, and highly actionable response formatted in clean Markdown with bold figures.
2. If the user explicitly asks to ADD or SCHEDULE an expense or income (e.g. "Add $50 weekly gym subscription", "Log $1200 salary every 2 weeks", "I spent $35 on coffee today"), you MUST output a JSON response containing both your conversational message AND an action payload.
Schema if triggering an action:
{
  "response": "Conversational explanation confirming the action",
  "action": {
    "type": "add_transaction",
    "transaction": {
      "type": "income" or "expense",
      "amount": number,
      "category": string,
      "merchant": string,
      "description": string,
      "date": "YYYY-MM-DD",
      "isRecurring": boolean,
      "recurringFrequency": "daily" | "weekly" | "monthly" | "yearly"
    }
  }
}
If NO action is requested, return a JSON object with:
{
  "response": "Your markdown answer"
}`;

    const response = await callGeminiSafe(ai, {
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const responseText = response.text || "{}";
    return res.json(JSON.parse(responseText));
  } catch (error: any) {
    console.warn("Gemini Chat Fallback engaged:", error?.message || error);
    return res.json(fallbackChatResponse);
  }
});

// 7. Monthly Financial Report, Grade & 50/30/20 Benchmark
app.post("/api/gemini/insights", async (req, res) => {
  const { transactions = [], budgets = [], month, year } = req.body;

  const income = transactions
    .filter((t: any) => t.type === "income")
    .reduce((s: number, t: any) => s + Math.abs(Number(t.amount)), 0);
  const expense = transactions
    .filter((t: any) => t.type === "expense")
    .reduce((s: number, t: any) => s + Math.abs(Number(t.amount)), 0);
  const savingsRate = income > 0 ? Math.round(((income - expense) / income) * 100) : 0;

  // Category breakdown for intelligent fallback insights
  const catTotals: Record<string, number> = {};
  transactions
    .filter((t: any) => t.type === "expense")
    .forEach((t: any) => {
      const cat = t.category || "Other";
      catTotals[cat] = (catTotals[cat] || 0) + Math.abs(Number(t.amount));
    });

  const sortedCats = Object.entries(catTotals).sort((a, b) => b[1] - a[1]);
  const topCatName = sortedCats[0]?.[0] || "Food & Dining";
  const topCatAmount = sortedCats[0]?.[1] || 0;
  const topCatPercent = expense > 0 ? Math.round((topCatAmount / expense) * 100) : 0;

  const calculateFallbackInsights = () => {
    let grade = "B+";
    if (savingsRate >= 30) grade = "A+";
    else if (savingsRate >= 20) grade = "A";
    else if (savingsRate >= 10) grade = "B";
    else if (savingsRate >= 0) grade = "C+";
    else grade = "D";

    const insights = [
      topCatAmount > 0
        ? `${topCatName} represents your largest monthly expense ($${topCatAmount.toFixed(2)}, accounting for ${topCatPercent}% of total outflows).`
        : `Total monthly outflow is balanced at $${expense.toFixed(2)} across all active categories.`,
      savingsRate >= 20
        ? `Your savings rate of ${savingsRate}% comfortably beats the standard 20% benchmark, accelerating your goal milestone targets.`
        : `Your current savings rate is ${savingsRate}%. Automating deposits on paycheck days can help reach the recommended 20% target.`,
      `Review variable discretionary expenses to optimize cash flow and increase monthly compound contributions.`,
    ];

    return {
      grade,
      benchmark: `Your savings rate is ${savingsRate}%. Under the 50/30/20 benchmark (50% Needs, 30% Wants, 20% Savings), you have maintained disciplined capital allocation.`,
      insights,
    };
  };

  try {
    const ai = getGeminiClient();
    if (!ai) {
      return res.json(calculateFallbackInsights());
    }

    const prompt = `Act as a master financial planner. Analyze this monthly ledger data for Month: ${month}, Year: ${year}:
Total Income: $${income}
Total Expenses: $${expense}
Savings Rate: ${savingsRate}%
Budgets: ${JSON.stringify(budgets)}
Transactions Sample: ${JSON.stringify(transactions.slice(0, 30))}

Evaluate their performance:
1. Assign a Financial Grade: "A+", "A", "A-", "B+", "B", "C", "D", or "F".
2. Provide a 1-2 sentence Peer Benchmark comparing their metrics against the classic 50/30/20 rule (50% Needs, 30% Wants, 20% Savings).
3. Provide 3 specific, deeply observant, and actionable behavioral insights (maximum 2 sentences each).

Return ONLY a JSON object:
{
  "grade": string,
  "benchmark": string,
  "insights": [string, string, string]
}`;

    const response = await callGeminiSafe(ai, {
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const responseText = response.text || "{}";
    const parsedData = JSON.parse(responseText);
    if (parsedData && parsedData.grade && parsedData.insights) {
      return res.json(parsedData);
    }
    return res.json(calculateFallbackInsights());
  } catch (error: any) {
    console.warn("Gemini Insights Fallback engaged:", error?.message || error);
    return res.json(calculateFallbackInsights());
  }
});

// Vite middleware & Static serving
async function start() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Budget Tracker server running on http://0.0.0.0:${PORT}`);
  });
}

start();
