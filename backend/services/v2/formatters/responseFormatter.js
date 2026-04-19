export function toCampusBotResponse(lastMessage) {
  return {
    response: lastMessage.content,
    metadata: lastMessage.additional_kwargs?.metadata || null,
    query_type: lastMessage.additional_kwargs?.query_type || null,
    source: lastMessage.additional_kwargs?.source || null,
  };
}
