import type { AgentConfig } from "@/config/agents.schema";
import type { RequestRecord } from "@/types/request";
import type { MessageRecord } from "@/types/message";

export function buildRequestContext(request: RequestRecord): string {
  const dataLeaves =
    request.data_leaves_company === null
      ? "Unknown"
      : request.data_leaves_company
      ? "Yes"
      : "No";

  const systemAccess =
    request.requires_system_access === null
      ? "Unknown"
      : request.requires_system_access
      ? "Yes"
      : "No";

  const intakeAnswers =
    request.intake_questions && request.intake_answers
      ? request.intake_questions
          .map((q) => {
            const answer = request.intake_answers?.find(
              (a) => a.questionId === q.id
            );
            return `Q: ${q.question}\nA: ${answer?.answer ?? "(not answered)"}`;
          })
          .join("\n\n")
      : "None";

  return `
## Tool Request Details

**Tool Name:** ${request.tool_name}
**Tool URL:** ${request.tool_url ?? "Not provided"}
**Requester:** ${request.requester_name} (${request.requester_team}${request.requester_role ? ` — ${request.requester_role}` : ""})
**Business Justification:** ${request.business_justification}
**Data Types Processed:** ${request.data_types.join(", ")}
**Number of Users:** ${request.user_count}
**Data Leaves Company Systems:** ${dataLeaves}
**System/Network Access Required:** ${systemAccess}
**Estimated Cost:** ${request.estimated_cost ?? "Not provided"}
**Replaces Existing Tool:** ${request.replaces_tool ?? "No"}
**Vendor Documentation URL:** ${request.existing_docs_url ?? "Not provided"}

## Clarification Answers
${intakeAnswers}
`.trim();
}

export function buildDiscussionHistory(messages: MessageRecord[]): string {
  if (messages.length === 0) return "";

  const lines = messages.map((msg) => {
    const roundLabel = msg.round ? ` (Round ${msg.round})` : "";
    return `### ${msg.agent_name}${roundLabel}\n${msg.content}`;
  });

  return `## Prior Discussion\n\n${lines.join("\n\n")}`;
}

export function interpolatePrompt(
  template: string,
  agent: AgentConfig,
  requestContext: string,
  discussionHistory: string
): string {
  return template
    .replace("{{requestContext}}", requestContext)
    .replace("{{discussionHistory}}", discussionHistory)
    .replace("{{dealbreakers}}", agent.dealbreakers.map((d) => `- ${d}`).join("\n"))
    .replace("{{requiredQuestions}}", agent.requiredQuestions.map((q) => `- ${q}`).join("\n"));
}
