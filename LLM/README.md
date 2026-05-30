# A2S – AI Interior Design Product Recommendation Agent

An intelligent conversational AI agent that helps users find the perfect furniture, lighting, and decor products from a curated catalog. Powered by **Google Gemini** and built with **Streamlit**.

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Features](#features)
4. [How Context Management Works](#how-context-management-works)
5. [Project Structure](#project-structure)
6. [Module Documentation](#module-documentation)
7. [Data Pipeline](#data-pipeline)
8. [Filter & Ranking System](#filter--ranking-system)
9. [Setup & Installation](#setup--installation)
10. [Usage Examples](#usage-examples)
11. [Configuration](#configuration)
12. [Troubleshooting](#troubleshooting)

---

## Overview

**A2S** (AI-to-Suggest) is a smart product recommendation agent for interior design. It understands natural language queries about room design needs and suggests matching products with images, prices, dimensions, and purchase links.

### What it does

| Capability | Example |
|---|---|
| Understand room requirements | *"I need furniture for my living room"* |
| Filter by budget | *"Under ₹30,000"* |
| Match color preferences | *"In warm colors"* |
| Understand size needs | *"Something compact, under 200cm wide"* |
| Style matching | *"Modern and minimal"* |
| Contextual refinement | *"Make it cheaper"* (remembers previous criteria) |
| Design advice | *"What colors go well with dark wood furniture?"* |
| Product comparison | *"Compare sofas vs beds for this budget"* |

---

## Architecture

The system follows a 3-layer architecture:

```
┌─────────────────────────────────────────────┐
│           FRONTEND (Streamlit)              │
│  Chat UI  │  Product Cards  │  Sidebar     │
└──────────────────┬──────────────────────────┘
                   │
┌──────────────────▼──────────────────────────┐
│            AI AGENT CORE                     │
│  Context Manager → Gemini LLM → Filter      │
│  (Accumulates)    (Extracts)   (Queries)    │
└──────────────────┬──────────────────────────┘
                   │
┌──────────────────▼──────────────────────────┐
│            DATA LAYER                        │
│  Loader → Filter Engine → Ranker → Results  │
│  (Excel)   (Pandas)       (Score)           │
└─────────────────────────────────────────────┘
```

### Flow for each user message:

1. **User** types a message in the chat
2. **Context Manager** appends to session history, retrieves full conversation
3. **Gemini LLM** receives full history + system prompt, extracts structured filters as JSON
4. **Filter Engine** queries the Pandas DataFrame with accumulated filters
5. **Ranker** scores results by relevance (price fit, type match, etc.)
6. **Response Generator** formats natural language reply + product cards
7. **Context Manager** stores response, updates accumulated filters

See full diagrams in [`docs/architecture/`](docs/architecture/).

---

## Features

### Core Features

- **Natural Language Understanding**: Ask in plain English/Hinglish, the agent understands budget, room, style, color, size, brand preferences
- **Context-Aware Conversation**: Filters accumulate across turns. Say "sofa" then "under 30k" — both are remembered
- **Smart Product Cards**: Each product shows image, price, dimensions, room/style tags, and a direct buy link
- **Filter Relaxation**: If no exact matches found, the agent relaxes less important filters automatically
- **Design Tips**: Suggests paint colors (Asian Paints, Berger, Nerolac) and decor types

### UI Features

- **Chat Interface**: Streamlit `st.chat_message` with full history
- **Sidebar Dashboard**: Shows catalog stats, active filters, context summary
- **Suggested Queries**: One-click starter queries in sidebar
- **Reset Button**: Start a fresh search anytime
- **Responsive Product Grid**: 2-column card layout with images

---

## How Context Management Works

**This is a critical design feature**: the conversation context is NEVER lost.

### Mechanism

```
Turn 1: "I need a sofa for living room"
         → Filters: {room: living_room, type: sofa}

Turn 2: "Under 30000"
         → Filters: {room: living_room, type: sofa, budget_max: 30000}
         (budget_max ADDED, previous filters PRESERVED)

Turn 3: "In warm colors"
         → Filters: {room: living_room, type: sofa, budget_max: 30000, color: warm}
         (color ADDED, all previous PRESERVED)

Turn 4: "Actually make it a bedroom"
         → Filters: {room: bedroom, type: sofa, budget_max: 30000, color: warm}
         (room UPDATED, rest PRESERVED)

Turn 5: "Start over"
         → Filters: {}
         (ALL cleared)
```

### Implementation Details

| Component | Storage | Purpose |
|---|---|---|
| `st.session_state.messages` | List of {role, content, products} | Full chat history — survives reruns |
| `st.session_state.active_filters` | Dict of current filters | Accumulated search criteria |
| `st.session_state.search_history` | List of past filter snapshots | Track previous searches |
| `st.session_state.last_products` | List of product dicts | Last shown products |

The **Gemini LLM** receives:
1. The **full conversation history** (all previous messages)
2. A **system note** with current accumulated filters
3. The **new user message**

This ensures the LLM has complete context to make intelligent decisions about filter updates.

---

## Project Structure

```
A2S/
├── app.py                          # Streamlit entry point
├── config.py                       # Configuration (API keys, settings, domain values)
├── requirements.txt                # Python dependencies
├── README.md                       # This documentation
│
├── design_products_data (1).xlsx   # Data source 1 (136 products)
├── design_products_with_dimension.xlsx  # Data source 2 (1,014 products with dimensions)
│
├── agent/                          # AI Agent modules
│   ├── __init__.py
│   ├── core.py                     # Main agent orchestrator
│   ├── context.py                  # Context/session management
│   └── prompts.py                  # Gemini system prompts
│
├── data/                           # Data processing modules
│   ├── __init__.py
│   ├── loader.py                   # Excel loader, merger, cleaner
│   ├── filter_engine.py            # Multi-criteria smart filtering
│   └── ranker.py                   # Relevance scoring & ranking
│
├── utils/                          # Utility modules
│   ├── __init__.py
│   ├── formatters.py               # Product card display formatting
│   └── validators.py               # Input sanitization & validation
│
└── docs/                           # Documentation & diagrams
    └── architecture/               # Architecture diagrams (PNG + Mermaid)
        ├── 01_system_architecture.png / .mmd
        ├── 02_conversation_flow.png / .mmd
        ├── 03_intent_and_nlu.png / .mmd
        ├── 04_data_pipeline.png / .mmd
        └── 05_project_structure.png / .mmd
```

---

## Module Documentation

### `config.py`
Centralizes all configuration:
- **GEMINI_API_KEY**: Google Gemini API key (from env var or default)
- **GEMINI_MODEL**: Model name (`gemini-2.0-flash`)
- **DATA_FILES**: Paths to both Excel data sources
- **CANONICAL_COLUMNS**: Standard column names after merging
- **Domain values**: Room types, styles, color palettes, product types, etc.
- **UI settings**: App title, icon, description

### `data/loader.py`
**Purpose**: Load, merge, clean, and enrich both Excel files.

Key functions:
- `load_product_catalog()` — Main entry point. Cached with `@st.cache_data`.
  - Reads both `.xlsx` files
  - Standardizes column names (e.g., `DIMENSION(CM)` → `dimensions`)
  - Drops empty columns and null rows
  - Cleans junk brand names (HTML artifacts → "Unknown")
  - Parses dimension strings (e.g., "322x98x48" → width=322, depth=98, height=48)
  - Normalizes text to lowercase
  - Deduplicates by `product_id`

- `_parse_dimensions(dim_str)` — Regex parser for dimension strings. Handles formats like:
  - `"322x98x48"` → W=322, D=98, H=48
  - `"160 x 200 cm"` → W=160, D=200
  - `"45x45cm"` → W=45, D=45

- `get_catalog_summary(catalog)` — Returns stats dict for sidebar display.

### `data/filter_engine.py`
**Purpose**: Apply multi-criteria filtering to the product catalog.

Function: `filter_products(catalog, filters)`
- **Text filters** (fuzzy/substring match): room_type, style, color_palette, product_type, brand, decor_type, role_in_design
- **Numeric filters** (range queries): budget_min/max, min/max_width, min/max_depth, min/max_height
- **Keyword search**: Free-text across product_name and brand
- Supports **multi-value OR** matching (e.g., `product_type: ["sofa", "bed"]`)

### `data/ranker.py`
**Purpose**: Score and rank filtered products by relevance.

Function: `rank_products(products, filters, top_n=5)`

Scoring weights:
| Factor | Weight | Description |
|---|---|---|
| Price closeness to budget midpoint | 30% | Closer to ideal price = higher score |
| Exact product_type match | 25% | Asked for "sofa", is a sofa |
| Exact room_type match | 15% | Matches target room |
| Exact style match | 10% | Matches desired style |
| Exact color_palette match | 10% | Matches color preference |
| Has valid image | 5% | Products with images rank higher |
| Has dimension data | 5% | Products with size info rank higher |

### `agent/core.py`
**Purpose**: The brain — orchestrates Gemini calls, parsing, filtering, ranking.

Function: `process_message(user_message, catalog)`
1. Builds conversation history for Gemini API
2. Injects current accumulated filters as system context
3. Calls Gemini with JSON response mode
4. Parses structured JSON (with fallback handling)
5. Updates accumulated filters
6. Runs filter engine + ranker
7. If no results, relaxes filters automatically
8. Returns response text + product list

Filter relaxation order: decor_type → role_in_design → style → color_palette → brand

### `agent/context.py`
**Purpose**: Session state management — ensures context is never lost.

Key functions:
- `init_context()` — Initialize all session state keys
- `add_message(role, content, products)` — Append to history
- `get_messages_for_llm()` — Format history for Gemini API (maps "assistant" → "model")
- `update_filters(new_filters)` — Merge new filters into active set (None values don't clear)
- `reset_filters()` — Clear all (saves snapshot to search_history first)
- `get_context_summary()` — Human-readable summary for sidebar

### `agent/prompts.py`
**Purpose**: System prompts that instruct Gemini on its role and response format.

The system prompt tells Gemini to:
1. Act as an interior design product advisor
2. Extract structured JSON filters from natural language
3. Accumulate filters across conversation turns
4. Return a strict JSON format: `{filters, response_text, show_products, is_reset}`

### `utils/formatters.py`
**Purpose**: Render product cards in Streamlit.

- `display_product_cards(products)` — 2-column grid of cards with image, price, dims, tags, buy link
- `format_product_summary(products)` — Text summary for conversation history

### `utils/validators.py`
**Purpose**: Input sanitization and validation.

- `sanitize_message(message)` — Strip, truncate, clean user input
- `validate_filters(filters)` — Type-check and clean filter values
- `is_valid_url(url)` — URL validation

---

## Data Pipeline

### Source Files

| File | Rows | Key Difference |
|---|---|---|
| `design_products_data (1).xlsx` | 136 | Basic product data, sparse dimensions |
| `design_products_with_dimension.xlsx` | 1,014 | Rich dimension data (`DIMENSION(CM)`: "322x98x48"), more brands |

### Merge Process

1. **Load** both files with `openpyxl`
2. **Standardize** column name `DIMENSION(CM)` → `dimensions`
3. **Concatenate** into single DataFrame
4. **Drop** rows missing `product_id`
5. **Clean** brand names (remove HTML artifact strings)
6. **Parse** dimensions into `width_cm`, `depth_cm`, `height_cm`
7. **Normalize** text columns to lowercase
8. **Deduplicate** by `product_id` (keep first occurrence)
9. **Select** canonical columns only
10. **Cache** with `@st.cache_data` (loaded once, reused across reruns)

### Result
~1,100+ unique products with clean, searchable, filterable data.

---

## Filter & Ranking System

### Filtering (AND logic)

All active filters are combined with AND logic:
```
room_type=living_room AND product_type=sofa AND price<=30000 AND color=warm
```

Text matches use **fuzzy substring matching** (case-insensitive), so "living" matches "living_room".

### Ranking (weighted scoring)

After filtering, products are scored 0.0–1.0 and top N returned:
- Budget fit (30%): How close is the price to the target budget midpoint
- Product type match (25%): Exact type match
- Room match (15%): Exact room match
- Style match (10%): Exact style match
- Color match (10%): Exact color match
- Has image (5%): Visual products rank higher
- Has dimensions (5%): Size-documented products rank higher

---

## Setup & Installation

### Prerequisites
- Python 3.10+
- Google Gemini API key (already configured)

### Install

```bash
cd /Users/manjunadhpadarthi/Desktop/A2S

# Create virtual environment (recommended)
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### Run

```bash
streamlit run app.py
```

The app opens at `http://localhost:8501`.

### Environment Variables (Optional)

```bash
export GEMINI_API_KEY="your-api-key-here"
```

If not set, the default key in `config.py` is used.

---

## Usage Examples

### Example 1: Basic Product Search
```
User: "I need a sofa for my living room"
Agent: Shows top 5 sofas for living rooms, with prices and links

User: "Under 30000"
Agent: Refines to show only sofas ≤ ₹30,000 (remembers living room context)

User: "In warm colors"
Agent: Further refines to warm-palette sofas under ₹30,000 for living rooms
```

### Example 2: Size-Aware Search
```
User: "I need a bed for a small bedroom, max 160cm wide"
Agent: Filters beds where width_cm ≤ 160

User: "Show me some lighting too"
Agent: Adds lighting products while keeping bedroom + size context
```

### Example 3: Brand-Specific
```
User: "Show me IKEA products for a modern study"
Agent: Filters brand=IKEA, room=study, style=modern

User: "What about other brands?"
Agent: Removes brand filter, keeps room + style
```

### Example 4: Design Advice
```
User: "What paint colors go well with dark wood furniture?"
Agent: Provides design advice + suggests matching paint brands from catalog
```

---

## Configuration

All settings are in `config.py`:

| Setting | Default | Description |
|---|---|---|
| `GEMINI_MODEL` | `gemini-2.0-flash` | Gemini model to use |
| `MAX_RESULTS_PER_QUERY` | `5` | Products shown per response |
| `MAX_CONTEXT_MESSAGES` | `50` | Max messages in context window |
| `TEMPERATURE` | `0.7` | LLM creativity (0=focused, 1=creative) |
| `TOP_P` | `0.95` | Nucleus sampling parameter |

---

## Troubleshooting

| Issue | Solution |
|---|---|
| "No module named google.generativeai" | Run `pip install google-generativeai` |
| "No module named openpyxl" | Run `pip install openpyxl` |
| Excel file not found | Ensure both `.xlsx` files are in the project root |
| Gemini API error | Check API key in `config.py` or set `GEMINI_API_KEY` env var |
| No products found | Try broader criteria (remove color/style filters) |
| Context lost | Context lives in `st.session_state` — don't refresh the browser page |

---

## Tech Stack

| Component | Technology |
|---|---|
| LLM | Google Gemini 2.0 Flash |
| Frontend | Streamlit |
| Data Processing | Pandas + openpyxl |
| Language | Python 3.10+ |
| Context Storage | Streamlit Session State |

---

*Built with care for the A2S project.*
