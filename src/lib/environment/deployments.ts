export function getDeployment() {
  return {
    name: "Deep Agent",
    deploymentUrl: process.env.DEPLOYMENT_URL || "http://127.0.0.1:2024",
    agentId: process.env.AGENT_ID || "deepagent",
  };
}
