# Example Runs

Illustrative outputs from the AI Investment Research Agent. Live runs may differ with market news and model sampling — re-run in the UI to reproduce.

---

## Example 1: Apple Inc.

**Verdict:** INVEST  
**Confidence:** 82%  
**Risk Level:** Low  
**Time Horizon:** long-term  
**Typical generation time:** ~20–40s (with Tavily + Gemini)

### Summary
Apple remains a high-quality compounder with exceptional brand loyalty, a sticky ecosystem, and industry-leading margins. Services growth diversifies revenue beyond hardware cycles. Valuation is premium but supported by cash generation and capital returns.

### Bull case
- Ecosystem lock-in drives recurring services revenue
- Strong balance sheet with buybacks and dividends
- Pricing power across iPhone, Mac, wearables
- AI features can support upgrade cycles

### Bear case
- Hardware concentration and China exposure
- App Store regulatory pressure globally
- Premium valuation leaves little room for misses
- Competition in AI-native experiences

### Key metrics (illustrative)
| Metric | Value | Assessment |
|--------|-------|------------|
| Market Cap | ~$3T+ | positive |
| Services Growth | Double-digit YoY | positive |
| Gross Margin | ~45%+ | positive |
| P/E | ~30x | neutral |

### Reasoning
Fundamentals remain among the strongest in large-cap tech. Ecosystem moat and capital allocation outweigh hardware cyclicality. Premium valuation is the main constraint; quality supports a long-term INVEST for compounder-oriented investors.

---

## Example 2: Tesla Inc.

**Verdict:** PASS  
**Confidence:** 68%  
**Risk Level:** High  
**Time Horizon:** medium-term

### Summary
Tesla pioneered EVs but faces intensifying competition, margin pressure, and a valuation that prices in aggressive growth and autonomy success. Fundamentals have softened vs peak margins; the stock remains a high-beta narrative trade.

### Bull case
- Energy storage and FSD optionality if autonomy delivers
- Brand and charging network remain assets
- Manufacturing cost leadership vs many legacy OEMs

### Bear case
- EV price wars compressing margins
- Competition from BYD and catching-up OEMs
- Valuation embeds optimistic autonomy timelines
- Governance / execution narrative risk

### Reasoning
Innovation history is real, but risk/reward is unfavorable for a fundamentals-first investor at stretched valuations. PASS until margins stabilize or price reflects auto-sector reality.

---

## Example 3: Reliance Industries

**Verdict:** INVEST  
**Confidence:** 71%  
**Risk Level:** Medium  
**Time Horizon:** long-term

### Summary
India’s largest conglomerate with scale in energy, Jio telecom, and retail. Digital and consumer optionality sits on a cash-generative core; India macro tailwinds support the thesis.

### Bull case
- Jio scale and ARPU growth in digital India
- Reliance Retail share of organized retail
- Integrated energy cash flows
- Promoter execution track record

### Bear case
- Conglomerate discount and complexity
- Telecom / data regulation risk
- Capex intensity of new bets
- Oil/refining cyclicality

### Reasoning
Rare listed exposure to India’s consumption and digital growth at scale. Medium risk from regulation and conglomerate structure, but long-term INVEST for India-focused portfolios.

---

## How to reproduce

```bash
npm install
cp .env.example .env.local   # add GEMINI_API_KEY (+ TAVILY_API_KEY)
npm run dev
```

Open http://localhost:3000 and analyze **Apple**, **Tesla**, or **Reliance Industries**.
