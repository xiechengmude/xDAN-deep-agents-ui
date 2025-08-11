import { Client } from "@langchain/langgraph-sdk"
import { getDeployment } from "./environment/deployments"

export function createClient(accessToken: string) {
  const deployment = getDeployment()
  return new Client({
    apiUrl: deployment?.deploymentUrl || "",
    defaultHeaders: {
      Authorization: `Bearer ${accessToken}`,
      "x-auth-scheme": "langsmith"
    }
  })
}