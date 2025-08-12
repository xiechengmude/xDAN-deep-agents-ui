# Deep Agents UI

Deep Agents are generic AI agents that are capable of handling tasks of varying complexity. This is a UI intended to be used alongside the [`deep-agents`](https://github.com/hwchase17/deepagents?ref=blog.langchain.com) package from LangChain.

TODO: Link Video

## Local Development

Create a `.env.local` file and set two variables

```env
DEPLOYMENT_URL="your agent server URL, http://127.0.0.1:2024 for locally running agents"
AGENT_ID=<your agent ID from langgraph.json>
```

Install all dependencies and run your app.

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to test out your deep agent!
