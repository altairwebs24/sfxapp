
-- Wipe existing curriculum and replace with Babypips School of Pipsology
DELETE FROM public.education_lessons;

INSERT INTO public.education_lessons (slug, title, order_index, body_md) VALUES
('bp-preschool', 'Preschool — Intro to Forex', 1,
'# Preschool: Intro to Forex
Totally clueless about forex? Start here with the foundation of the foreign exchange market.

## Course outline
- What is Forex?
- How Do You Trade Forex?
- When Can You Trade Forex?
- Who Trades Forex?
- Why Trade Forex?
- Margin Trading 101 — How Your Margin Account Works

**Read the full course on Babypips:** https://www.babypips.com/learn/forex/preschool'),

('bp-kindergarten', 'Kindergarten — Brokers & Analysis', 2,
'# Kindergarten: Brokers & Analysis
Learn how to choose a forex broker and the three core ways to analyse currency markets.

## Course outline
- Forex Brokers 101
- Three Types of Analysis (Technical, Fundamental, Sentiment)
- Types of Charts (Line, Bar, Candlestick)

**Read the full course on Babypips:** https://www.babypips.com/learn/forex/kindergarten'),

('bp-elementary', 'Elementary — Technical Analysis Basics', 3,
'# Elementary: Technical Analysis Basics
The beginners guide to technical analysis.

## Course outline
- Support and Resistance Levels
- Japanese Candlesticks
- Fibonacci
- Moving Averages
- Popular Chart Indicators

**Read the full course on Babypips:** https://www.babypips.com/learn/forex/elementary'),

('bp-middle-school', 'Middle School — Indicators & Patterns', 4,
'# Middle School: Indicators, Patterns & Pivots
Use chart indicators properly, spot chart patterns and apply pivot points.

## Course outline
- Oscillators and Momentum Indicators
- Important Chart Patterns
- Pivot Points

**Read the full course on Babypips:** https://www.babypips.com/learn/forex/middle-school'),

('bp-summer-school', 'Summer School — Advanced Charting', 5,
'# Summer School: Advanced Charting
Take technical analysis further with Heikin Ashi, Elliott Wave and harmonic patterns.

## Course outline
- Heikin Ashi
- Elliott Wave Theory
- Harmonic Price Patterns
- Trading Divergences

**Read the full course on Babypips:** https://www.babypips.com/learn/forex/summer-school'),

('bp-high-school', 'High School — Price Action & Breakouts', 6,
'# High School: Price Action & Breakouts
Dig deeper into price action, breakouts, market environment and multiple time frames.

## Course outline
- Price Action Trading
- Trading Breakouts and Fakeouts
- Market Environment
- Multiple Time Frame Analysis

**Read the full course on Babypips:** https://www.babypips.com/learn/forex/high-school'),

('bp-undergrad-freshman', 'Undergrad Freshman — Macro Fundamentals', 7,
'# Undergrad Freshman: Macro Fundamentals
Understand WHY currencies move — macro data, central banks, geopolitics and news.

## Course outline
- Fundamental Analysis: A Macro Fundamentals Approach
- Economic Data and Market Reactions
- Country Risk, Geopolitics & Market Interventions
- Applying Macro Fundamentals
- Currency Crosses
- Carry Trade
- Understanding and Trading the News
- Sentiment Analysis

**Read the full course on Babypips:** https://www.babypips.com/learn/forex/undergraduate-freshman'),

('bp-undergrad-sophomore', 'Undergrad Sophomore — Intermarket Analysis', 8,
'# Undergrad Sophomore: Intermarket Analysis
No market moves alone — learn how gold, oil, bonds, equities and liquidity drive FX.

## Course outline
- The U.S. Dollar Index
- Intermarket Analysis
- Using Equities to Trade FX
- Country Profiles
- Beginners Guide to Global Liquidity
- Narrative Analysis

**Read the full course on Babypips:** https://www.babypips.com/learn/forex/undergraduate-sophomore'),

('bp-undergrad-junior', 'Undergrad Junior — Trading Plan & System', 9,
'# Undergrad Junior: Trading Plan & System
Build a realistic foundation before risking real money.

## Course outline
- Developing Your Own Trading Plan
- Which Type of Trader Are You?
- Build Your Own Trading System
- Keeping a Trading Journal
- Personality Quizzes

**Read the full course on Babypips:** https://www.babypips.com/learn/forex/undergraduate-junior'),

('bp-undergrad-senior', 'Undergrad Senior — Risk Management', 10,
'# Undergrad Senior: Risk Management
Protect your account before you chase profits.

## Course outline
- Risk Management
- Trading With Leverage Without Blowing Up
- Position Sizing for Account Survival
- Managing Risk With Proper Stop Loss Placement
- Scaling In and Out of Trades
- Currency Correlations

**Read the full course on Babypips:** https://www.babypips.com/learn/forex/undergraduate-senior'),

('bp-graduation', 'Graduation — Final Words of Wisdom', 11,
'# Graduation: Final Words of Wisdom
Some final wisdom before you venture into the markets.

## Course outline
- Prop Trading Firms 101
- Forex Trading Scams
- The Most Common Trading Mistakes New Traders Make
- Graduation Speech

**Read the full course on Babypips:** https://www.babypips.com/learn/forex/graduation');

-- Seed 2 quick quizzes per lesson
INSERT INTO public.education_quizzes (lesson_id, question, options, correct_index, order_index)
SELECT id, 'Forex is best described as...', '["A stock exchange","The global currency market","A crypto exchange","A commodities market"]'::jsonb, 1, 1
FROM public.education_lessons WHERE slug='bp-preschool'
UNION ALL SELECT id, 'Margin lets you...', '["Avoid losses","Control a larger position with less capital","Predict the market","Skip broker fees"]'::jsonb, 1, 2
FROM public.education_lessons WHERE slug='bp-preschool'

UNION ALL SELECT id, 'Which is NOT a type of analysis?', '["Technical","Fundamental","Sentiment","Astrological"]'::jsonb, 3, 1
FROM public.education_lessons WHERE slug='bp-kindergarten'
UNION ALL SELECT id, 'Which chart shows open, high, low, close?', '["Line","Candlestick","Pie","Scatter"]'::jsonb, 1, 2
FROM public.education_lessons WHERE slug='bp-kindergarten'

UNION ALL SELECT id, 'Support is a price level where...', '["Buyers tend to step in","Sellers dominate","Volume is zero","News always hits"]'::jsonb, 0, 1
FROM public.education_lessons WHERE slug='bp-elementary'
UNION ALL SELECT id, 'Fibonacci retracements are based on...', '["Random numbers","Ratios from the Fibonacci sequence","Price/earnings ratios","Volatility bands"]'::jsonb, 1, 2
FROM public.education_lessons WHERE slug='bp-elementary'

UNION ALL SELECT id, 'Oscillators are mainly used to spot...', '["Trends","Overbought/oversold conditions","Volume spikes","Earnings"]'::jsonb, 1, 1
FROM public.education_lessons WHERE slug='bp-middle-school'
UNION ALL SELECT id, 'Pivot points are calculated from...', '["Previous high/low/close","Moving averages","RSI levels","Volume"]'::jsonb, 0, 2
FROM public.education_lessons WHERE slug='bp-middle-school'

UNION ALL SELECT id, 'Heikin Ashi candles primarily help to...', '["Smooth out trends","Predict news","Detect volume","Measure spread"]'::jsonb, 0, 1
FROM public.education_lessons WHERE slug='bp-summer-school'
UNION ALL SELECT id, 'A divergence happens when...', '["Price and indicator disagree","Two MAs cross","Volume drops","Spread widens"]'::jsonb, 0, 2
FROM public.education_lessons WHERE slug='bp-summer-school'

UNION ALL SELECT id, 'A fakeout is...', '["A confirmed breakout","A false breakout that reverses","A type of order","A chart indicator"]'::jsonb, 1, 1
FROM public.education_lessons WHERE slug='bp-high-school'
UNION ALL SELECT id, 'Multiple time frame analysis means...', '["Looking at the same pair on different timeframes","Using multiple pairs","Trading 24/7","Using multiple brokers"]'::jsonb, 0, 2
FROM public.education_lessons WHERE slug='bp-high-school'

UNION ALL SELECT id, 'A carry trade profits from...', '["Interest rate differentials","Chart patterns","News spikes","Spread arbitrage"]'::jsonb, 0, 1
FROM public.education_lessons WHERE slug='bp-undergrad-freshman'
UNION ALL SELECT id, 'NFP is a key release from...', '["UK","Japan","USA","Eurozone"]'::jsonb, 2, 2
FROM public.education_lessons WHERE slug='bp-undergrad-freshman'

UNION ALL SELECT id, 'The U.S. Dollar Index (DXY) measures USD vs...', '["Gold","A basket of major currencies","Bitcoin","Oil"]'::jsonb, 1, 1
FROM public.education_lessons WHERE slug='bp-undergrad-sophomore'
UNION ALL SELECT id, 'Intermarket analysis studies relationships between...', '["Brokers","Different asset classes","Traders","Indicators"]'::jsonb, 1, 2
FROM public.education_lessons WHERE slug='bp-undergrad-sophomore'

UNION ALL SELECT id, 'A trading plan should include...', '["Only entry rules","Entry, exit, and risk rules","Just stop losses","Indicator settings only"]'::jsonb, 1, 1
FROM public.education_lessons WHERE slug='bp-undergrad-junior'
UNION ALL SELECT id, 'A trading journal is for...', '["Tax filing only","Reviewing trades and improving","Sharing on social media","Broker complaints"]'::jsonb, 1, 2
FROM public.education_lessons WHERE slug='bp-undergrad-junior'

UNION ALL SELECT id, 'The #1 cause of blown accounts is usually...', '["Bad indicators","Excessive leverage / poor risk","Slow internet","Broker fees"]'::jsonb, 1, 1
FROM public.education_lessons WHERE slug='bp-undergrad-senior'
UNION ALL SELECT id, 'Position sizing should be based on...', '["Gut feeling","Account risk % per trade","Last trade result","Broker minimum lot"]'::jsonb, 1, 2
FROM public.education_lessons WHERE slug='bp-undergrad-senior'

UNION ALL SELECT id, 'A prop firm provides traders with...', '["Personal loans","Firm capital to trade","Free signals","Tax advice"]'::jsonb, 1, 1
FROM public.education_lessons WHERE slug='bp-graduation'
UNION ALL SELECT id, 'A red flag for scams is...', '["Verified track record","Guaranteed profits","Risk disclosures","Regulated broker"]'::jsonb, 1, 2
FROM public.education_lessons WHERE slug='bp-graduation';
