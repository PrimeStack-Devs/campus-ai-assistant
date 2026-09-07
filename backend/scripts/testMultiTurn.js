async function testMultiTurn() {
  const session = 'test_multi_turn_' + Date.now();
  console.log('--- Turn 1: Asking about PIET main building ---');
  const res1 = await fetch('http://localhost:5000/api/v2/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: 'Where is PIET main building?',
      sessionId: session,
    }),
  }).then((r) => r.json());
  console.log('Answer 1:\n', res1.reply);

  console.log('\n--- Turn 2: Follow-up: "What departments are in it?" ---');
  const res2 = await fetch('http://localhost:5000/api/v2/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: 'What departments are in it?',
      sessionId: session,
    }),
  }).then((r) => r.json());
  console.log('Answer 2:\n', res2.reply);
}

testMultiTurn();
